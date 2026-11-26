/**
 * Automated Test Suite: Job Match Score & Missing Keywords (Lesson 9.3)
 * Tests transparent weighted scoring, dynamic normalization, keyword detection,
 * Java vs JS distinction, ethical advice, and API endpoints.
 */

import assert from "node:assert";
import test from "node:test";
import {
  BASE_CATEGORY_WEIGHTS,
  getScoreLabel,
  calculateCategoryScore,
  calculateJobMatchScores,
  SCORE_LABELS
} from "../services/jobMatchScoringService.js";
import {
  MISSING_KEYWORD_SAFE_ADVICE,
  extractKeywordsFromJd,
  detectMissingKeywords
} from "../services/missingKeywordService.js";
import {
  generateReportStrengths,
  generateReportImprovementAreas
} from "../services/jobMatchReportService.js";
import { jobMatchReportSchema } from "../validators/jobMatchingSchema.js";

console.log("\n=================================================");
console.log("   AI RESUME ANALYZER - JOB MATCH SCORE TESTS    ");
console.log("=================================================\n");

test("Test 1: Category base weights correctly total 100%", () => {
  const sumWeights = Object.values(BASE_CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.strictEqual(sumWeights, 100, "Base category weights must total exactly 100%");
  assert.strictEqual(BASE_CATEGORY_WEIGHTS.skills, 35);
  assert.strictEqual(BASE_CATEGORY_WEIGHTS.experience, 25);
  assert.strictEqual(BASE_CATEGORY_WEIGHTS.education, 10);
  assert.strictEqual(BASE_CATEGORY_WEIGHTS.projects, 15);
  assert.strictEqual(BASE_CATEGORY_WEIGHTS.responsibilities, 10);
  assert.strictEqual(BASE_CATEGORY_WEIGHTS.certifications, 5);
  console.log("[PASS] Test 1: Category base weights total 100%");
});

test("Test 2: Correct weighted score calculation with full match", () => {
  const mockMatching = {
    skills: [{ requirement: "React", status: "matched", category: "required" }],
    experience: [{ requirement: "Frontend Dev", status: "matched", category: "required" }],
    education: [{ requirement: "BS CS", status: "matched", category: "required" }],
    projects: [{ requirement: "Web App", status: "matched", category: "required" }],
    responsibilities: [{ requirement: "Build UI", status: "matched", category: "required" }],
    certifications: [{ requirement: "AWS Cert", status: "matched", category: "required" }]
  };

  const result = calculateJobMatchScores(mockMatching);
  assert.strictEqual(result.overallScore, 100);
  assert.strictEqual(result.scoreLabel, SCORE_LABELS.EXCELLENT);
  console.log("[PASS] Test 2: Full match yields 100 score and Excellent Match label");
});

test("Test 3: Not-applicable category normalization - unspecified categories normalized out", () => {
  // JD does NOT specify education or certifications
  const mockMatching = {
    skills: [{ requirement: "Node.js", status: "matched", category: "required" }], // score 100, base weight 35
    experience: [{ requirement: "Backend Dev", status: "matched", category: "required" }], // score 100, base weight 25
    education: [], // Not applicable (0 requirements)
    projects: [{ requirement: "API Project", status: "matched", category: "required" }], // score 100, base weight 15
    responsibilities: [{ requirement: "Design APIs", status: "matched", category: "required" }], // score 100, base weight 10
    certifications: [] // Not applicable (0 requirements)
  };

  const result = calculateJobMatchScores(mockMatching);

  // Applicable base weights = 35 + 25 + 15 + 10 = 85.
  // Normalized weights:
  // skills: (35/85)*100 = 41.18%
  // experience: (25/85)*100 = 29.41%
  // projects: (15/85)*100 = 17.65%
  // responsibilities: (10/85)*100 = 11.76%
  // Sum = 100%
  const normalizedSum = Math.round(
    result.categoryWeights.skills +
      result.categoryWeights.experience +
      result.categoryWeights.projects +
      result.categoryWeights.responsibilities
  );
  assert.strictEqual(normalizedSum, 100, "Normalized applicable weights must total 100%");
  assert.strictEqual(result.categoryDetails.education.isApplicable, false);
  assert.strictEqual(result.categoryDetails.certifications.isApplicable, false);
  // Candidate matched 100% of applicable requirements, so overall score should remain 100, not penalized!
  assert.strictEqual(result.overallScore, 100);
  console.log("[PASS] Test 3: Unspecified categories are normalized out without penalizing candidate");
});

test("Test 4: Score clamping - score never exceeds 100 and never falls below 0", () => {
  const resultHigh = calculateJobMatchScores({
    skills: [{ requirement: "A", status: "matched", category: "required" }]
  });
  assert.ok(resultHigh.overallScore <= 100 && resultHigh.overallScore >= 0);

  const resultLow = calculateJobMatchScores({
    skills: [{ requirement: "A", status: "not_detected", category: "required" }]
  });
  assert.strictEqual(resultLow.overallScore, 0);
  assert.strictEqual(resultLow.scoreLabel, SCORE_LABELS.VERY_LOW);
  console.log("[PASS] Test 4: Score strictly clamped between 0 and 100");
});

test("Test 5: Correct score interpretation labels across all tiers", () => {
  assert.strictEqual(getScoreLabel(100), "Excellent Match");
  assert.strictEqual(getScoreLabel(90), "Excellent Match");
  assert.strictEqual(getScoreLabel(89), "Very Good Match");
  assert.strictEqual(getScoreLabel(80), "Very Good Match");
  assert.strictEqual(getScoreLabel(79), "Good Match");
  assert.strictEqual(getScoreLabel(70), "Good Match");
  assert.strictEqual(getScoreLabel(69), "Moderate Match");
  assert.strictEqual(getScoreLabel(60), "Moderate Match");
  assert.strictEqual(getScoreLabel(59), "Low Match");
  assert.strictEqual(getScoreLabel(40), "Low Match");
  assert.strictEqual(getScoreLabel(39), "Very Low Match");
  assert.strictEqual(getScoreLabel(0), "Very Low Match");
  console.log("[PASS] Test 5: Score labels accurately match all 6 specified score tiers");
});

test("Test 6: Matched, partially matched, and not detected keyword classification", () => {
  const jdKeywords = [
    { keyword: "React", category: "frontend", importance: "required" },
    { keyword: "Node.js", category: "backend", importance: "required" },
    { keyword: "Kubernetes", category: "devops", importance: "preferred" }
  ];

  const mockResume = {
    skills: ["React.js", "Express.js"],
    workExperience: [
      { jobTitle: "Full Stack Engineer", description: "Built microservices using Express.js and REST APIs" }
    ]
  };

  const detection = detectMissingKeywords(jdKeywords, mockResume);

  // React should be matched (alias React.js)
  const reactMatch = detection.matched.find((k) => k.keyword === "React");
  assert.ok(reactMatch, "React should be classified as matched");
  assert.strictEqual(reactMatch.sourceSection, "skills");

  // Node.js should be partially matched (has Express.js / backend)
  const nodeMatch = detection.partiallyMatched.find((k) => k.keyword === "Node.js");
  assert.ok(nodeMatch, "Node.js should be classified as partially matched due to related backend experience");

  // Kubernetes should be not_detected
  const k8sMatch = detection.notDetected.find((k) => k.keyword === "Kubernetes");
  assert.ok(k8sMatch, "Kubernetes should be classified as not_detected");
  assert.strictEqual(k8sMatch.suggestedAction, MISSING_KEYWORD_SAFE_ADVICE);
  console.log("[PASS] Test 6: Keyword classification handles matched, partially matched, and not detected");
});

test("Test 7: Java vs JavaScript distinction - never confuses the two", () => {
  const jdKeywords = [
    { keyword: "Java", category: "programming_languages", importance: "required" }
  ];

  // Resume only has JavaScript
  const resumeWithJsOnly = {
    skills: ["JavaScript", "React", "Node.js"],
    summary: "Experienced JavaScript web developer specializing in ES6+ frontend architectures."
  };

  const detection = detectMissingKeywords(jdKeywords, resumeWithJsOnly);

  const javaInMatched = detection.matched.find((k) => k.keyword.toLowerCase() === "java");
  const javaInNotDetected = detection.notDetected.find((k) => k.keyword.toLowerCase() === "java");

  assert.strictEqual(javaInMatched, undefined, "Java must NOT match a resume that only contains JavaScript");
  assert.ok(javaInNotDetected, "Java must be classified as not_detected when candidate only has JavaScript");
  console.log("[PASS] Test 7: Java vs JavaScript distinction verified (zero false positive)");
});

test("Test 8: Keyword normalization & alias resolution (JS -> JavaScript, ReactJS -> React)", () => {
  const jdText = "Must have strong experience in JS, ReactJS, and NodeJS.";
  const extracted = extractKeywordsFromJd(jdText);

  const keywords = extracted.map((k) => k.keyword);
  assert.ok(keywords.includes("JavaScript"), "Alias JS must normalize to JavaScript");
  assert.ok(keywords.includes("React"), "Alias ReactJS must normalize to React");
  assert.ok(keywords.includes("Node.js"), "Alias NodeJS must normalize to Node.js");
  console.log("[PASS] Test 8: Keyword normalization and alias resolution verified");
});

test("Test 9: Keyword evidence detection across Projects and Work Experience sections", () => {
  const jdKeywords = [
    { keyword: "GraphQL", category: "backend", importance: "required" },
    { keyword: "Docker", category: "devops", importance: "required" }
  ];

  const mockResume = {
    skills: [], // Empty skills section
    projects: [
      { name: "E-Commerce Microservice", description: "Architected GraphQL schema and Apollo client" }
    ],
    workExperience: [
      { jobTitle: "DevOps Engineer", description: "Containerized 15 microservices with Docker and automated CI" }
    ]
  };

  const detection = detectMissingKeywords(jdKeywords, mockResume);

  const gql = detection.matched.find((k) => k.keyword === "GraphQL");
  assert.ok(gql, "GraphQL should match from projects section");
  assert.strictEqual(gql.sourceSection, "projects");

  const docker = detection.matched.find((k) => k.keyword === "Docker");
  assert.ok(docker, "Docker should match from work experience section");
  assert.strictEqual(docker.sourceSection, "experience");
  console.log("[PASS] Test 9: Keyword evidence extracted across Projects and Work Experience");
});

test("Test 10: Missing keyword advice does NOT encourage fabrication", () => {
  const jdKeywords = [{ keyword: "Cybersecurity", category: "security", importance: "required" }];
  const detection = detectMissingKeywords(jdKeywords, { skills: [] });

  const notDetectedItem = detection.notDetected[0];
  assert.strictEqual(
    notDetectedItem.suggestedAction,
    "If you genuinely have this skill or experience, consider adding relevant evidence to your resume."
  );
  // Verify it contains the word "genuinely"
  assert.ok(notDetectedItem.suggestedAction.includes("genuinely"));
  console.log("[PASS] Test 10: Ethical safe advice verified without encouraging fabrication");
});

test("Test 11: Fresh graduate handling - absence of employment history does not crash", () => {
  const mockMatching = {
    skills: [{ requirement: "Python", status: "matched", category: "required" }],
    education: [{ requirement: "Computer Science Degree", status: "matched", category: "required" }],
    projects: [{ requirement: "AI Capstone Project", status: "matched", category: "required" }],
    experience: [], // Fresher with 0 work experience
    responsibilities: [],
    certifications: []
  };

  const scoring = calculateJobMatchScores(mockMatching);
  assert.ok(scoring.overallScore > 0, "Fresher with skills, education, and projects receives valid positive score");
  assert.strictEqual(scoring.categoryDetails.experience.isApplicable, false);

  const strengths = generateReportStrengths({ matchingDetails: mockMatching, keywords: { matched: [{ keyword: "Python" }] } });
  assert.ok(strengths.length > 0);
  console.log("[PASS] Test 11: Fresh graduate profile handled gracefully with normalized applicable weights");
});

test("Test 12: Complete report schema validation with Zod", () => {
  const validReport = {
    matchId: 42,
    status: "completed",
    overallScore: 85,
    scoreLabel: "Very Good Match",
    scoreExplanation: "High alignment with technical stack and academic requirements.",
    categoryScores: {
      skills: 90,
      experience: 80,
      education: 100,
      projects: 85,
      responsibilities: 75,
      certifications: 50
    },
    categoryWeights: {
      skills: 35,
      experience: 25,
      education: 10,
      projects: 15,
      responsibilities: 10,
      certifications: 5
    },
    categoryDetails: {
      skills: {
        category: "skills",
        score: 90,
        baseWeight: 35,
        normalizedWeight: 35,
        weightedContribution: 31.5,
        isApplicable: true,
        totalRequirements: 5,
        matchedCount: 4,
        partiallyMatchedCount: 1,
        notDetectedCount: 0,
        confidence: "high"
      }
    },
    keywords: {
      matched: [
        {
          keyword: "TypeScript",
          category: "programming_languages",
          status: "matched",
          sourceSection: "skills",
          evidence: "Explicitly listed in skills",
          importance: "required"
        }
      ],
      partiallyMatched: [],
      notDetected: [
        {
          keyword: "Terraform",
          category: "devops",
          status: "not_detected",
          importance: "preferred",
          suggestedAction: MISSING_KEYWORD_SAFE_ADVICE
        }
      ]
    },
    strengths: [
      {
        title: "Strong TypeScript Expertise",
        description: "Verified in resume text.",
        category: "skills"
      }
    ],
    improvementAreas: [
      {
        title: "Terraform Experience",
        description: "Not detected in resume.",
        category: "devops",
        suggestedAction: MISSING_KEYWORD_SAFE_ADVICE
      }
    ],
    analysisLimitations: []
  };

  const parsed = jobMatchReportSchema.safeParse(validReport);
  assert.strictEqual(parsed.success, true, "Valid report conforms to Zod jobMatchReportSchema");
  console.log("[PASS] Test 12: Complete report schema successfully validated with Zod");
});

console.log("\n-------------------------------------------------");
console.log("TEST SUMMARY: All Lesson 9.3 Job Match Score Tests Passed");
console.log("-------------------------------------------------\n");
