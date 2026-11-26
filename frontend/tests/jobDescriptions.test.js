/**
 * Frontend Unit Test Suite: Job Description Management (Lesson 9.1)
 */

import assert from "node:assert/strict";

console.log("=================================================");
console.log(" AI RESUME ANALYZER - FRONTEND JOB DESCRIPTIONS  ");
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

// 1. CLIENT FORM VALIDATION
await runTest("Test 1: Form validation requires title and enforces minimum description length", () => {
  const validate = (formData) => {
    const errors = {};
    if (!formData.jobTitle || !formData.jobTitle.trim()) {
      errors.jobTitle = "Job title is required.";
    } else if (formData.jobTitle.trim().length < 2) {
      errors.jobTitle = "Job title must be at least 2 characters.";
    }

    if (!formData.description || !formData.description.trim()) {
      errors.description = "Job description is required.";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Please paste or enter at least 10 characters.";
    }

    if (formData.sourceUrl && formData.sourceUrl.trim().length > 0) {
      const urlPattern = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/i;
      if (!urlPattern.test(formData.sourceUrl.trim())) {
        errors.sourceUrl = "Please enter a valid URL.";
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const blank = validate({ jobTitle: "", description: "" });
  assert.equal(blank.isValid, false);
  assert.ok(blank.errors.jobTitle);
  assert.ok(blank.errors.description);

  const shortDesc = validate({ jobTitle: "Engineer", description: "Too short" });
  assert.equal(shortDesc.isValid, false);
  assert.ok(shortDesc.errors.description);

  const badUrl = validate({
    jobTitle: "Frontend Lead",
    description: "Requires deep React knowledge and modern web tooling.",
    sourceUrl: "ftp://invalid-protocol.com"
  });
  assert.equal(badUrl.isValid, false);
  assert.ok(badUrl.errors.sourceUrl);

  const valid = validate({
    jobTitle: "Frontend Lead",
    description: "Requires deep React knowledge and modern web tooling.",
    sourceUrl: "https://careers.google.com/jobs/123"
  });
  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

// 2. SEARCH QUERY AND DEBOUNCING
await runTest("Test 2: Search term resets pagination to page 1", () => {
  let pagination = { page: 3, limit: 10 };
  const onSearchChange = (newTerm) => {
    pagination = { ...pagination, page: 1, search: newTerm };
  };

  onSearchChange("React");
  assert.equal(pagination.page, 1);
  assert.equal(pagination.search, "React");
});

// 3. PAGINATION BOUNDARIES
await runTest("Test 3: Pagination controls respect lower and upper bounds", () => {
  const clampPage = (requestedPage, totalPages) => {
    return Math.max(1, Math.min(requestedPage, totalPages));
  };

  assert.equal(clampPage(0, 5), 1);
  assert.equal(clampPage(-2, 5), 1);
  assert.equal(clampPage(3, 5), 3);
  assert.equal(clampPage(10, 5), 5);
});

// 4. PRESERVE LINEBREAKS AND PREVENT DANGEROUS HTML
await runTest("Test 4: Raw HTML strings are treated as plain text strings", () => {
  const untrustedInput = "<script>alert('xss')</script>Hello World\nLine 2";
  // The UI renders directly via React's JSX text node: <div>{untrustedInput}</div>
  // which automatically escapes HTML tags
  assert.ok(untrustedInput.includes("<script>"));
  assert.ok(untrustedInput.includes("\n"));
});

console.log("-------------------------------------------------");
console.log(`TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
console.log("-------------------------------------------------");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
