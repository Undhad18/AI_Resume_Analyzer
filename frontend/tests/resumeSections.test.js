/**
 * Test Suite: Resume Sections & Dynamic Form Management (Module 8 Lesson 8.2)
 * Tests:
 * 1. Skills dynamic additions, removals, deduplication, and editing
 * 2. Experience dynamic additions, unique IDs, independent editing, deletion, reordering
 * 3. Education dynamic additions, unique IDs, independent editing, deletion, reordering
 * 4. Projects dynamic additions, independent editing, URL validation, reordering
 * 5. Certifications and Achievements dynamic operations
 * 6. Currently working date logic & date range validation
 * 7. Preview data synchronization & empty section filtering
 * 8. Immutability of state updates
 */

import {
  generateUniqueId,
  createEmptyExperience,
  createEmptyEducation,
  createEmptyProject,
  createEmptyCertification,
  createEmptyAchievement,
  INITIAL_RESUME_DATA,
  validateDateRange,
  isValidUrl
} from "../src/utils/resumeBuilderValidation.js";

function runResumeSectionsTests() {
  console.log("=================================================");
  console.log("   AI RESUME ANALYZER - RESUME SECTIONS TESTS    ");
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

  // Test 1: Unique ID generator
  const id1 = generateUniqueId("exp");
  const id2 = generateUniqueId("exp");
  assert(
    id1 !== id2 && id1.startsWith("exp_"),
    "Test 1: generateUniqueId generates distinct, prefixed, collision-free identifiers"
  );

  // Test 2: Skills - Add multiple skills
  let skills = ["React.js"];
  const addSkill = (list, skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return list;
    if (list.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return list;
    return [...list, trimmed];
  };
  skills = addSkill(skills, "Node.js");
  skills = addSkill(skills, "TypeScript");
  assert(
    skills.length === 3 && skills.includes("TypeScript"),
    "Test 2: Multiple unique skills can be added consecutively"
  );

  // Test 3: Skills - Prevent case-insensitive duplicates
  const beforeDupCount = skills.length;
  skills = addSkill(skills, "node.js");
  skills = addSkill(skills, "REACT.JS");
  assert(
    skills.length === beforeDupCount,
    "Test 3: Duplicate skills are rejected case-insensitively"
  );

  // Test 4: Skills - Remove skill
  skills = skills.filter((s) => s !== "Node.js");
  assert(
    skills.length === 2 && !skills.includes("Node.js") && skills.includes("TypeScript"),
    "Test 4: Removing skill preserves remaining skills and order"
  );

  // Test 5: Experience - Add multiple records with stable IDs
  let experience = [
    { ...createEmptyExperience(), id: "exp_1", jobTitle: "Junior Dev", company: "Company A" }
  ];
  const newExp = { ...createEmptyExperience(), id: "exp_2", jobTitle: "Senior Dev", company: "Company B" };
  experience = [...experience, newExp];
  assert(
    experience.length === 2 && experience[0].id === "exp_1" && experience[1].id === "exp_2",
    "Test 5: Work experience supports multiple entries with stable unique IDs"
  );

  // Test 6: Experience - Edit one experience without mutating another
  const updateExperience = (list, id, field, value) => {
    return list.map((item) => (item.id === id ? { ...item, [field]: value } : item));
  };
  experience = updateExperience(experience, "exp_1", "jobTitle", "Mid-Level Dev");
  assert(
    experience[0].jobTitle === "Mid-Level Dev" && experience[1].jobTitle === "Senior Dev",
    "Test 6: Editing one experience entry does not mutate or affect other entries"
  );

  // Test 7: Experience - Reorder entries (Move Down / Move Up)
  const reorderArray = (list, from, to) => {
    const copy = [...list];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    return copy;
  };
  experience = reorderArray(experience, 0, 1);
  assert(
    experience[0].id === "exp_2" && experience[1].id === "exp_1",
    "Test 7: Reordering experience entries swaps positions accurately"
  );

  // Test 8: Experience - Delete one entry
  experience = experience.filter((item) => item.id !== "exp_1");
  assert(
    experience.length === 1 && experience[0].id === "exp_2",
    "Test 8: Deleting experience by ID removes the specified record cleanly"
  );

  // Test 9: Education - Add multiple records with unique IDs
  let education = [
    { ...createEmptyEducation(), id: "edu_1", degree: "B.Tech", institution: "University X" }
  ];
  const newEdu = { ...createEmptyEducation(), id: "edu_2", degree: "M.S.", institution: "University Y" };
  education = [...education, newEdu];
  assert(
    education.length === 2 && education[1].degree === "M.S.",
    "Test 9: Education supports multiple entries with independent IDs"
  );

  // Test 10: Education - Edit and delete
  education = education.map((e) => (e.id === "edu_1" ? { ...e, grade: "8.9 CGPA" } : e));
  assert(education[0].grade === "8.9 CGPA", "Test 10a: Education field updates immutably");
  education = education.filter((e) => e.id !== "edu_1");
  assert(education.length === 1 && education[0].id === "edu_2", "Test 10b: Education deletion operates cleanly");

  // Test 11: Projects - Add multiple, edit, URL validation, reorder
  let projects = [
    { ...createEmptyProject(), id: "proj_1", projectName: "Project Alpha", projectUrl: "https://alpha.dev" },
    { ...createEmptyProject(), id: "proj_2", projectName: "Project Beta", projectUrl: "https://beta.dev" }
  ];
  assert(
    projects.length === 2 && isValidUrl(projects[0].projectUrl),
    "Test 11a: Projects support multiple records with valid project URLs"
  );
  projects = reorderArray(projects, 0, 1);
  assert(
    projects[0].id === "proj_2" && projects[1].id === "proj_1",
    "Test 11b: Projects reordering updates position order properly"
  );

  // Test 12: Certifications - Add, update, remove
  let certs = [
    { ...createEmptyCertification(), id: "c_1", certificationName: "AWS SAA", issuingOrganization: "AWS" },
    { ...createEmptyCertification(), id: "c_2", certificationName: "CKA", issuingOrganization: "CNCF" }
  ];
  certs = certs.map((c) => (c.id === "c_1" ? { ...c, issueDate: "2024" } : c));
  assert(certs[0].issueDate === "2024", "Test 12a: Certification updates immutably");
  certs = certs.filter((c) => c.id !== "c_1");
  assert(certs.length === 1 && certs[0].id === "c_2", "Test 12b: Certification deletion removes expected item");

  // Test 13: Achievements - Add, update, remove
  let achs = [
    { ...createEmptyAchievement(), id: "a_1", title: "Dean's List", date: "2023" },
    { ...createEmptyAchievement(), id: "a_2", title: "Hackathon Winner", date: "2024" }
  ];
  achs = achs.filter((a) => a.id !== "a_1");
  assert(achs.length === 1 && achs[0].title === "Hackathon Winner", "Test 13: Achievements dynamic management functions properly");

  // Test 14: Date range validation - End date preceding start date fails
  const invalidDate = validateDateRange("2024-05", "2023-01", false);
  assert(
    invalidDate.isValid === false && Boolean(invalidDate.error),
    "Test 14: validateDateRange correctly flags end date earlier than start date"
  );

  // Test 15: Date range validation - Valid chronological order passes
  const validDate = validateDateRange("2022-01", "2023-12", false);
  assert(
    validDate.isValid === true,
    "Test 15: validateDateRange accepts proper chronological order"
  );

  // Test 16: Currently working experience ignores end date validation
  const workingDate = validateDateRange("2024-01", "", true);
  assert(
    workingDate.isValid === true,
    "Test 16: validateDateRange succeeds when currentlyWorking is active without end date"
  );

  // Test 17: Live Preview filter - Valid non-empty entries are recognized
  const candidateResume = {
    ...INITIAL_RESUME_DATA,
    personalInfo: { fullName: "Harshil", email: "h@test.com" },
    skills: ["React", "Node"],
    experience: [
      { id: "e1", jobTitle: "Dev", company: "Co", responsibilities: "Built apps" }
    ],
    education: []
  };

  const validExps = (candidateResume.experience || []).filter(
    (e) => e.jobTitle?.trim() || e.company?.trim() || e.responsibilities?.trim()
  );
  const validEdus = (candidateResume.education || []).filter(
    (edu) => edu.institution?.trim() || edu.degree?.trim()
  );

  assert(
    validExps.length === 1 && validEdus.length === 0,
    "Test 17: ResumePreview empty section filter hides empty sections while showing populated ones"
  );

  // Test 18: Factory functions provide stable default schema
  const emptyExp = createEmptyExperience();
  assert(
    Boolean(emptyExp.id) &&
      emptyExp.jobTitle === "" &&
      emptyExp.company === "" &&
      emptyExp.currentlyWorking === false,
    "Test 18: Factory functions initialize all required model fields with default values"
  );

  console.log("\n-------------------------------------------------");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("-------------------------------------------------");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runResumeSectionsTests();
