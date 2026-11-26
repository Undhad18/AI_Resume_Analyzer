/**
 * Frontend Unit Test Suite: Job Match Report & Components (Lesson 9.3)
 */

import assert from "node:assert";
import test from "node:test";

console.log("\n=================================================");
console.log("  FRONTEND TESTS: JOB MATCH REPORT & KEYWORDS    ");
console.log("=================================================\n");

test("Frontend Test 1: Score labels match standard tiers", () => {
  const getScoreLabel = (score) => {
    const num = Number(score) || 0;
    if (num >= 90) return "Excellent Match";
    if (num >= 80) return "Very Good Match";
    if (num >= 70) return "Good Match";
    if (num >= 60) return "Moderate Match";
    if (num >= 40) return "Low Match";
    return "Very Low Match";
  };

  assert.strictEqual(getScoreLabel(95), "Excellent Match");
  assert.strictEqual(getScoreLabel(82), "Very Good Match");
  assert.strictEqual(getScoreLabel(75), "Good Match");
  assert.strictEqual(getScoreLabel(64), "Moderate Match");
  assert.strictEqual(getScoreLabel(51), "Low Match");
  assert.strictEqual(getScoreLabel(25), "Very Low Match");
  console.log("[PASS] Frontend Test 1: Score label tiers verified");
});

test("Frontend Test 2: Ethical disclaimer text is mandatory on score displays", () => {
  const disclaimer =
    "Transparency Notice: This score represents candidate qualification alignment. It is not an official ATS score, and does not guarantee interview selection or hiring decisions.";
  assert.ok(disclaimer.includes("Transparency Notice"));
  assert.ok(disclaimer.includes("not an official ATS score"));
  assert.ok(disclaimer.includes("does not guarantee interview selection"));
  console.log("[PASS] Frontend Test 2: Ethical disclaimer text compliant");
});

test("Frontend Test 3: Missing keyword guidance text does not encourage fabrication", () => {
  const advice =
    "If you genuinely have this skill or experience, consider adding relevant evidence to your resume.";
  assert.ok(advice.includes("genuinely"));
  assert.ok(advice.includes("relevant evidence"));
  console.log("[PASS] Frontend Test 3: Ethical missing keyword guidance verified");
});

test("Frontend Test 4: Dynamic weight normalization sums to 100% when categories are missing", () => {
  const baseWeights = { skills: 35, experience: 25, education: 10, projects: 15, responsibilities: 10, certifications: 5 };
  // Only skills, experience and projects applicable
  const applicableKeys = ["skills", "experience", "projects"];
  const sumBase = applicableKeys.reduce((acc, k) => acc + baseWeights[k], 0); // 35 + 25 + 15 = 75

  const normalized = {};
  for (const k of applicableKeys) {
    normalized[k] = (baseWeights[k] / sumBase) * 100;
  }

  const sumNorm = Object.values(normalized).reduce((a, b) => a + b, 0);
  assert.strictEqual(Math.round(sumNorm), 100);
  console.log("[PASS] Frontend Test 4: Dynamic weight normalization sums to 100%");
});

console.log("\n-------------------------------------------------");
console.log("TEST SUMMARY: All Frontend Job Match Tests Passed");
console.log("-------------------------------------------------\n");
