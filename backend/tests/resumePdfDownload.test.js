/**
 * Automated Test Suite: Enhanced Resume PDF Download & Templates (Lesson 8.5)
 */

import assert from "node:assert/strict";
import {
  generateResumePdf,
  ALLOWED_TEMPLATES,
  ResumePdfError
} from "../services/resumePdfService.js";
import {
  sanitizePdfText,
  extractValidPdfSections,
  sanitizeFilename
} from "../services/pdfTemplates/pdfDataHelper.js";
import { resumePdfDownloadRequestSchema } from "../validators/resumePdfDownloadSchema.js";
import { downloadResumePdf } from "../controllers/resumeBuilderController.js";

console.log("=================================================");
console.log(" AI RESUME BUILDER - PDF GENERATION TESTS        ");
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

const SAMPLE_RESUME = {
  resumeTitle: "Senior Software Engineer Resume",
  personalInfo: {
    fullName: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+1 (555) 019-2834",
    location: "San Francisco, CA",
    linkedIn: "https://linkedin.com/in/janedoe",
    gitHub: "https://github.com/janedoe",
    portfolio: "https://janedoe.dev"
  },
  professionalSummary: "Results-driven Senior Full Stack Developer with 6+ years of expertise designing and deploying scalable web services using React, Node.js, and cloud systems.",
  skills: ["React.js", "Node.js", "Express", "TypeScript", "Tailwind CSS", "MySQL", "Docker", "REST APIs"],
  experience: [
    {
      id: "exp_1",
      jobTitle: "Senior Frontend Engineer",
      company: "Acme Technologies",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      currentlyWorking: true,
      responsibilities: "Spearheaded frontend migration to React 19 and Vite, reducing initial bundle size by 35%.\nMentored 4 junior engineers on state management and performance profiling.",
      achievements: "Delivered real-time telemetry dashboard utilized by over 50k enterprise users."
    },
    {
      id: "exp_2",
      jobTitle: "Software Developer",
      company: "Innovate Labs",
      location: "San Jose, CA",
      startDate: "2019-06",
      endDate: "2022-02",
      currentlyWorking: false,
      responsibilities: "Engineered responsive client dashboards using React and Express.\nImplemented Redis caching layer cutting response latency by 40%.",
      achievements: "Recognized with Developer of the Year Award in 2021."
    }
  ],
  education: [
    {
      id: "edu_1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      startDate: "2015-08",
      endDate: "2019-05",
      graduationYear: "2019",
      grade: "3.85 GPA",
      description: "Graduated with High Honors; Dean's Honor List across all semesters."
    }
  ],
  projects: [
    {
      id: "proj_1",
      projectName: "AI Resume Analyzer",
      technologies: "React, Node.js, Express, MySQL, PDFKit",
      description: "Standalone automated resume evaluation platform with rule-based scoring and dynamic builder.",
      projectUrl: "https://github.com/janedoe/resume-analyzer",
      startDate: "2024-01",
      endDate: "2024-06"
    }
  ],
  certifications: [
    {
      id: "cert_1",
      certificationName: "AWS Certified Solutions Architect - Associate",
      issuingOrganization: "Amazon Web Services",
      issueDate: "2023-04",
      credentialUrl: "https://aws.amazon.com/verify/12345"
    }
  ],
  achievements: [
    {
      id: "ach_1",
      title: "1st Place Winner - Bay Area Cloud Hackathon",
      description: "Built autonomous document classification tool within 48 hours.",
      date: "2023-10"
    }
  ]
};

// 1. PDF GENERATION AND HEADER VERIFICATION
await runTest("Test 1: PDFKit service creates a valid PDF with %PDF- binary header", async () => {
  const result = await generateResumePdf({
    resumeData: SAMPLE_RESUME,
    selectedTemplate: "modern"
  });

  assert.ok(result.buffer instanceof Buffer);
  assert.ok(result.buffer.length > 1000);
  const pdfHeader = result.buffer.subarray(0, 5).toString("utf-8");
  assert.equal(pdfHeader, "%PDF-");
});

// 2. MODERN TEMPLATE
await runTest("Test 2: Modern template generates valid PDF buffer", async () => {
  const result = await generateResumePdf({
    resumeData: SAMPLE_RESUME,
    selectedTemplate: "modern"
  });

  assert.ok(result.buffer.length > 2000);
  assert.ok(result.filename.includes("modern"));
  assert.ok(result.pageCount >= 1);
});

