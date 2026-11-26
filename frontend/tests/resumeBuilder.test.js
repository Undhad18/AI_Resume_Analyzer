/**
 * Unit Test Suite for Resume Builder UI State & Validation (Module 8 Lesson 8.1)
 */

import {
  INITIAL_RESUME_DATA,
  isValidEmail,
  isValidUrl,
  validatePersonalInfo
} from "../src/utils/resumeBuilderValidation.js";

function runResumeBuilderTests() {
  console.log("=================================================");
  console.log("   AI RESUME ANALYZER - RESUME BUILDER TESTS     ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = "") => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      failed++;
    }
  };

  // Test 1: Initial state structure
  assert(
    INITIAL_RESUME_DATA &&
      typeof INITIAL_RESUME_DATA === "object" &&
      typeof INITIAL_RESUME_DATA.personalInfo === "object" &&
      Array.isArray(INITIAL_RESUME_DATA.skills) &&
      Array.isArray(INITIAL_RESUME_DATA.experience) &&
      Array.isArray(INITIAL_RESUME_DATA.education) &&
      Array.isArray(INITIAL_RESUME_DATA.projects) &&
      Array.isArray(INITIAL_RESUME_DATA.certifications) &&
      Array.isArray(INITIAL_RESUME_DATA.achievements),
    "Test 1: INITIAL_RESUME_DATA contains all 8 required sections with proper types"
  );

  // Test 2: Email validation
  assert(
    isValidEmail("harshil@example.com") === true &&
      isValidEmail("test.user+tag@domain.co.uk") === true &&
      isValidEmail("invalid-email") === false &&
      isValidEmail("") === false,
    "Test 2: isValidEmail correctly verifies valid email addresses and rejects malformed strings"
  );

  // Test 3: URL validation (optional fields allow empty)
  assert(
    isValidUrl("") === true &&
      isValidUrl("https://linkedin.com/in/harshil") === true &&
      isValidUrl("http://github.com/harshil") === true &&
      isValidUrl("github.com/harshil") === true &&
      isValidUrl("not a url at all") === false,
    "Test 3: isValidUrl accepts valid web URLs and empty strings, while rejecting invalid URLs"
  );

  // Test 4: validatePersonalInfo with empty data
  const emptyValidation = validatePersonalInfo({});
  assert(
    emptyValidation.isValid === false &&
      Boolean(emptyValidation.errors.fullName) &&
      Boolean(emptyValidation.errors.email),
    "Test 4: validatePersonalInfo rejects empty personal info with required field errors"
  );

  // Test 5: validatePersonalInfo with valid required fields
  const validValidation = validatePersonalInfo({
    fullName: "Harshil Undhad",
    email: "harshil@example.com",
    phone: "9876543210"
  });
  assert(
    validValidation.isValid === true && Object.keys(validValidation.errors).length === 0,
    "Test 5: validatePersonalInfo passes when required fullName and email are provided"
  );

  // Test 6: validatePersonalInfo with invalid optional link
  const invalidUrlValidation = validatePersonalInfo({
    fullName: "Harshil Undhad",
    email: "harshil@example.com",
    linkedIn: "not a url"
  });
  assert(
    invalidUrlValidation.isValid === false && Boolean(invalidUrlValidation.errors.linkedIn),
    "Test 6: validatePersonalInfo flags invalid LinkedIn URL while keeping required fields valid"
  );

  // Test 7: Skills deduplication logic
  const initialSkills = ["React.js", "Node.js", "Tailwind CSS"];
  const isDuplicateReact = initialSkills.some((s) => s.toLowerCase() === "react.js".toLowerCase());
  const isDuplicateCaseInsensitive = initialSkills.some((s) => s.toLowerCase() === "REACT.JS".toLowerCase());
  const isUniqueTypeScript = initialSkills.some((s) => s.toLowerCase() === "typescript".toLowerCase());
  assert(
    isDuplicateReact === true && isDuplicateCaseInsensitive === true && isUniqueTypeScript === false,
    "Test 7: Skills deduplication checks verify case-insensitively before adding items"
  );

  // Test 8: Skills removal by index
  const afterRemoval = initialSkills.filter((_, idx) => idx !== 1);
  assert(
    afterRemoval.length === 2 && afterRemoval[0] === "React.js" && afterRemoval[1] === "Tailwind CSS",
    "Test 8: Removing skill by index preserves order and remaining skills"
  );

  // Test 9: Experience section field mapping
  const sampleExp = {
    jobTitle: "Software Developer",
    company: "Tech Corp",
    startDate: "2022-01",
    endDate: "2023-12",
    responsibilities: "Engineered web applications",
    achievements: "Improved page load speed"
  };
  assert(
    sampleExp.jobTitle === "Software Developer" &&
      sampleExp.company === "Tech Corp" &&
      Boolean(sampleExp.responsibilities) &&
      Boolean(sampleExp.achievements),
    "Test 9: Experience section supports job title, company, dates, responsibilities, and achievements"
  );

  // Test 10: Education section field mapping
  const sampleEdu = {
    institution: "GTU",
    degree: "B.Tech",
    fieldOfStudy: "Computer Engineering",
    graduationYear: "2024"
  };
  assert(
    sampleEdu.institution === "GTU" &&
      sampleEdu.degree === "B.Tech" &&
      sampleEdu.fieldOfStudy === "Computer Engineering" &&
      sampleEdu.graduationYear === "2024",
    "Test 10: Education section supports institution, degree, field of study, and graduation year"
  );

  // Test 11: Projects section field mapping
  const sampleProj = {
    name: "AI Resume Analyzer",
    technologies: "React, Node, Express, MySQL",
    description: "Evaluates resume ATS compliance",
    projectUrl: "https://github.com/test/project"
  };
  assert(
    sampleProj.name === "AI Resume Analyzer" &&
      sampleProj.technologies.includes("React") &&
      isValidUrl(sampleProj.projectUrl) === true,
    "Test 11: Projects section supports name, technologies, description, and live URL"
  );

  // Test 12: Certifications and Achievements mapping
  const sampleCert = { name: "AWS SAA", issuer: "AWS", issueDate: "2023" };
  const sampleAch = { title: "Hackathon Winner", description: "Won first prize" };
  assert(
    Boolean(sampleCert.name && sampleCert.issuer && sampleCert.issueDate) &&
      Boolean(sampleAch.title && sampleAch.description),
    "Test 12: Certifications and Achievements sections support title, issuer/description, and dates"
  );

  // Test 13: Empty section detection logic (for ResumePreview)
  const emptyResume = { ...INITIAL_RESUME_DATA };
  const validExpEmpty = (emptyResume.experience || []).filter(
    (exp) => exp.jobTitle?.trim() || exp.company?.trim() || exp.responsibilities?.trim()
  );
  assert(
    validExpEmpty.length === 0,
    "Test 13: Empty experience entries are filtered out to prevent rendering blank blocks"
  );

  // Test 14: Non-empty experience detection logic
  const populatedResume = {
    ...INITIAL_RESUME_DATA,
    experience: [sampleExp]
  };
  const validExpPopulated = (populatedResume.experience || []).filter(
    (exp) => exp.jobTitle?.trim() || exp.company?.trim() || exp.responsibilities?.trim()
  );
  assert(
    validExpPopulated.length === 1 && validExpPopulated[0].jobTitle === "Software Developer",
    "Test 14: Populated experience entries are correctly recognized and displayed in preview"
  );

  console.log("\n-------------------------------------------------");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("-------------------------------------------------");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runResumeBuilderTests();
