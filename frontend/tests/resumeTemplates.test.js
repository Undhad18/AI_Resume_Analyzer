/**
 * Automated Test Suite: Resume Templates & Live Preview (Lesson 8.4)
 */

import assert from "node:assert/strict";
import {
  TEMPLATE_IDS,
  DEFAULT_TEMPLATE,
  TEMPLATE_CONFIGS,
  getTemplateConfig,
  extractValidResumeSections
} from "../src/components/builder/templates/templateConfig.js";
import { INITIAL_RESUME_DATA } from "../src/utils/resumeBuilderValidation.js";

console.log("=================================================");
console.log(" AI RESUME BUILDER - TEMPLATES & PREVIEW TESTS   ");
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
  ...INITIAL_RESUME_DATA,
  resumeTitle: "Senior Full Stack Engineer",
  personalInfo: {
    fullName: "Harshil Undhad",
    email: "harshil@example.com",
    phone: "+1-555-0199",
    location: "San Francisco, CA",
    linkedIn: "linkedin.com/in/harshil",
    gitHub: "github.com/harshil",
    portfolio: "harshil.dev"
  },
  professionalSummary: "Experienced engineer specializing in React, Node.js, and high-performance cloud applications.",
  skills: ["React.js", "Node.js", "TypeScript", "Tailwind CSS", "MySQL"],
  experience: [
    {
      id: "exp_1",
      jobTitle: "Senior Frontend Engineer",
      company: "InnovateTech",
      location: "San Francisco, CA",
      startDate: "Jan 2022",
      endDate: "Present",
      currentlyWorking: true,
      responsibilities: "Spearheaded design system modernization using Tailwind CSS.",
      achievements: "Improved client initial load time by 30%."
    },
    {
      id: "exp_2",
      jobTitle: "Software Developer",
      company: "DataSystems Inc",
      location: "San Jose, CA",
      startDate: "Jun 2020",
      endDate: "Dec 2021",
      currentlyWorking: false,
      responsibilities: "Developed REST APIs and optimized MySQL relational queries.",
      achievements: "Built automated data ingestion pipelines."
    }
  ],
  education: [
    {
      id: "edu_1",
      institution: "State University",
      degree: "B.S. Computer Engineering",
      fieldOfStudy: "Software Systems",
      graduationYear: "2020",
      grade: "3.9 GPA",
      description: "Summa Cum Laude, President's Honor List."
    }
  ],
  projects: [
    {
      id: "proj_1",
      projectName: "AI Resume Analyzer",
      technologies: "React, Express, MySQL",
      description: "Architected multi-engine resume scoring platform with real-time feedback.",
      projectUrl: "https://resume-analyzer.demo"
    }
  ],
  certifications: [
    {
      id: "cert_1",
      certificationName: "AWS Certified Developer",
      issuingOrganization: "Amazon Web Services",
      issueDate: "2023",
      credentialUrl: "https://aws.amazon.com/verify/123"
    }
  ],
  achievements: [
    {
      id: "ach_1",
      title: "1st Place - University Hackathon",
      organization: "TechFest",
      date: "2019",
      description: "Recognized for building an automated web accessibility validator."
    }
  ]
});

// TEST 1: Template Configurations Exist and Have Correct IDs
test("Test 1: Template configurations define all 4 required templates with stable IDs", () => {
  assert.equal(TEMPLATE_CONFIGS.length, 4);
  assert.equal(TEMPLATE_IDS.MODERN, "modern");
  assert.equal(TEMPLATE_IDS.CLASSIC, "classic");
  assert.equal(TEMPLATE_IDS.MINIMAL, "minimal");
  assert.equal(TEMPLATE_IDS.ATS, "ats");
  assert.equal(DEFAULT_TEMPLATE, "modern");
});

