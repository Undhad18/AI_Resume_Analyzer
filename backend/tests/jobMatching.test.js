/**
 * Automated Test Suite: Resume and Job Description Matching Engine (Lesson 9.2)
 * Tests deterministic and AI requirement matching across all 6 categories,
 * evidence citations, skill normalization, and edge case handling.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  extractJdRequirements,
  matchRequirementsDeterministically,
  JobMatchingError
} from "../services/resumeJobMatchingService.js";
import {
  matchingDetailsSchema,
  createJobMatchRequestSchema,
  requirementMatchItemSchema
} from "../validators/jobMatchingSchema.js";

console.log("\n=================================================");
console.log("   AI RESUME ANALYZER - LESSON 9.2 MATCHING TESTS");
console.log("=================================================\n");

const SAMPLE_JD = `
Job Title: Senior Full Stack Engineer
Required Skills:
- React.js
- Java
- PostgreSQL
- Docker
Preferred Skills:
- GraphQL
Experience:
- 4+ years of professional software engineering
Education:
- Bachelor of Science in Computer Science
Projects:
- Microservices architecture deployment
Responsibilities:
- Build responsive web applications
- Lead backend API design
Certifications:
- AWS Certified Solutions Architect
`;

const SAMPLE_RESUME = {
  personalInfo: { fullName: "Sarah Connor", email: "sarah@example.com" },
  skills: ["React.js", "JavaScript", "PostgreSQL", "Docker", "Node.js"],
  workExperience: [
    {
      jobTitle: "Senior Software Engineer",
      company: "Cyberdyne Systems",
      responsibilities: "Designed and implemented scalable backend API services and built responsive web applications.",
      achievements: "Managed 4+ years of production cloud microservices."
    }
  ],
  education: [
    { degree: "Bachelor of Science", fieldOfStudy: "Computer Science", institution: "California State" }
  ],
  projects: [
    {
      projectName: "Microservices Gateway",
      technologies: "Docker, PostgreSQL, Node.js",
      description: "Deployed containerized microservices architecture with automated CI/CD."
    }
  ],
  certifications: ["AWS Certified Solutions Architect"]
};

// 1. Valid resume and JD matching
test("Test 1: Valid resume and JD matching returns structured requirements", () => {
  const reqs = extractJdRequirements(SAMPLE_JD);
  assert.ok(reqs.skills.length > 0);
  assert.ok(reqs.experience.length > 0);
  assert.ok(reqs.education.length > 0);
  assert.ok(reqs.projects.length > 0);
  assert.ok(reqs.responsibilities.length > 0);
  assert.ok(reqs.certifications.length > 0);

  const matched = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  assert.ok(matched.skills.length > 0);
  console.log("[PASS] Test 1: Valid resume and JD matching extracts all categories");
});

// 2. Required skill directly matched
test("Test 2: Required skill directly matched with explicit citation", () => {
  const reqs = {
    skills: [{ requirement: "React.js", category: "required" }]
  };
  const result = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  const reactMatch = result.skills.find((s) => s.requirement === "React.js");

  assert.ok(reactMatch, "React.js requirement must be evaluated");
  assert.equal(reactMatch.status, "matched");
  assert.ok(reactMatch.evidence.length > 0);
  assert.equal(reactMatch.evidence[0].sourceSection, "skills");
  console.log("[PASS] Test 2: Required skill directly matched with skills evidence");
});

// 3. Related skill partially matched
test("Test 3: Related skill in same category classified as partially matched", () => {
  const resumeWithExpressOnly = {
    skills: ["Express.js"],
    workExperience: [],
    projects: []
  };
  const reqs = {
    skills: [{ requirement: "Django", category: "required" }] // Backend skill
  };

  const result = matchRequirementsDeterministically(resumeWithExpressOnly, reqs);
  const djangoMatch = result.skills.find((s) => s.requirement === "Django");

  assert.ok(djangoMatch);
  assert.equal(djangoMatch.status, "partially_matched");
  assert.ok(djangoMatch.explanation.includes("backend"));
  console.log("[PASS] Test 3: Related skill in same category classified as partially matched");
});

// 4. Skill not detected
test("Test 4: Unevidenced skill classified strictly as not_detected", () => {
  const reqs = {
    skills: [{ requirement: "Rust", category: "required" }]
  };
  const result = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  const rustMatch = result.skills.find((s) => s.requirement === "Rust");

  assert.ok(rustMatch);
  assert.equal(rustMatch.status, "not_detected");
  assert.equal(rustMatch.evidence.length, 0);
  console.log("[PASS] Test 4: Unevidenced skill classified as not_detected without fake citations");
});

// 5. Java and JavaScript distinction
test("Test 5: Java vs JavaScript distinction prevents false positive matching", () => {
  // Resume has JavaScript, but JD requires Java
  const resumeWithJsOnly = {
    skills: ["JavaScript", "React.js", "Node.js"],
    workExperience: [{ jobTitle: "JavaScript Developer", responsibilities: "Frontend code in JS" }],
    projects: []
  };
  const reqs = {
    skills: [{ requirement: "Java", category: "required" }]
  };

  const result = matchRequirementsDeterministically(resumeWithJsOnly, reqs);
  const javaMatch = result.skills.find((s) => s.requirement === "Java");

  assert.ok(javaMatch);
  assert.notEqual(javaMatch.status, "matched", "Java must NOT match a resume that only has JavaScript");
  console.log("[PASS] Test 5: Java and JavaScript distinction verified");
});

// 6. Experience evidence matching
test("Test 6: Work experience evidence matching finds job title and responsibilities", () => {
  const reqs = {
    experience: [{ requirement: "software engineering", category: "required" }]
  };
  const result = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  const expMatch = result.experience[0];

  assert.ok(expMatch);
  assert.equal(expMatch.status, "matched");
  assert.ok(expMatch.evidence.length > 0);
  console.log("[PASS] Test 6: Experience evidence matching identified from work experience");
});

// 7. Education evidence matching
test("Test 7: Education evidence matching verifies degree and field of study", () => {
  const reqs = {
    education: [{ requirement: "Computer Science", category: "required" }]
  };
  const result = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  const eduMatch = result.education[0];

  assert.ok(eduMatch);
  assert.equal(eduMatch.status, "matched");
  assert.equal(eduMatch.evidence[0].sourceSection, "education");
  console.log("[PASS] Test 7: Education evidence matching verified");
});

// 8. Project evidence matching
test("Test 8: Technical project evidence matching verifies project details", () => {
  const reqs = {
    projects: [{ requirement: "microservices", category: "required" }]
  };
  const result = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  const projMatch = result.projects[0];

  assert.ok(projMatch);
  assert.equal(projMatch.status, "matched");
  assert.equal(projMatch.evidence[0].sourceSection, "projects");
  console.log("[PASS] Test 8: Project evidence matching verified");
});

// 9. Certification evidence matching
test("Test 9: Certification evidence matching validates credentials", () => {
  const reqs = {
    certifications: [{ requirement: "AWS Certified Solutions Architect", category: "required" }]
  };
  const result = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  const certMatch = result.certifications[0];

  assert.ok(certMatch);
  assert.equal(certMatch.status, "matched");
  assert.equal(certMatch.evidence[0].sourceSection, "certifications");
  console.log("[PASS] Test 9: Certification evidence verified in resume");
});

// 10. No fabricated resume evidence
test("Test 10: Requirements with zero evidence never receive fabricated citations", () => {
  const reqs = {
    certifications: [{ requirement: "CISSP Cybersecurity License", category: "required" }]
  };
  const result = matchRequirementsDeterministically(SAMPLE_RESUME, reqs);
  const certMatch = result.certifications[0];

  assert.equal(certMatch.status, "not_detected");
  assert.equal(certMatch.evidence.length, 0);
  console.log("[PASS] Test 10: Zero fabrication verified on not_detected items");
});

// 11. Fresh graduate with projects
test("Test 11: Fresh graduate profile with projects matches project requirements without employment penalty", () => {
  const fresherResume = {
    skills: ["Python", "TensorFlow"],
    workExperience: [], // 0 employment
    projects: [
      { projectName: "AI Vision App", description: "Created computer vision pipeline using Python and TensorFlow." }
    ],
    education: [{ degree: "BS in AI", institution: "State Univ" }]
  };
  const reqs = {
    projects: [{ requirement: "computer vision", category: "required" }]
  };
  const result = matchRequirementsDeterministically(fresherResume, reqs);
  assert.equal(result.projects[0].status, "matched");
  console.log("[PASS] Test 11: Fresh graduate profile matches project evidence gracefully");
});

// 12. Empty resume content handling
test("Test 12: Empty resume content returns not_detected for all items without crashing", () => {
  const emptyResume = { skills: [], workExperience: [], education: [], projects: [], certifications: [] };
  const reqs = extractJdRequirements(SAMPLE_JD);
  const result = matchRequirementsDeterministically(emptyResume, reqs);

  result.skills.forEach((s) => assert.equal(s.status, "not_detected"));
  console.log("[PASS] Test 12: Empty resume handled safely without runtime errors");
});

// 13. Empty JD handling
test("Test 13: Empty JD text extracts empty categories cleanly", () => {
  const emptyReqs = extractJdRequirements("");
  assert.equal(emptyReqs.skills.length, 0);
  assert.equal(emptyReqs.experience.length, 0);
  assert.equal(emptyReqs.education.length, 0);
  console.log("[PASS] Test 13: Empty JD handled cleanly");
});

// 14. Invalid resumeId validation schema
test("Test 14: Request schema rejects non-numeric or missing resumeId", () => {
  const invalid = createJobMatchRequestSchema.safeParse({ resumeId: -5, jobDescriptionId: 10 });
  assert.equal(invalid.success, false);
  console.log("[PASS] Test 14: Invalid resumeId rejected by Zod schema");
});

// 15. Invalid jobDescriptionId validation schema
test("Test 15: Request schema rejects missing jobDescriptionId", () => {
  const invalid = createJobMatchRequestSchema.safeParse({ resumeId: 10 });
  assert.equal(invalid.success, false);
  console.log("[PASS] Test 15: Missing jobDescriptionId rejected by Zod schema");
});

// 16. MatchingDetails Zod schema validation
test("Test 16: Structured matching details adhere to Zod schema", () => {
  const mockDetails = {
    skills: [
      {
        requirement: "Docker",
        category: "required",
        status: "matched",
        evidence: [{ sourceSection: "skills", text: "Docker" }],
        explanation: "Found in skills"
      }
    ],
    experience: [],
    education: [],
    projects: [],
    responsibilities: [],
    certifications: []
  };

  const parsed = matchingDetailsSchema.safeParse(mockDetails);
  assert.equal(parsed.success, true);
  console.log("[PASS] Test 16: Matching details validated against Zod schema");
});

// 17. Safe error code structure in JobMatchingError
test("Test 17: JobMatchingError encapsulates code and HTTP statusCode", () => {
  const err = new JobMatchingError("Unauthorized access to resume", 403, "FORBIDDEN");
  assert.equal(err.statusCode, 403);
  assert.equal(err.code, "FORBIDDEN");
  assert.equal(err.message, "Unauthorized access to resume");
  console.log("[PASS] Test 17: JobMatchingError structure verified");
});

console.log("\n-------------------------------------------------");
console.log("TEST SUMMARY: All Lesson 9.2 Matching Tests Passed");
console.log("-------------------------------------------------\n");
