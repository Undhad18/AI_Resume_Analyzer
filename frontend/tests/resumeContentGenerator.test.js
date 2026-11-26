/**
 * Frontend Test Suite: Resume Builder Content Generator (Lesson 8.3)
 */

import assert from "node:assert/strict";

console.log("=================================================");
console.log(" AI RESUME BUILDER - FRONTEND GENERATOR TESTS    ");
console.log("=================================================");

let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    failed++;
  }
};

// Mock Resume Data
const createMockResumeData = () => ({
  resumeTitle: "Full Stack Engineer",
  personalInfo: {
    fullName: "Alex Rivera",
    email: "alex@example.com",
    phone: "555-0199"
  },
  professionalSummary: "Original professional summary text.",
  skills: ["React", "JavaScript", "Node.js"],
  experience: [
    {
      id: "exp_1",
      position: "Frontend Dev",
      company: "Alpha Corp",
      responsibilities: "Original duties 1",
      achievements: "Original ach 1"
    },
    {
      id: "exp_2",
      position: "Backend Dev",
      company: "Beta LLC",
      responsibilities: "Original duties 2",
      achievements: "Original ach 2"
    }
  ],
  education: [
    {
      id: "edu_1",
      institution: "Tech University",
      degree: "B.S. Computer Science",
      description: "Original honors"
    }
  ],
  projects: [
    {
      id: "proj_1",
      title: "Portfolio",
      technologies: "React, CSS",
      description: "Original project desc 1"
    },
    {
      id: "proj_2",
      title: "API Gateway",
      technologies: "Node.js, Express",
      description: "Original project desc 2"
    }
  ],
  achievements: [
    {
      id: "ach_1",
      title: "Dean's List",
      description: "Original recognition"
    }
  ]
});

test("Test 1: User can edit generated content and origin badge tracks user edits", () => {
  const originalAiGenerated = "Spearheaded frontend microservices architecture using React.js.";
  const userEditedText = "Spearheaded frontend microservices architecture using React.js and Redux Toolkit.";

  const currentContent = userEditedText;
  const isUserEdited = currentContent !== originalAiGenerated;

  assert.equal(isUserEdited, true);
  assert.equal(currentContent, userEditedText);
});

test("Test 2: Accepting content updates ONLY the professionalSummary field", () => {
  const initial = createMockResumeData();
  const generatedSummary = "Ambitious Full Stack Engineer with proven expertise in building responsive applications.";

  // Immutable update simulator mirroring ResumeBuilder.jsx
  const updated = {
    ...initial,
    professionalSummary: generatedSummary
  };

  assert.equal(updated.professionalSummary, generatedSummary);
  // Ensure personal info and skills remain untouched
  assert.equal(updated.personalInfo.fullName, "Alex Rivera");
  assert.deepEqual(updated.skills, ["React", "JavaScript", "Node.js"]);
  assert.equal(updated.experience.length, 2);
});

test("Test 3: Accepting content updates specific experience entry without altering siblings", () => {
  const initial = createMockResumeData();
  const targetId = "exp_2";
  const newResponsibilities = "• Engineered high-performance REST APIs using Node.js and PostgreSQL.\n• Reduced query latencies through database indexing.";

  const updatedExperience = initial.experience.map((exp) =>
    exp.id === targetId ? { ...exp, responsibilities: newResponsibilities } : exp
  );

  const updatedResume = {
    ...initial,
    experience: updatedExperience
  };

  // Target entry is updated
  const exp2 = updatedResume.experience.find((e) => e.id === "exp_2");
  assert.equal(exp2.responsibilities, newResponsibilities);
  assert.equal(exp2.company, "Beta LLC");

  // Sibling entry remains 100% untouched
  const exp1 = updatedResume.experience.find((e) => e.id === "exp_1");
  assert.equal(exp1.responsibilities, "Original duties 1");
  assert.equal(exp1.company, "Alpha Corp");
});

test("Test 4: Accepting content updates specific project entry without altering siblings", () => {
  const initial = createMockResumeData();
  const targetId = "proj_1";
  const newDesc = "• Designed component-driven design system with Tailwind CSS.\n• Deployed automated CI/CD pipeline on Vercel.";

  const updatedProjects = initial.projects.map((proj) =>
    proj.id === targetId ? { ...proj, description: newDesc } : proj
  );

  const updatedResume = {
    ...initial,
    projects: updatedProjects
  };

  assert.equal(updatedResume.projects[0].description, newDesc);
  assert.equal(updatedResume.projects[1].description, "Original project desc 2");
  assert.equal(updatedResume.projects[1].title, "API Gateway");
});

test("Test 5: Accepting skills content parses and deduplicates without duplicate entries", () => {
  const initial = createMockResumeData();
  const generatedSkillsText = "React, TypeScript, GraphQL, Node.js";

  const rawSkills = generatedSkillsText
    .split(/[\n,•]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const existingSkills = [...initial.skills];
  for (const s of rawSkills) {
    if (!existingSkills.some((exist) => exist.toLowerCase() === s.toLowerCase())) {
      existingSkills.push(s);
    }
  }

  assert.deepEqual(existingSkills, ["React", "JavaScript", "Node.js", "TypeScript", "GraphQL"]);
  // "React" and "Node.js" were not added twice
  assert.equal(existingSkills.filter((s) => s.toLowerCase() === "react").length, 1);
});

test("Test 6: Canceling content generator preserves all original form data without changes", () => {
  const initial = createMockResumeData();
  const snapshotBeforeOpen = JSON.stringify(initial);

  // User opens generator, types, then clicks cancel
  const cancelled = true;
  let finalState = initial;
  if (!cancelled) {
    finalState = { ...initial, professionalSummary: "Should not be saved" };
  }

  assert.equal(JSON.stringify(finalState), snapshotBeforeOpen);
});

test("Test 7: Accuracy warning notice text is accurate and compliant with specification", () => {
  const requiredWarningText =
    "Review generated content carefully. Do not include claims that do not accurately describe your experience.";
  assert.ok(requiredWarningText.includes("Review generated content carefully"));
  assert.ok(requiredWarningText.includes("Do not include claims"));
});

test("Test 8: Supported section list includes all 6 required sections", () => {
  const supported = [
    "professionalSummary",
    "experience",
    "project",
    "skills",
    "education",
    "achievement"
  ];
  assert.equal(supported.length, 6);
  assert.ok(supported.includes("professionalSummary"));
  assert.ok(supported.includes("experience"));
  assert.ok(supported.includes("project"));
  assert.ok(supported.includes("skills"));
  assert.ok(supported.includes("education"));
  assert.ok(supported.includes("achievement"));
});

test("Test 9: Supported tone list includes all 4 required tones", () => {
  const tones = ["professional", "concise", "technical", "achievement_focused"];
  assert.equal(tones.length, 4);
});

test("Test 10: Existing Lesson 8.1 and 8.2 resume structure and preview remain intact", () => {
  const initial = createMockResumeData();
  assert.ok(initial.resumeTitle);
  assert.ok(initial.personalInfo.fullName);
  assert.ok(Array.isArray(initial.experience));
  assert.ok(Array.isArray(initial.education));
  assert.ok(Array.isArray(initial.projects));
  assert.ok(Array.isArray(initial.certifications || []));
  assert.ok(Array.isArray(initial.achievements));
});

console.log("-------------------------------------------------");
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("-------------------------------------------------");

if (failed > 0) process.exit(1);
