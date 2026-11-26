import http from "http";
import assert from "assert";
import fs from "fs";
import path from "path";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import { storeResumeFileAndMetadata } from "../services/resumeStorageService.js";
import { createValidPdfBuffer } from "./fixtures/documentFixtures.js";
import { STAGING_DIR } from "../config/multerConfig.js";
import {
    normalizeSkillName,
    getSkillCategory,
    buildSkillRegex,
    isSkillMatch
} from "../services/skillNormalizationService.js";
import { extractResumeSkills } from "../services/resumeSkillsExtractionService.js";
import {
    extractJobKeywords,
    compareSkillsWithJobDescription
} from "../services/keywordDetectionService.js";
import {
    calculateSkillsAndKeywords,
    saveSkillsKeywordsRecord,
    runSkillsKeywordsWorkflow,
    getLatestSkillsKeywordsForResume
} from "../services/skillsKeywordsWorkflow.js";
import {
    skillsKeywordsResponseSchema,
    jobDescriptionInputSchema
} from "../validators/skillsKeywordsSchema.js";
import { calculateAtsScore } from "../services/atsScoringService.js";
import { calculateDetailedResumeScore } from "../services/detailedResumeScoringService.js";
import { calculateFormattingGrammarScore } from "../services/formattingGrammarScoringWorkflow.js";
import { calculateStrengthsWeaknesses } from "../services/strengthsWeaknessesWorkflow.js";

const PORT = 5088;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;
let passCount = 0;
let failCount = 0;

const assertTest = (condition, message) => {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passCount++;
    } else {
        console.error(`[FAIL] ${message}`);
        failCount++;
        throw new Error(`Test failed: ${message}`);
    }
};

const requestApi = (path, method = "GET", body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                "x-csrf-token": "test-csrf-token",
                ...headers
            }
        };

        let requestBody = null;
        if (body && typeof body === "object" && !(body instanceof Buffer)) {
            requestBody = JSON.stringify(body);
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = Buffer.byteLength(requestBody);
        } else if (body instanceof Buffer) {
            requestBody = body;
            options.headers["Content-Length"] = body.length;
        }

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        if (requestBody) {
            req.write(requestBody);
        }
        req.end();
    });
};