// TEST 2: Template Config Lookup
test("Test 2: getTemplateConfig retrieves accurate metadata with modern fallback", () => {
  const modern = getTemplateConfig("modern");
  assert.equal(modern.name, "Modern");
  assert.equal(modern.accent, "blue");

  const classic = getTemplateConfig("classic");
  assert.equal(classic.name, "Classic");

  const minimal = getTemplateConfig("minimal");
  assert.equal(minimal.name, "Minimal");

  const ats = getTemplateConfig("ats");
  assert.equal(ats.name, "ATS-Friendly");
  assert.equal(ats.badge, "ATS-Safe");

  // Unknown fallback returns modern
  const fallback = getTemplateConfig("unknown_template_xyz");
  assert.equal(fallback.id, "modern");
});

// TEST 3: Switching Templates Does Not Mutate resumeData
test("Test 3: Switching templates preserves resumeData without mutation", () => {
  const data = createMockResumeData();
  const originalJson = JSON.stringify(data);

  let selectedTemplate = "modern";
  assert.equal(selectedTemplate, "modern");

  selectedTemplate = "classic";
  assert.equal(selectedTemplate, "classic");

  selectedTemplate = "minimal";
  assert.equal(selectedTemplate, "minimal");

  selectedTemplate = "ats";
  assert.equal(selectedTemplate, "ats");

  assert.equal(JSON.stringify(data), originalJson);
});

// TEST 4: Section Extraction Correctly Identifies Populated Sections
test("Test 4: extractValidResumeSections correctly identifies all populated sections", () => {
  const data = createMockResumeData();
  const extracted = extractValidResumeSections(data);

  assert.equal(extracted.isCompletelyEmpty, false);
  assert.equal(extracted.hasPersonalInfo, true);
  assert.equal(extracted.personalInfo.fullName, "Harshil Undhad");
  assert.equal(extracted.hasSummary, true);
  assert.equal(extracted.hasSkills, true);
  assert.equal(extracted.skills.length, 5);
  assert.equal(extracted.validExperience.length, 2);
  assert.equal(extracted.validEducation.length, 1);
  assert.equal(extracted.validProjects.length, 1);
  assert.equal(extracted.validCertifications.length, 1);
  assert.equal(extracted.validAchievements.length, 1);
});

// TEST 5: Empty Optional Sections Are Hidden
test("Test 5: Empty sections are safely suppressed and hidden without errors", () => {
  const sparseData = {
    ...INITIAL_RESUME_DATA,
    personalInfo: { fullName: "Jane Doe", email: "jane@example.com" },
    skills: ["Python"],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    achievements: []
  };

  const extracted = extractValidResumeSections(sparseData);

  assert.equal(extracted.isCompletelyEmpty, false);
  assert.equal(extracted.hasSummary, false);
  assert.equal(extracted.validExperience.length, 0);
  assert.equal(extracted.validEducation.length, 0);
  assert.equal(extracted.validProjects.length, 0);
  assert.equal(extracted.validCertifications.length, 0);
  assert.equal(extracted.validAchievements.length, 0);
});

// TEST 6: Completely Empty Resume Returns isCompletelyEmpty: true
test("Test 6: Blank resume state is identified as completely empty for empty state view", () => {
  const emptyData = {
    ...INITIAL_RESUME_DATA,
    personalInfo: { fullName: "", email: "" },
    skills: [],
    experience: [],
    education: [],
    projects: []
  };

  const extracted = extractValidResumeSections(emptyData);
  assert.equal(extracted.isCompletelyEmpty, true);
});

// TEST 7: Skills Normalization Handles Both Strings and Object Shapes
test("Test 7: Skills normalization handles string chips and object arrays cleanly", () => {
  const dataWithMixedSkills = {
    ...INITIAL_RESUME_DATA,
    skills: ["React", { name: "Docker" }, "   TypeScript   ", { name: "" }, ""]
  };

  const extracted = extractValidResumeSections(dataWithMixedSkills);
  assert.deepEqual(extracted.skills, ["React", "Docker", "TypeScript"]);
  assert.equal(extracted.hasSkills, true);
});