// 3. CLASSIC TEMPLATE
await runTest("Test 3: Classic template generates valid PDF buffer with serif styling", async () => {
  const result = await generateResumePdf({
    resumeData: SAMPLE_RESUME,
    selectedTemplate: "classic"
  });

  assert.ok(result.buffer.length > 2000);
  assert.ok(result.filename.includes("classic"));
  assert.ok(result.pageCount >= 1);
});

// 4. MINIMAL TEMPLATE
await runTest("Test 4: Minimal template generates valid clean PDF buffer", async () => {
  const result = await generateResumePdf({
    resumeData: SAMPLE_RESUME,
    selectedTemplate: "minimal"
  });

  assert.ok(result.buffer.length > 2000);
  assert.ok(result.filename.includes("minimal"));
  assert.ok(result.pageCount >= 1);
});

// 5. ATS TEMPLATE
await runTest("Test 5: ATS template generates valid single-column plain PDF buffer", async () => {
  const result = await generateResumePdf({
    resumeData: SAMPLE_RESUME,
    selectedTemplate: "ats"
  });

  assert.ok(result.buffer.length > 2000);
  assert.ok(result.filename.includes("ats"));
  assert.ok(result.pageCount >= 1);
});

// 6. MULTIPLE EXPERIENCE ENTRIES
await runTest("Test 6: Multiple experience entries render cleanly", async () => {
  const extracted = extractValidPdfSections(SAMPLE_RESUME);
  assert.equal(extracted.validExperience.length, 2);
  assert.equal(extracted.validExperience[0].jobTitle, "Senior Frontend Engineer");
  assert.equal(extracted.validExperience[1].jobTitle, "Software Developer");
});

// 7. MULTIPLE EDUCATION AND PROJECT ENTRIES
await runTest("Test 7: Education and project entries are extracted properly", async () => {
  const extracted = extractValidPdfSections(SAMPLE_RESUME);
  assert.equal(extracted.validEducation.length, 1);
  assert.equal(extracted.validEducation[0].institution, "University of California, Berkeley");
  assert.equal(extracted.validProjects.length, 1);
  assert.equal(extracted.validProjects[0].projectName, "AI Resume Analyzer");
});

// 8. EMPTY OPTIONAL SECTIONS OMITTED
await runTest("Test 8: Empty optional sections are safely omitted without errors", async () => {
  const sparseResume = {
    personalInfo: {
      fullName: "Alex Smith",
      email: "alex@example.com"
    },
    skills: ["Python", "Django"],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    achievements: []
  };

  const extracted = extractValidPdfSections(sparseResume);
  assert.equal(extracted.hasPersonalInfo, true);
  assert.equal(extracted.hasSkills, true);
  assert.equal(extracted.validExperience.length, 0);
  assert.equal(extracted.validEducation.length, 0);
  assert.equal(extracted.validProjects.length, 0);
  assert.equal(extracted.isCompletelyEmpty, false);

  const pdfResult = await generateResumePdf({
    resumeData: sparseResume,
    selectedTemplate: "ats"
  });

  assert.ok(pdfResult.buffer.length > 500);
});

// 9. MULTI-PAGE HANDLING FOR LONG RESUMES
await runTest("Test 9: Long resume text automatically creates additional pages with page numbers", async () => {
  const longExperiences = Array.from({ length: 10 }, (_, i) => ({
    id: `exp_long_${i}`,
    jobTitle: `Lead Architect Phase ${i + 1}`,
    company: `Global Enterprise Systems ${i + 1}`,
    location: "New York, NY",
    startDate: `201${i}-01`,
    endDate: `201${i + 1}-01`,
    responsibilities: "Designed and scaled distributed microservice clusters handling upwards of 100M daily RPC requests.\nManaged continuous integration pipelines, automated deployment rollouts, and disaster recovery architectures.\nCoordinated cross-functional teams spanning 4 time zones with strict SLA compliance.",
    achievements: `Accomplished 99.999% uptime benchmark throughout tenure in role ${i + 1}.`
  }));

  const longResume = {
    ...SAMPLE_RESUME,
    experience: longExperiences
  };

  const result = await generateResumePdf({
    resumeData: longResume,
    selectedTemplate: "modern"
  });

  assert.ok(result.pageCount > 1, `Expected multi-page PDF, got pageCount=${result.pageCount}`);
});

