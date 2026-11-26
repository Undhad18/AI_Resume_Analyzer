/**
 * Automated Test Suite: Job Description Input & Management (Lesson 9.1)
 */

import assert from "node:assert/strict";
import db from "../config/db.js";
import {
  createJobDescription,
  listJobDescriptions,
  getJobDescriptionById,
  updateJobDescription,
  deleteJobDescription
} from "../services/jobDescriptionService.js";
import {
  createJobDescriptionSchema,
  updateJobDescriptionSchema,
  listJobDescriptionsQuerySchema
} from "../validators/jobDescriptionSchema.js";
import {
  createJobDescriptionHandler,
  listJobDescriptionsHandler,
  getJobDescriptionHandler,
  updateJobDescriptionHandler,
  deleteJobDescriptionHandler
} from "../controllers/jobDescriptionController.js";

console.log("=================================================");
console.log(" AI RESUME ANALYZER - JOB DESCRIPTIONS TESTS     ");
console.log("=================================================");

let passedCount = 0;
let failedCount = 0;

const runTest = async (name, fn) => {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    failedCount++;
  }
};

// Seed two test users for strict multi-tenant tests
let userA_Id = null;
let userB_Id = null;
let createdJobA_Id = null;

try {
  // Ensure table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS job_descriptions (
      job_id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      job_title VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NULL,
      experience_required VARCHAR(100) NULL,
      location VARCHAR(255) NULL,
      job_description MEDIUMTEXT NOT NULL,
      source_url VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_jd_user (user_id),
      INDEX idx_jd_created (created_at),
      INDEX idx_jd_title (job_title),
      INDEX idx_jd_company (company_name),
      CONSTRAINT fk_jd_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Check or create test user A
  const [userARows] = await db.execute("SELECT user_id FROM users WHERE email = 'test_jd_user_a@example.com'");
  if (userARows.length > 0) {
    userA_Id = userARows[0].user_id;
  } else {
    const [res] = await db.execute(
      "INSERT INTO users (role_id, name, email, password_hash, account_status) VALUES (2, 'User A', 'test_jd_user_a@example.com', 'hash', 'active')"
    );
    userA_Id = res.insertId;
  }

  // Check or create test user B
  const [userBRows] = await db.execute("SELECT user_id FROM users WHERE email = 'test_jd_user_b@example.com'");
  if (userBRows.length > 0) {
    userB_Id = userBRows[0].user_id;
  } else {
    const [res] = await db.execute(
      "INSERT INTO users (role_id, name, email, password_hash, account_status) VALUES (2, 'User B', 'test_jd_user_b@example.com', 'hash', 'active')"
    );
    userB_Id = res.insertId;
  }

  // Clean up any stale test job descriptions
  await db.execute("DELETE FROM job_descriptions WHERE user_id IN (?, ?)", [userA_Id, userB_Id]);
} catch (setupError) {
  console.error("Test setup error:", setupError);
  process.exit(1);
}

// 1. CREATE VALID JOB DESCRIPTION
await runTest("Test 1: Create a valid job description with full metadata", async () => {
  const job = await createJobDescription({
    userId: userA_Id,
    jobTitle: "Senior React Developer",
    companyName: "Acme Cloud Corp",
    experienceRequired: "5+ years",
    location: "San Francisco, CA (Remote)",
    description: "We are seeking a seasoned frontend architect proficient in React 19, TypeScript, and state management.",
    sourceUrl: "https://acme.com/jobs/react-dev"
  });

  assert.ok(job.id);
  assert.equal(job.user_id, userA_Id);
  assert.equal(job.job_title, "Senior React Developer");
  assert.equal(job.company_name, "Acme Cloud Corp");
  assert.equal(job.source_url, "https://acme.com/jobs/react-dev");
  createdJobA_Id = job.id;
});

// 2. VALIDATION - MISSING JOB TITLE
await runTest("Test 2: Schema rejects missing or whitespace-only job title", () => {
  const res1 = createJobDescriptionSchema.safeParse({
    jobTitle: "",
    description: "Valid description text here."
  });
  assert.equal(res1.success, false);

  const res2 = createJobDescriptionSchema.safeParse({
    jobTitle: "   ",
    description: "Valid description text here."
  });
  assert.equal(res2.success, false);
});

// 3. VALIDATION - EMPTY DESCRIPTION
await runTest("Test 3: Schema rejects short or empty job description", () => {
  const res = createJobDescriptionSchema.safeParse({
    jobTitle: "Valid Job Title",
    description: "Too short"
  });
  assert.equal(res.success, false);
});

// 4. VALIDATION - INVALID URL
await runTest("Test 4: Schema rejects malformed source URL", () => {
  const res = createJobDescriptionSchema.safeParse({
    jobTitle: "Valid Job Title",
    description: "Valid description text here with enough content.",
    sourceUrl: "not-a-valid-url"
  });
  assert.equal(res.success, false);
});

// 5. LIST USER'S JOB DESCRIPTIONS
await runTest("Test 5: List retrieves records belonging to the authenticated user", async () => {
  const listResult = await listJobDescriptions({
    userId: userA_Id,
    page: 1,
    limit: 10
  });

  assert.equal(listResult.jobDescriptions.length, 1);
  assert.equal(listResult.jobDescriptions[0].id, createdJobA_Id);
  assert.equal(listResult.pagination.total, 1);
});