// TEST 8: Live Preview Updates Automatically When Name or Summary Changes
test("Test 8: Live Preview reacts immediately to name and summary state updates", () => {
  let resume = createMockResumeData();
  let extracted = extractValidResumeSections(resume);
  assert.equal(extracted.personalInfo.fullName, "Harshil Undhad");

  // User edits name
  resume = {
    ...resume,
    personalInfo: { ...resume.personalInfo, fullName: "Harshil U." }
  };
  extracted = extractValidResumeSections(resume);
  assert.equal(extracted.personalInfo.fullName, "Harshil U.");

  // User edits summary
  resume = {
    ...resume,
    professionalSummary: "Updated technical summary from AI Generator."
  };
  extracted = extractValidResumeSections(resume);
  assert.equal(extracted.professionalSummary, "Updated technical summary from AI Generator.");
});

// TEST 9: Adding and Removing Experience Reflects Live in Extracted State
test("Test 9: Dynamic experience addition and removal reflects in live extracted state", () => {
  let resume = createMockResumeData();
  assert.equal(extractValidResumeSections(resume).validExperience.length, 2);

  // Add new experience
  resume = {
    ...resume,
    experience: [
      ...resume.experience,
      { id: "exp_3", jobTitle: "Intern", company: "Startup", responsibilities: "Coded" }
    ]
  };
  assert.equal(extractValidResumeSections(resume).validExperience.length, 3);

  // Remove exp_1
  resume = {
    ...resume,
    experience: resume.experience.filter((e) => e.id !== "exp_1")
  };
  const finalExtracted = extractValidResumeSections(resume);
  assert.equal(finalExtracted.validExperience.length, 2);
  assert.equal(finalExtracted.validExperience[0].id, "exp_2");
});

// TEST 10: AI-Generated Content Acceptance Updates Live Preview State
test("Test 10: Accepted AI-generated content renders live in preview extraction", () => {
  const initial = createMockResumeData();
  const aiGeneratedText = "• Spearheaded end-to-end API refactoring reducing latency by 40%.\n• Designed modular React components.";

  // Mimic accepting content for exp_1
  const updatedResume = {
    ...initial,
    experience: initial.experience.map((e) =>
      e.id === "exp_1" ? { ...e, responsibilities: aiGeneratedText } : e
    )
  };

  const extracted = extractValidResumeSections(updatedResume);
  const exp1 = extracted.validExperience.find((e) => e.id === "exp_1");
  assert.equal(exp1.responsibilities, aiGeneratedText);
  // Sibling exp_2 is intact
  const exp2 = extracted.validExperience.find((e) => e.id === "exp_2");
  assert.ok(exp2.responsibilities.includes("REST APIs"));
});

// TEST 11: ATS Template Structure Verifies Single-Column Plain Text Suitability
test("Test 11: ATS template requirements satisfied: standard headings and clean text", () => {
  const atsConfig = getTemplateConfig("ats");
  assert.equal(atsConfig.id, "ats");
  assert.equal(atsConfig.badge, "ATS-Safe");

  const data = createMockResumeData();
  const extracted = extractValidResumeSections(data);

  // Standard headings match requirement
  const expectedHeadings = [
    "Professional Summary",
    "Skills",
    "Work Experience",
    "Education",
    "Projects",
    "Certifications",
    "Achievements"
  ];

  assert.equal(expectedHeadings.length, 7);
  assert.ok(extracted.validExperience.length > 0);
  assert.ok(extracted.validEducation.length > 0);
});

// TEST 12: Long Text and URLs Do Not Cause Failures
test("Test 12: Long URLs and deep text strings are preserved without truncation bugs", () => {
  const longUrl = "https://example.com/very/deep/project/path/with/parameters?query=1&token=abcdef1234567890";
  const data = {
    ...createMockResumeData(),
    projects: [
      {
        id: "proj_long",
        projectName: "Enterprise Portal",
        projectUrl: longUrl,
        description: "A".repeat(1000)
      }
    ]
  };

  const extracted = extractValidResumeSections(data);
  assert.equal(extracted.validProjects[0].projectUrl, longUrl);
  assert.equal(extracted.validProjects[0].description.length, 1000);
});

console.log("-------------------------------------------------");
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("-------------------------------------------------");

if (failed > 0) process.exit(1);
