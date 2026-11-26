/**
 * Automated Test Suite: Resume Builder AI & Free Mode Content Generation (Lesson 8.3)
 */

import assert from "node:assert/strict";
import {
  generateFreeProfessionalSummary,
  generateFreeExperienceDescription,
  generateFreeProjectDescription,
  generateFreeSkillsPresentation,
  generateFreeEducationDescription,
  generateFreeAchievementDescription,
  generateBuilderContentFree
} from "../services/freeContentGeneratorService.js";
import {
  validateSectionInputSufficiency,
  generateContentRequestSchema,
  aiGeneratedContentZodSchema
} from "../validators/resumeBuilderContentSchema.js";
import { generateBuilderContentAi } from "../services/aiContentGeneratorService.js";
import {
  setOpenAiClientInstance,
  resetOpenAiClient
} from "../config/openai.js";

console.log("=================================================");
console.log(" AI RESUME BUILDER - CONTENT GENERATION TESTS    ");
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

// 1. FREE MODE TESTS (ZERO OPENAI CALLS)
await runTest("Test 1: Free Mode operates without OpenAI client or API key", () => {
  const result = generateBuilderContentFree({
    section: "professionalSummary",
    tone: "professional",
    data: {
      targetRole: "Frontend Engineer",
      skills: ["React", "JavaScript", "Tailwind CSS"],
      experienceLevel: "Fresher"
    }
  });

  assert.equal(result.section, "professionalSummary");
  assert.equal(result.mode, "template_based");
  assert.equal(result.generationType, "rule_based");
  assert.ok(result.generatedContent.includes("Frontend Engineer"));
  assert.ok(result.generatedContent.includes("React"));
  assert.equal(result.metadata.model, "rule-based-engine");
});

await runTest("Test 2: Free Mode output is correctly labeled as template_based and rule_based", () => {
  const result = generateBuilderContentFree({
    section: "experience",
    tone: "concise",
    data: {
      position: "Junior Developer",
      company: "Acme Corp",
      responsibilities: "worked on react components and handled bug fixes"
    }
  });

  assert.equal(result.mode, "template_based");
  assert.equal(result.generationType, "rule_based");
  assert.ok(result.metadata.factPreservationNotice.includes("Strict fact preservation"));
});

await runTest("Test 3: Professional summary handles Freshers appropriately without inventing jobs", () => {
  const result = generateFreeProfessionalSummary({
    targetRole: "Software Developer",
    experienceLevel: "Fresher",
    skills: ["Python", "SQL", "Git"]
  }, "professional");

  assert.ok(result.generatedContent.includes("Software Developer"));
  assert.ok(result.generatedContent.includes("Python"));
  assert.ok(!result.generatedContent.includes("10 years of experience"));
  assert.ok(!result.generatedContent.includes("Senior VP"));
});

await runTest("Test 4: Professional summary supports all 4 tones", () => {
  const tones = ["professional", "concise", "technical", "achievement_focused"];
  for (const tone of tones) {
    const res = generateFreeProfessionalSummary({
      targetRole: "Full Stack Developer",
      skills: ["Node.js", "React"]
    }, tone);
    assert.equal(res.toneApplied, tone);
    assert.ok(res.generatedContent.length > 20);
  }
});

await runTest("Test 5: Experience description converts passive openers to strong action verbs", () => {
  const res = generateFreeExperienceDescription({
    position: "Software Engineer",
    company: "Tech Solutions",
    responsibilities: "responsible for backend APIs and helped with database migrations."
  }, "professional");

  assert.ok(res.bullets.length > 0);
  assert.ok(res.generatedContent.includes("Spearheaded") || res.generatedContent.includes("Engineered"));
  assert.ok(!res.generatedContent.includes("responsible for"));
});

await runTest("Test 6: Project description formats overview and technology stack truthfully", () => {
  const res = generateFreeProjectDescription({
    projectName: "Resume Analyzer",
    technologies: ["React", "Express", "MySQL"],
    description: "Built automated scoring and live feedback preview."
  }, "technical");

  assert.ok(res.generatedContent.includes("Resume Analyzer"));
  assert.ok(res.generatedContent.includes("React"));
  assert.ok(res.bullets.length >= 2);
});

await runTest("Test 7: Skills presentation groups skills into domains without adding unlisted tools", () => {
  const res = generateFreeSkillsPresentation({
    skills: ["JavaScript", "React", "MySQL", "Docker", "Git", "Project Management"]
  }, "professional");

  assert.ok(res.generatedContent.includes("Languages & Runtimes: JavaScript"));
  assert.ok(res.generatedContent.includes("Frameworks & Libraries: React"));
  assert.ok(res.generatedContent.includes("Databases & Cloud: MySQL, Docker"));
  // Ensure unlisted tools were NOT added
  assert.ok(!res.generatedContent.includes("Kubernetes"));
  assert.ok(!res.generatedContent.includes("AWS"));
});

await runTest("Test 8: Education description formats academic qualifications consistently", () => {
  const res = generateFreeEducationDescription({
    degree: "B.Tech Computer Science",
    institution: "Tech University",
    fieldOfStudy: "Computer Engineering",
    graduationYear: "2024",
    grade: "8.8 CGPA"
  }, "professional");

  assert.ok(res.generatedContent.includes("B.Tech Computer Science"));
  assert.ok(res.generatedContent.includes("Tech University"));
  assert.ok(res.generatedContent.includes("8.8 CGPA"));
});

