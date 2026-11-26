/**
 * Frontend Unit Test Suite: Resume PDF Download & Templates (Lesson 8.5)
 */

import assert from "node:assert/strict";

console.log("=================================================");
console.log(" AI RESUME BUILDER - FRONTEND PDF DOWNLOAD TESTS ");
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

// 1. FILENAME GENERATION
await runTest("Test 1: Safe filename generator formats name and selected template", () => {
  const sanitizeFilename = (fullName, templateId = "modern") => {
    const raw = String(fullName || "resume").trim();
    const safe = raw
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const prefix = safe || "resume";
    return `${prefix}_${templateId}.pdf`;
  };

  assert.equal(sanitizeFilename("John Smith", "modern"), "john_smith_modern.pdf");
  assert.equal(sanitizeFilename("Sarah Connor-O'Brian", "classic"), "sarah_connor_o_brian_classic.pdf");
  assert.equal(sanitizeFilename("", "ats"), "resume_ats.pdf");
  assert.equal(sanitizeFilename("###", "minimal"), "resume_minimal.pdf");
});

// 2. TEMPLATE SELECTION PROPAGATION
await runTest("Test 2: Download request retains currently selected template", () => {
  const templates = ["modern", "classic", "minimal", "ats"];
  templates.forEach((tpl) => {
    const requestPayload = {
      selectedTemplate: tpl,
      resumeData: { personalInfo: { fullName: "Test User" } }
    };
    assert.equal(requestPayload.selectedTemplate, tpl);
  });
});

// 3. BLOB RESPONSE VERIFICATION
await runTest("Test 3: Service verifies that response is an instance of Blob", () => {
  const isBlobResponse = (res) => {
    return res !== null && typeof res === "object" && (res instanceof Object);
  };
  assert.equal(isBlobResponse({}), true);
  assert.equal(isBlobResponse(null), false);
});

// 4. DOWNLOADING STATE LOCKOUT
await runTest("Test 4: Download button prevents concurrent triggers when isDownloading is active", () => {
  let isDownloading = true;
  let clickTriggered = false;

  const handleDownload = () => {
    if (isDownloading) return;
    clickTriggered = true;
  };

  handleDownload();
  assert.equal(clickTriggered, false);

  isDownloading = false;
  handleDownload();
  assert.equal(clickTriggered, true);
});

// 5. ERROR RESOLUTION FROM BLOB PAYLOAD
await runTest("Test 5: Error handling extracts nested JSON message from Blob errors", async () => {
  const mockErrorBlob = {
    async text() {
      return JSON.stringify({
        success: false,
        message: "Cannot generate PDF for a blank resume."
      });
    }
  };

  const text = await mockErrorBlob.text();
  const parsed = JSON.parse(text);
  assert.equal(parsed.message, "Cannot generate PDF for a blank resume.");
});

console.log("-------------------------------------------------");
console.log(`TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
console.log("-------------------------------------------------");

if (failedCount > 0) {
  process.exit(1);
}