// 10. TEXT SANITIZATION & UNICODE HANDLING
await runTest("Test 10: Unicode characters, smart quotes, and dashes are safely sanitized", () => {
  const dirty = "Jane’s “World-Class” CV — with non-breaking\u00A0space and bullet \u2022 item";
  const cleaned = sanitizePdfText(dirty);

  assert.ok(!cleaned.includes("’"));
  assert.ok(cleaned.includes("'"));
  assert.ok(!cleaned.includes("“"));
  assert.ok(!cleaned.includes("”"));
  assert.ok(cleaned.includes('"'));
  assert.ok(!cleaned.includes("—"));
  assert.ok(cleaned.includes("-"));
});

// 11. FILENAME SANITIZATION
await runTest("Test 11: Filename sanitization generates clean, safe alphanumeric names", () => {
  const filename1 = sanitizeFilename("Jane Doe, PMP", "modern");
  assert.equal(filename1, "jane_doe_pmp_modern.pdf");

  const filename2 = sanitizeFilename("   Alex & O'Connor / Lead   ", "classic");
  assert.equal(filename2, "alex_o_connor_lead_classic.pdf");

  const filenameFallback = sanitizeFilename("", "unknown_template");
  assert.equal(filenameFallback, "resume_modern.pdf");
});

// 12. COMPLETELY BLANK RESUME REJECTION
await runTest("Test 12: Completely empty resume is rejected with 422 error", async () => {
  const blankResume = {
    personalInfo: {},
    skills: [],
    experience: [],
    education: [],
    projects: []
  };

  await assert.rejects(
    async () => {
      await generateResumePdf({ resumeData: blankResume, selectedTemplate: "modern" });
    },
    (err) => {
      assert.ok(err instanceof ResumePdfError);
      assert.equal(err.statusCode, 422);
      assert.equal(err.code, "EMPTY_RESUME");
      return true;
    }
  );
});

// 13. ZOD SCHEMA VALIDATION
await runTest("Test 13: Zod schema enforces valid selectedTemplate and parses resumeData", () => {
  const validPayload = {
    selectedTemplate: "classic",
    resumeData: SAMPLE_RESUME
  };

  const parsed = resumePdfDownloadRequestSchema.safeParse(validPayload);
  assert.equal(parsed.success, true);

  const invalidTemplatePayload = {
    selectedTemplate: "invalid_template_id",
    resumeData: SAMPLE_RESUME
  };

  const invalidParsed = resumePdfDownloadRequestSchema.safeParse(invalidTemplatePayload);
  assert.equal(invalidParsed.success, false);
});

// 14. CONTROLLER AUTHENTICATION ENFORCEMENT
await runTest("Test 14: Controller rejects unauthenticated requests with 401 status", async () => {
  let statusCode = null;
  let responseBody = null;

  const mockReq = {
    user: null, // Unauthenticated
    body: {
      selectedTemplate: "modern",
      resumeData: SAMPLE_RESUME
    }
  };

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    }
  };

  await downloadResumePdf(mockReq, mockRes);
  assert.equal(statusCode, 401);
  assert.equal(responseBody.success, false);
});

// 15. CONTROLLER SUCCESS RESPONSE HEADERS & ATTACHMENT
await runTest("Test 15: Controller sets Content-Type, Content-Disposition, and returns 200 Buffer", async () => {
  let statusCode = null;
  let sentBuffer = null;
  const headers = {};

  const mockReq = {
    user: { id: 1, email: "user@example.com" },
    body: {
      selectedTemplate: "modern",
      resumeData: SAMPLE_RESUME
    }
  };

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    send(data) {
      sentBuffer = data;
      return this;
    }
  };

  await downloadResumePdf(mockReq, mockRes);

  assert.equal(statusCode, 200);
  assert.equal(headers["content-type"], "application/pdf");
  assert.ok(headers["content-disposition"].includes("attachment"));
  assert.ok(headers["content-disposition"].includes("jane_doe_modern.pdf"));
  assert.ok(sentBuffer instanceof Buffer);
  assert.equal(sentBuffer.subarray(0, 5).toString("utf-8"), "%PDF-");
});

console.log("-------------------------------------------------");
console.log(`TEST SUMMARY: ${passedCount} Passed, ${failedCount} Failed`);
console.log("-------------------------------------------------");

if (failedCount > 0) {
  process.exit(1);
}