await runTest("Test 9: Achievement description highlights recognition context truthfully", () => {
  const res = generateFreeAchievementDescription({
    title: "1st Place Hackathon Winner",
    organization: "DevFest 2024",
    description: "Awarded top honor among 50 participating collegiate teams."
  }, "achievement_focused");

  assert.ok(res.generatedContent.includes("1st Place Hackathon Winner"));
  assert.ok(res.generatedContent.includes("DevFest 2024"));
});

// 2. INPUT SUFFICIENCY & VALIDATION TESTS
await runTest("Test 10: Insufficient input is caught by validateSectionInputSufficiency (422)", () => {
  const checkSummary = validateSectionInputSufficiency("professionalSummary", {});
  assert.equal(checkSummary.valid, false);

  const checkExperience = validateSectionInputSufficiency("experience", { otherField: "nothing" });
  assert.equal(checkExperience.valid, false);

  const checkSkills = validateSectionInputSufficiency("skills", { skills: [] });
  assert.equal(checkSkills.valid, false);
});

await runTest("Test 11: Schema validation enforces valid section and tone values", () => {
  const validReq = generateContentRequestSchema.safeParse({
    mode: "free",
    section: "professionalSummary",
    tone: "technical",
    data: { targetRole: "Frontend Developer" }
  });
  assert.equal(validReq.success, true);

  const invalidSection = generateContentRequestSchema.safeParse({
    mode: "free",
    section: "invalid_section_xyz",
    data: { role: "Dev" }
  });
  assert.equal(invalidSection.success, false);
});

// 3. ADVANCED AI MODE (MOCKED OPENAI RESPONSES)
await runTest("Test 12: Advanced AI parses and validates structured output conforming to Zod schema", async () => {
  try {
    setOpenAiClientInstance({
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: JSON.stringify({
                    generatedContent: "Engineered scalable RESTful microservices utilizing Node.js, Express, and PostgreSQL.",
                    bullets: [
                      "Engineered scalable RESTful microservices utilizing Node.js and Express.",
                      "Optimized query performance and schema indexing with PostgreSQL."
                    ],
                    toneApplied: "technical",
                    keyChangesMade: ["Applied active verbs", "Structured technical bullet points"],
                    factPreservationNotice: "Strict fact preservation applied: No unverified metrics or credentials added."
                  })
                }
              }
            ]
          })
        }
      }
    });

    const aiRes = await generateBuilderContentAi({
      section: "experience",
      tone: "technical",
      data: {
        position: "Backend Developer",
        company: "CloudCorp",
        responsibilities: "wrote nodejs apis and postgres queries"
      }
    });

    assert.equal(aiRes.mode, "ai_generated");
    assert.equal(aiRes.generationType, "ai_generated");
    assert.equal(aiRes.tone, "technical");
    assert.ok(aiRes.generatedContent.includes("Node.js"));
    assert.equal(aiRes.bullets.length, 2);
  } finally {
    resetOpenAiClient();
  }
});

await runTest("Test 13: Advanced AI handles quota exceeded error gracefully (429)", async () => {
  try {
    setOpenAiClientInstance({
      chat: {
        completions: {
          create: async () => {
            const err = new Error("You exceeded your current quota, please check your plan.");
            err.status = 429;
            throw err;
          }
        }
      }
    });

    await generateBuilderContentAi({
      section: "professionalSummary",
      tone: "professional",
      data: { targetRole: "DevOps Engineer" }
    });
    assert.fail("Expected OpenAiServiceError with 429");
  } catch (err) {
    assert.equal(err.statusCode, 429);
    assert.equal(err.code, "OPENAI_QUOTA_EXCEEDED");
  } finally {
    resetOpenAiClient();
  }
});

await runTest("Test 14: Advanced AI handles invalid/missing API key (401)", async () => {
  try {
    setOpenAiClientInstance({
      chat: {
        completions: {
          create: async () => {
            const err = new Error("Incorrect API key provided");
            err.status = 401;
            throw err;
          }
        }
      }
    });

    await generateBuilderContentAi({
      section: "project",
      tone: "professional",
      data: { projectName: "E-Commerce Site" }
    });
    assert.fail("Expected OpenAiServiceError with 401");
  } catch (err) {
    assert.equal(err.statusCode, 401);
    assert.equal(err.code, "OPENAI_INVALID_KEY");
  } finally {
    resetOpenAiClient();
  }
});

await runTest("Test 15: Advanced AI rejects invalid structured response that fails Zod validation", async () => {
  try {
    setOpenAiClientInstance({
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: JSON.stringify({
                    invalidField: 123
                    // Missing required generatedContent
                  })
                }
              }
            ]
          })
        }
      }
    });

    await generateBuilderContentAi({
      section: "skills",
      tone: "professional",
      data: { skills: ["React", "CSS"] }
    });
    assert.fail("Expected Zod schema validation error");
  } catch (err) {
    assert.equal(err.statusCode, 502);
    assert.equal(err.code, "SCHEMA_VALIDATION_ERROR");
  } finally {
    resetOpenAiClient();
  }
});

console.log("-------------------------------------------------");
console.log(`TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
console.log("-------------------------------------------------");

if (failedCount > 0) {
  process.exit(1);
}