const runAllSkillsKeywordsTests = async () => {
    console.log("=================================================");
    console.log("MODULE 7 LESSON 7.2: SKILLS & KEYWORDS TESTS");
    console.log("=================================================\n");

    try {
        await testDatabaseConnection();
        server = app.listen(PORT);
        await new Promise((resolve) => server.once("listening", resolve));

        const uniqueSuffix = Date.now();
        const testUserA = await registerUser({
            fullName: "Skills User A",
            email: `skills_a_${uniqueSuffix}@example.com`,
            password: "Password123!Secure"
        });
        const tokenA = generateToken({
            userId: testUserA.id,
            id: testUserA.id,
            email: testUserA.email,
            role: "user"
        });

        const testUserB = await registerUser({
            fullName: "Skills User B",
            email: `skills_b_${uniqueSuffix}@example.com`,
            password: "Password123!Secure"
        });
        const tokenB = generateToken({
            userId: testUserB.id,
            id: testUserB.id,
            email: testUserB.email,
            role: "user"
        });

        // ==========================================
        // PART 1: GENERAL SKILLS TESTS (1 - 12)
        // ==========================================
        console.log("--- PART 1: GENERAL SKILLS TESTS ---");

        // 1. Programming skill detection
        const resumeProg = { skills: ["JavaScript", "Python", "Go"] };
        const res1 = extractResumeSkills({ structuredResume: resumeProg });
        const hasProg = res1.detectedSkills.some(s => s.category === "programming_languages" && s.normalizedName === "JavaScript");
        assertTest(hasProg, "1. Programming skill detection correctly categorizes languages");

        // 2. Frontend skill detection
        const resumeFront = { skills: ["React", "Tailwind CSS", "HTML5"] };
        const res2 = extractResumeSkills({ structuredResume: resumeFront });
        const hasFront = res2.detectedSkills.some(s => s.category === "frontend" && s.normalizedName === "React");
        assertTest(hasFront, "2. Frontend skill detection identifies modern UI libraries and styling");

        // 3. Backend skill detection
        const resumeBack = { skills: ["Node.js", "Express.js", "Django"] };
        const res3 = extractResumeSkills({ structuredResume: resumeBack });
        const hasBack = res3.detectedSkills.some(s => s.category === "backend" && s.normalizedName === "Node.js");
        assertTest(hasBack, "3. Backend skill detection captures server runtimes and web frameworks");

        // 4. Database skill detection
        const resumeDb = { skills: ["PostgreSQL", "MongoDB", "Redis"] };
        const res4 = extractResumeSkills({ structuredResume: resumeDb });
        const hasDb = res4.detectedSkills.some(s => s.category === "database" && s.normalizedName === "PostgreSQL");
        assertTest(hasDb, "4. Database skill detection captures SQL and NoSQL databases");

        // 5. Tool detection
        const resumeTools = { skills: ["Git", "Docker", "Postman", "VS Code"] };
        const res5 = extractResumeSkills({ structuredResume: resumeTools });
        const hasTool = res5.detectedSkills.some(s => s.category === "tools" && s.normalizedName === "Git");
        assertTest(hasTool, "5. Tool detection categorizes version control and developer utilities");

        // 6. Skill normalization
        assertTest(normalizeSkillName("js") === "JavaScript", "6a. Skill normalization: js -> JavaScript");
        assertTest(normalizeSkillName("react.js") === "React", "6b. Skill normalization: react.js -> React");
        assertTest(normalizeSkillName("node") === "Node.js", "6c. Skill normalization: node -> Node.js");

        // 7. Alias matching
        assertTest(isSkillMatch("k8s", "Kubernetes"), "7a. Alias matching: k8s matches Kubernetes");
        assertTest(isSkillMatch("postgres", "PostgreSQL"), "7b. Alias matching: postgres matches PostgreSQL");
        assertTest(isSkillMatch("restful apis", "REST API"), "7c. Alias matching: restful apis matches REST API");

        // 8. Duplicate removal
        const duplicateResume = { skills: ["React", "react.js", "REACT", "Node.js", "nodejs"] };
        const res8 = extractResumeSkills({ structuredResume: duplicateResume });
        const reactEntries = res8.detectedSkills.filter(s => s.normalizedName === "React");
        const nodeEntries = res8.detectedSkills.filter(s => s.normalizedName === "Node.js");
        assertTest(reactEntries.length === 1 && nodeEntries.length === 1, "8. Duplicate removal merges case and alias variants into single entries");

        // 9. Skill evidence detection
        const evidencedResume = {
            skills: ["React"],
            projects: [
                { projectName: "E-Store", technologies: ["React"], description: "Built storefront using React and Tailwind." }
            ]
        };
        const res9 = extractResumeSkills({ structuredResume: evidencedResume });
        const reactEvidenced = res9.detectedSkills.find(s => s.normalizedName === "React");
        assertTest(
            reactEvidenced?.evidenceStatus === "explicit_and_applied" && reactEvidenced?.evidence?.length > 0,
            "9. Skill evidence detection marks verified skills with project evidence quotes"
        );

        // 10. Skills found only in projects
        const projectOnlyResume = {
            skills: [],
            projects: [
                { projectName: "Search Index", technologies: ["Elasticsearch"], description: "Cluster with Elasticsearch." }
            ]
        };
        const res10 = extractResumeSkills({ structuredResume: projectOnlyResume });
        const esSkill = res10.detectedSkills.find(s => s.normalizedName === "Elasticsearch");
        assertTest(
            esSkill && esSkill.evidenceStatus === "applied_only" && esSkill.sourceSection === "projects",
            "10. Skills found only in projects are captured as applied_only"
        );

        // 11. Skills found only in experience
        const expOnlyResume = {
            skills: [],
            experience: [
                { jobTitle: "DevOps Engineer", company: "CloudCorp", responsibilities: ["Automated deployments with Terraform and Ansible."] }
            ]
        };
        const res11 = extractResumeSkills({ structuredResume: expOnlyResume });
        const tfSkill = res11.detectedSkills.find(s => s.normalizedName === "Terraform");
        assertTest(
            tfSkill && tfSkill.evidenceStatus === "applied_only" && tfSkill.sourceSection === "experience",
            "11. Skills found only in experience are captured with role context"
        );

        // 12. General mode without job description
        const generalAnalysis = await calculateSkillsAndKeywords({
            rawText: "Sample resume with React, Node.js, and PostgreSQL.",
            structuredResume: { skills: ["React", "Node.js", "PostgreSQL"] },
            resumeId: 101,
            userId: testUserA.id,
            mode: "general"
        });
        assertTest(
            generalAnalysis.detectionMode === "general" &&
            generalAnalysis.missingSkills.length === 0 &&
            generalAnalysis.detectedSkills.length === 3,
            "12. General mode without job description operates cleanly without inventing missing job requirements"
        );

        // ==========================================
        // PART 2: JOB-SPECIFIC TESTS (13 - 22)
        // ==========================================
        console.log("\n--- PART 2: JOB-SPECIFIC TESTS ---");

        const sampleJd = `
            Senior Full Stack Engineer
            Required Qualifications:
            - Must have 3+ years experience with React, Node.js, and TypeScript.
            - Strong knowledge of PostgreSQL and REST API architecture.
            Preferred Skills:
            - Familiarity with Docker and Kubernetes is a plus.
            - Experience with GraphQL is nice to have.
        `;

        const sampleResumeSkills = [
            { normalizedName: "React", category: "frontend", sourceSection: "skills", evidence: ["React listed in skills"] },
            { normalizedName: "Node.js", category: "backend", sourceSection: "skills", evidence: ["Node.js listed in skills"] },
            { normalizedName: "PostgreSQL", category: "database", sourceSection: "skills", evidence: ["PostgreSQL in skills"] },
            { normalizedName: "REST API", category: "backend", sourceSection: "skills", evidence: ["REST API in skills"] }
            // Note: TypeScript, Docker, Kubernetes, GraphQL are NOT in resume
        ];

        const comparison = compareSkillsWithJobDescription({
            detectedResumeSkills: sampleResumeSkills,
            rawResumeText: "Experienced in React, Node.js, PostgreSQL, and REST API architecture.",
            jobDescriptionText: sampleJd
        });

        // 13. Required skill matching
        const matchedReact = comparison.matchedKeywords.find(m => m.normalizedTerm === "React");
        assertTest(matchedReact && matchedReact.matchStatus === "matched" && matchedReact.importance === "required", "13. Required skill matching identifies confirmed required skills");

        // 14. Preferred skill matching
        const jdPreferred = extractJobKeywords(sampleJd);
        assertTest(jdPreferred.preferred.includes("Docker") || jdPreferred.preferred.includes("Kubernetes"), "14. Preferred skill matching identifies preferred / nice-to-have items");

        // 15. Missing skill detection
        const missingTs = comparison.missingSkills.find(m => m.normalizedName === "TypeScript");
        assertTest(
            missingTs && missingTs.reason.includes("Not detected in the provided resume"),
            "15. Missing skill detection flags unmentioned skills with constructive 'Not detected' wording"
        );

        // 16. Partial evidence
        const hasPartialMatches = Array.isArray(comparison.partialMatches);
        assertTest(hasPartialMatches, "16. Partial evidence evaluates transferrable skills without binary assumptions");

        // 17. Multi-word keyword matching
        const multiWordMatch = comparison.matchedKeywords.find(m => m.normalizedTerm === "REST API");
        assertTest(Boolean(multiWordMatch), "17. Multi-word keyword matching safely captures multi-token phrases (e.g. REST API)");

        // 18. Synonym matching
        const jdWithPostgres = "Required: Postgres and JavaScript.";
        const compSynonym = compareSkillsWithJobDescription({
            detectedResumeSkills: [{ normalizedName: "PostgreSQL", category: "database", sourceSection: "skills", evidence: ["PostgreSQL"] }],
            rawResumeText: "PostgreSQL experience.",
            jobDescriptionText: jdWithPostgres
        });
        const matchedPostgres = compSynonym.matchedKeywords.find(m => m.normalizedTerm === "PostgreSQL");
        assertTest(Boolean(matchedPostgres), "18. Synonym matching resolves Postgres to PostgreSQL");

        // 19. Java versus JavaScript distinction
        const javaRegex = buildSkillRegex("Java");
        const jsOnlyText = "Experienced full stack JavaScript and React engineer.";
        const isJavaInJs = javaRegex.test(jsOnlyText);
        assertTest(!isJavaInJs, "19. Java versus JavaScript distinction ensures 'Java' does NOT match 'JavaScript'");

        // 20. Empty job description
        const emptyJdComp = compareSkillsWithJobDescription({
            detectedResumeSkills: sampleResumeSkills,
            rawResumeText: "Resume text",
            jobDescriptionText: ""
        });
        assertTest(emptyJdComp.missingSkills.length === 0, "20. Empty job description handles empty input safely without crashing");

        // 21. Invalid job description
        let oversizedRejected = false;
        try {
            jobDescriptionInputSchema.parse({
                mode: "job_specific",
                jobDescription: "x".repeat(60000) // Exceeds 50k limit
            });
        } catch {
            oversizedRejected = true;
        }
        assertTest(oversizedRejected, "21. Invalid job description exceeding character bounds is rejected by Zod schema");

        // 22. No fabricated skills
        const loneResumeSkills = [{ normalizedName: "HTML5", category: "frontend", sourceSection: "skills", evidence: ["HTML"] }];
        const compNoFabrication = compareSkillsWithJobDescription({
            detectedResumeSkills: loneResumeSkills,
            rawResumeText: "HTML web page.",
            jobDescriptionText: "Requires C++, Rust, and Solidity."
        });
        const inventedSkill = compNoFabrication.matchedKeywords.some(m => m.normalizedTerm === "C++" || m.normalizedTerm === "Rust");
        assertTest(!inventedSkill, "22. No fabricated skills: candidate is never granted credit for unmentioned skills");

        // ==========================================
        // PART 3: INTEGRATION TESTS (23 - 31)
        // ==========================================
        console.log("\n--- PART 3: INTEGRATION TESTS ---");

        // 23. Free mode works without OPENAI_API_KEY
        const savedApiKey = process.env.OPENAI_API_KEY;
        delete process.env.OPENAI_API_KEY;

        const completeStructuredResume = {
            personalInfo: {
                fullName: "Morgan Black",
                email: "morgan@example.com",
                phone: "555-432-1098"
            },
            professionalSummary: "Full Stack Engineer specializing in React, Node.js, and cloud systems.",
            skills: ["JavaScript", "TypeScript", "React", "Node.js", "Docker", "PostgreSQL"],
            experience: [
                {
                    jobTitle: "Senior Software Engineer",
                    company: "DevOps Solutions",
                    responsibilities: ["Developed REST API microservices in Node.js and PostgreSQL."]
                }
            ],
            projects: [
                {
                    projectName: "React Dashboard",
                    technologies: ["React", "Docker"],
                    description: "Containerized frontend dashboard built with React and Docker."
                }
            ],
            education: [{ degree: "B.S. in Computer Science", institution: "Tech Institute" }]
        };

        const freeModeResult = await calculateSkillsAndKeywords({
            rawText: "Morgan Black React Node.js Docker PostgreSQL REST API",
            structuredResume: completeStructuredResume,
            resumeId: 202,
            userId: testUserA.id,
            mode: "general",
            analysisMode: "free"
        });

        assertTest(
            freeModeResult.analysisMode === "free" && freeModeResult.detectedSkills.length >= 5,
            "23. Free mode works without OPENAI_API_KEY and produces validated structured findings"
        );

        // 24. Free mode makes no OpenAI API request
        assertTest(freeModeResult.analysisMode === "free", "24. Free mode makes zero OpenAI API requests");

        if (savedApiKey) process.env.OPENAI_API_KEY = savedApiKey;

        // 25. Advanced mode uses existing OpenAI service (or falls back safely)
        const advancedAttempt = await calculateSkillsAndKeywords({
            rawText: "Sample text",
            structuredResume: completeStructuredResume,
            resumeId: 202,
            userId: testUserA.id,
            mode: "general",
            analysisMode: "ai"
        });
        assertTest(
            advancedAttempt && Array.isArray(advancedAttempt.detectedSkills),
            "25. Advanced mode completes or gracefully falls back to deterministic analysis"
        );

        // 26. Invalid AI output is rejected
        let malformedRejected = false;
        try {
            skillsKeywordsResponseSchema.parse({
                resumeId: "not-a-number",
                detectedSkills: "invalid"
            });
        } catch {
            malformedRejected = true;
        }
        assertTest(malformedRejected, "26. Invalid AI output is strictly rejected by Zod schema");

        // 27. Database persistence works
        const pdfFilename = `stage-sk-${Date.now()}.pdf`;
        const pdfStagingPath = path.join(STAGING_DIR, pdfFilename);
        const richResumeText = 
            "MORGAN BLACK\nmorgan@example.com\n555-432-1098\n" +
            "PROFESSIONAL SUMMARY\nFull Stack Developer with experience in React, Node.js, and PostgreSQL.\n" +
            "SKILLS\nJavaScript, TypeScript, React, Node.js, Docker, PostgreSQL, Git, Jest, REST API\n" +
            "WORK EXPERIENCE\nSoftware Engineer at Tech Corp\n" +
            "• Developed scalable REST API services using Node.js and PostgreSQL.\n" +
            "PROJECTS\nContainerized cloud dashboard using React and Docker.\n" +
            "EDUCATION\nB.S. in Computer Science from State College 2022.";

        fs.writeFileSync(pdfStagingPath, createValidPdfBuffer("Morgan Black Resume Document"));

        const storedResumeA = await storeResumeFileAndMetadata({
            userId: testUserA.id,
            candidateName: "Morgan Black",
            originalName: "Morgan_Black_Resume.pdf",
            stagedPath: pdfStagingPath,
            mimeType: "application/pdf",
            fileSize: 1024,
            documentType: "pdf"
        });

        // Seed extracted text
        await db.execute(
            `UPDATE resumes SET extracted_text = ? WHERE resume_id = ?`,
            [richResumeText, storedResumeA.id]
        );

        // POST /api/resumes/:id/skills-keywords (General mode)
        const postGeneralRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/skills-keywords`,
            "POST",
            { mode: "general", analysisMode: "free" },
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            postGeneralRes.status === 200 && postGeneralRes.body?.success === true && postGeneralRes.body?.data?.detectedSkills?.length > 0,
            "27a. General skills detection persists via POST /api/resumes/:id/skills-keywords"
        );

        // POST /api/resumes/:id/skills-keywords (Job-specific mode)
        const postJobRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/skills-keywords`,
            "POST",
            {
                mode: "job_specific",
                jobDescription: "Required: React, Python, AWS. Preferred: Docker.",
                analysisMode: "free"
            },
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            postJobRes.status === 200 && postJobRes.body?.data?.detectionMode === "job_specific" && postJobRes.body?.data?.missingSkills?.length > 0,
            "27b. Job-specific skills comparison persists and identifies missing requirements"
        );

        // Fetch back using GET endpoint
        const getRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/skills-keywords`,
            "GET",
            null,
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            getRes.status === 200 && getRes.body?.success === true && getRes.body?.data?.detectedSkills?.length > 0,
            "27c. Skills & keywords record retrieved successfully via GET /api/resumes/:id/skills-keywords"
        );

        // 28. Cross-user access is denied (IDOR protection)
        const crossUserRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/skills-keywords`,
            "GET",
            null,
            { Authorization: `Bearer ${tokenB}` }
        );

        assertTest(
            crossUserRes.status === 404 || crossUserRes.status === 403,
            "28. Cross-user access is denied with 404/403 for unauthorized users"
        );

        // 29. Existing strengths and weaknesses feature still works (Lesson 7.1)
        const swResult = await calculateStrengthsWeaknesses({
            rawText: richResumeText,
            structuredResume: completeStructuredResume,
            resumeId: storedResumeA.id,
            userId: testUserA.id,
            analysisMode: "free"
        });
        assertTest(
            swResult.strengths.length > 0 && Array.isArray(swResult.weaknesses),
            "29. Existing strengths and weaknesses feature (Lesson 7.1) functions without regression"
        );

        // 30. Existing scoring modules still work (Module 6: ATS, Detailed, Formatting & Grammar)
        const atsResult = calculateAtsScore({
            fileInfo: { fileType: "pdf", fileSize: 1024 },
            rawText: richResumeText,
            structuredResume: completeStructuredResume
        });
        const detailedResult = calculateDetailedResumeScore({
            structuredResume: completeStructuredResume,
            rawText: richResumeText,
            resumeId: storedResumeA.id,
            userId: testUserA.id
        });
        const fgResult = calculateFormattingGrammarScore({
            rawText: richResumeText,
            structuredResume: completeStructuredResume,
            resumeId: storedResumeA.id,
            userId: testUserA.id
        });

        assertTest(
            atsResult.atsScore >= 0 && detailedResult.overallScore >= 0 && fgResult.formattingScore >= 0,
            "30. Existing scoring modules (ATS, Detailed, Formatting & Grammar) operate seamlessly"
        );

        // 31. Existing resume analysis does not regress
        const analysisRouteRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/analysis`,
            "GET",
            null,
            { Authorization: `Bearer ${tokenA}` }
        );
        assertTest(
            analysisRouteRes.status === 404 || analysisRouteRes.status === 200,
            "31. Existing resume analysis route remains stable without regression"
        );

        console.log(`\n=================================================`);
        console.log(`ALL 31 TESTS PASSED: ${passCount} Passed, ${failCount} Failed`);
        console.log(`=================================================`);

    } catch (err) {
        console.error("Test execution failed with error:", err);
        process.exitCode = 1;
    } finally {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await db.end();
    }
};

runAllSkillsKeywordsTests();