// 6. SEARCH JOB DESCRIPTIONS
await runTest("Test 6: Search filters records by keyword across title, company, and location", async () => {
  // Add a second job description for User A
  await createJobDescription({
    userId: userA_Id,
    jobTitle: "Backend Python Engineer",
    companyName: "DataFlow Systems",
    location: "Austin, TX",
    description: "Develop resilient RESTful services with FastAPI, PostgreSQL, and Docker."
  });

  const searchReact = await listJobDescriptions({
    userId: userA_Id,
    search: "React"
  });
  assert.equal(searchReact.jobDescriptions.length, 1);
  assert.equal(searchReact.jobDescriptions[0].job_title, "Senior React Developer");

  const searchPython = await listJobDescriptions({
    userId: userA_Id,
    search: "DataFlow"
  });
  assert.equal(searchPython.jobDescriptions.length, 1);
  assert.equal(searchPython.jobDescriptions[0].job_title, "Backend Python Engineer");

  const searchNonexistent = await listJobDescriptions({
    userId: userA_Id,
    search: "NonexistentKeyword123"
  });
  assert.equal(searchNonexistent.jobDescriptions.length, 0);
});

// 7. VIEW INDIVIDUAL RECORD
await runTest("Test 7: Retrieve a specific job description by ID", async () => {
  const job = await getJobDescriptionById({
    id: createdJobA_Id,
    userId: userA_Id
  });

  assert.ok(job);
  assert.equal(job.id, createdJobA_Id);
  assert.equal(job.job_title, "Senior React Developer");
});

// 8. UPDATE EXISTING RECORD
await runTest("Test 8: Update an existing job description modifies allowed fields only", async () => {
  const updated = await updateJobDescription({
    id: createdJobA_Id,
    userId: userA_Id,
    updateData: {
      jobTitle: "Lead Frontend Engineer",
      experienceRequired: "7+ years",
      location: "Remote Only"
    }
  });

  assert.ok(updated);
  assert.equal(updated.job_title, "Lead Frontend Engineer");
  assert.equal(updated.experience_required, "7+ years");
  assert.equal(updated.location, "Remote Only");
  // Original description and company remain preserved
  assert.equal(updated.company_name, "Acme Cloud Corp");
});

// 9. REJECT UNAUTHENTICATED REQUESTS
await runTest("Test 9: Controller rejects unauthenticated requests with 401 status", async () => {
  let statusCode = null;
  const mockReq = { user: null };
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      return data;
    }
  };

  await listJobDescriptionsHandler(mockReq, mockRes);
  assert.equal(statusCode, 401);
});

// 10. MULTI-TENANT ISOLATION - USER A CANNOT VIEW USER B'S RECORD
await runTest("Test 10: Multi-tenant isolation prevents User B from viewing User A's record", async () => {
  const jobForUserB = await getJobDescriptionById({
    id: createdJobA_Id,
    userId: userB_Id // User B attempting to view User A's record
  });

  assert.equal(jobForUserB, null);
});

// 11. MULTI-TENANT ISOLATION - USER B CANNOT UPDATE USER A'S RECORD
await runTest("Test 11: Multi-tenant isolation prevents User B from updating User A's record", async () => {
  const updateResult = await updateJobDescription({
    id: createdJobA_Id,
    userId: userB_Id, // User B attempting update
    updateData: { jobTitle: "Malicious Hack Attempt" }
  });

  assert.equal(updateResult, null);

  // Verify User A's record remains unchanged
  const intact = await getJobDescriptionById({ id: createdJobA_Id, userId: userA_Id });
  assert.equal(intact.job_title, "Lead Frontend Engineer");
});

// 12. MULTI-TENANT ISOLATION - USER B CANNOT DELETE USER A'S RECORD
await runTest("Test 12: Multi-tenant isolation prevents User B from deleting User A's record", async () => {
  const deleteResult = await deleteJobDescription({
    id: createdJobA_Id,
    userId: userB_Id // User B attempting deletion
  });

  assert.equal(deleteResult, null);

  // Verify User A's record is still present
  const intact = await getJobDescriptionById({ id: createdJobA_Id, userId: userA_Id });
  assert.ok(intact);
});

// 13. REJECT INVALID RECORD IDS
await runTest("Test 13: Controller rejects non-numeric or invalid IDs with 400 status", async () => {
  let statusCode = null;
  const mockReq = {
    user: { id: userA_Id },
    params: { id: "invalid-id-string" }
  };
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      return data;
    }
  };

  await getJobDescriptionHandler(mockReq, mockRes);
  assert.equal(statusCode, 400);
});

// 14. NONEXISTENT RECORD RETURNS 404
await runTest("Test 14: Nonexistent record ID returns 404 status cleanly", async () => {
  let statusCode = null;
  const mockReq = {
    user: { id: userA_Id },
    params: { id: 999999999 }
  };
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      return data;
    }
  };

  await getJobDescriptionHandler(mockReq, mockRes);
  assert.equal(statusCode, 404);
});

// 15. DELETE EXISTING RECORD BY OWNER
await runTest("Test 15: Owner can delete their own job description", async () => {
  const deleted = await deleteJobDescription({
    id: createdJobA_Id,
    userId: userA_Id
  });

  assert.ok(deleted);
  assert.equal(deleted.id, createdJobA_Id);

  // Verify record no longer exists
  const check = await getJobDescriptionById({ id: createdJobA_Id, userId: userA_Id });
  assert.equal(check, null);
});

// Cleanup test users and records
try {
  await db.execute("DELETE FROM job_descriptions WHERE user_id IN (?, ?)", [userA_Id, userB_Id]);
  await db.execute("DELETE FROM users WHERE user_id IN (?, ?)", [userA_Id, userB_Id]);
} catch {
  // Silent cleanup
}

console.log("-------------------------------------------------");
console.log(`TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
console.log("-------------------------------------------------");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
