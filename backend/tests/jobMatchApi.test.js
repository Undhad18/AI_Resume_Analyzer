/**
 * API Integration Test Suite: Job Matching & Score Reports (Lesson 9.2 & 9.3)
 * Tests endpoint handlers, tenant isolation, score calculation, report retrieval, and MySQL persistence.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import db from "../config/db.js";
import { STORAGE_DIR } from "../config/multerConfig.js";
import {
  createJobMatchHandler,
  getJobMatchHandler,
  listJobMatchesHandler,
  calculateScoreHandler,
  getJobMatchReportHandler
} from "../controllers/jobMatchingController.js";
import { getJobMatchReportById } from "../services/jobMatchReportService.js";

console.log("\n=================================================");
console.log("   AI RESUME ANALYZER - JOB MATCH API TESTS      ");
console.log("=================================================\n");

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

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
};

let userAId = null;
let userBId = null;
let resumeAId = null;
let jdId = null;
let createdMatchId = null;
const dummyDiskFile = path.join(STORAGE_DIR, "match_test_alice.pdf");

try {
  // Ensure dummy file exists on disk
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  fs.writeFileSync(dummyDiskFile, "%PDF-1.4 dummy pdf content for matching test");

  // 1. Create User A and User B
  const [userARows] = await db.execute("SELECT user_id FROM users WHERE email = 'match_api_a@example.com'");
  if (userARows.length > 0) {
    userAId = userARows[0].user_id;
  } else {
    const [res] = await db.execute(
      "INSERT INTO users (role_id, name, email, password_hash, account_status) VALUES (2, 'Candidate User A', 'match_api_a@example.com', 'hash', 'active')"
    );
    userAId = res.insertId;
  }

  const [userBRows] = await db.execute("SELECT user_id FROM users WHERE email = 'match_api_b@example.com'");
  if (userBRows.length > 0) {
    userBId = userBRows[0].user_id;
  } else {
    const [res] = await db.execute(
      "INSERT INTO users (role_id, name, email, password_hash, account_status) VALUES (2, 'Candidate User B', 'match_api_b@example.com', 'hash', 'active')"
    );
    userBId = res.insertId;
  }

  // 2. Create Resume for User A
  const sampleExtractedText = `
Alice Engineer
alice@example.com

SKILLS
React.js, JavaScript, Node.js, Express.js, PostgreSQL

EXPERIENCE
Senior Frontend Engineer at Tech Corp
Built scalable web apps using React.js and TypeScript.

EDUCATION
Bachelor of Science in Computer Science, Tech State University

PROJECTS
Cloud Dashboard
Engineered real-time dashboard using Node.js and PostgreSQL.

CERTIFICATIONS
AWS Certified Cloud Practitioner
  `;

  const [resumeRes] = await db.execute(
    "INSERT INTO resumes (user_id, resume_title, candidate_name, extracted_text, status) VALUES (?, 'Alice Resume', 'Alice Engineer', ?, 'completed')",
    [userAId, sampleExtractedText]
  );
  resumeAId = resumeRes.insertId;

  await db.execute(
    "INSERT INTO resume_files (resume_id, file_name, file_path, file_type, file_purpose, file_size) VALUES (?, 'resume.pdf', 'resumes/match_test_alice.pdf', 'pdf', 'original', 1024)",
    [resumeAId]
  );

  // 3. Create Job Description
  const jdContent = `
Job Title: Full Stack Developer
Company: Horizon Cloud
Requirements:
- 3+ years experience in React and Node.js
- Proficiency in PostgreSQL database
- Experience with REST API design
- Bachelor degree in Computer Science
- AWS Certification preferred
Responsibilities:
- Build responsive web applications
- Design scalable backend microservices
  `;

  const [jdRes] = await db.query(
    `INSERT INTO job_descriptions (
      user_id, job_title, company_name, job_description, experience_required, location
    ) VALUES (?, 'Full Stack Developer', 'Horizon Cloud', ?, '3+ years', 'Remote')`,
    [userAId, jdContent]
  );
  jdId = jdRes.insertId;

  // Test 1: Unauthenticated request rejected with 401
  await runTest("Test 1: Unauthenticated matching request rejected with 401", async () => {
    const mockReq = { user: null, body: { resumeId: resumeAId, jobDescriptionId: jdId } };
    const mockRes = createMockRes();

    await createJobMatchHandler(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 401);
  });

  // Test 2: Authenticated user can execute matching and receives complete score report
  await runTest("Test 2: Authenticated matching executes and returns complete score report", async () => {
    const mockReq = {
      user: { id: userAId },
      body: {
        resumeId: resumeAId,
        jobDescriptionId: jdId,
        mode: "free"
      }
    };
    const mockRes = createMockRes();

    await createJobMatchHandler(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 201);
    assert.equal(mockRes.body.success, true);

    const data = mockRes.body.data;
    createdMatchId = data.matchId;
    assert.ok(createdMatchId);
    assert.ok(typeof data.overallScore === "number");
    assert.ok(data.overallScore >= 0 && data.overallScore <= 100);
    assert.ok(data.scoreLabel);
    assert.ok(data.categoryScores);
    assert.ok(data.keywords);
    assert.ok(Array.isArray(data.keywords.matched));
    assert.ok(Array.isArray(data.strengths));
  });

  // Test 3: Database persistence verified in job_matches table
  await runTest("Test 3: Matching score and analysis confirmed in MySQL database", async () => {
    const [rows] = await db.query(
      "SELECT match_id, user_id, match_score, matched_skills, match_analysis FROM job_matches WHERE match_id = ?",
      [createdMatchId]
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0].user_id, userAId);
    assert.ok(rows[0].match_score !== null);
    assert.ok(rows[0].match_analysis !== null);
  });

  // Test 4: GET /api/job-matches/:id returns match details and report
  await runTest("Test 4: GET /api/job-matches/:id retrieves matching record and score", async () => {
    const mockReq = { user: { id: userAId }, params: { id: createdMatchId } };
    const mockRes = createMockRes();

    await getJobMatchHandler(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(mockRes.body.success, true);
    assert.equal(mockRes.body.data.matchId, createdMatchId);
    assert.ok(mockRes.body.data.overallScore !== null);
  });

  // Test 5: POST /api/job-matches/:id/score recalculates and persists updated score
  await runTest("Test 5: POST /api/job-matches/:id/score recalculates score successfully", async () => {
    const mockReq = { user: { id: userAId }, params: { id: createdMatchId } };
    const mockRes = createMockRes();

    await calculateScoreHandler(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(mockRes.body.success, true);
    assert.ok(mockRes.body.data.overallScore !== undefined);
  });

  // Test 6: GET /api/job-matches/:id/report retrieves structured report
  await runTest("Test 6: GET /api/job-matches/:id/report returns structured report", async () => {
    const mockReq = { user: { id: userAId }, params: { id: createdMatchId } };
    const mockRes = createMockRes();

    await getJobMatchReportHandler(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(mockRes.body.success, true);
    assert.equal(mockRes.body.data.matchId, createdMatchId);
    assert.ok(mockRes.body.data.keywords);
  });

  // Test 7: Multi-tenant isolation - User B cannot view User A's matching report
  await runTest("Test 7: Cross-tenant access rejected with 403 Forbidden", async () => {
    const mockReq = { user: { id: userBId }, params: { id: createdMatchId } };
    const mockRes = createMockRes();

    await getJobMatchReportHandler(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 403);
  });

  // Test 8: List user job matches includes matchScore
  await runTest("Test 8: GET /api/job-matches lists matches with matchScore", async () => {
    const mockReq = { user: { id: userAId }, query: { limit: 10 } };
    const mockRes = createMockRes();

    await listJobMatchesHandler(mockReq, mockRes);
    assert.equal(mockRes.statusCode, 200);
    assert.equal(mockRes.body.success, true);
    assert.ok(Array.isArray(mockRes.body.data));
    assert.ok(mockRes.body.data.length > 0);
    assert.ok(mockRes.body.data[0].matchScore !== null);
  });

} finally {
  // Cleanup test fixtures
  if (createdMatchId) {
    await db.query("DELETE FROM job_matches WHERE match_id = ?", [createdMatchId]);
  }
  if (jdId) {
    await db.query("DELETE FROM job_descriptions WHERE job_id = ?", [jdId]);
  }
  if (resumeAId) {
    await db.query("DELETE FROM resumes WHERE resume_id = ?", [resumeAId]);
  }
  if (userAId) {
    await db.query("DELETE FROM users WHERE user_id = ?", [userAId]);
  }
  if (userBId) {
    await db.query("DELETE FROM users WHERE user_id = ?", [userBId]);
  }
  if (fs.existsSync(dummyDiskFile)) {
    try { fs.unlinkSync(dummyDiskFile); } catch {}
  }
}

console.log("\n-------------------------------------------------");
console.log(`TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
console.log("-------------------------------------------------\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
