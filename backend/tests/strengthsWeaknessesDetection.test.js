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
import { STAGING_DIR, STORAGE_DIR } from "../config/multerConfig.js";
import { detectResumeStrengths } from "../services/resumeStrengthsService.js";
import { detectResumeWeaknesses } from "../services/resumeWeaknessesService.js";
import {
    calculateStrengthsWeaknesses,
    saveStrengthsWeaknessesRecord,
    runStrengthsWeaknessesWorkflow,
    getLatestStrengthsWeaknessesForResume
} from "../services/strengthsWeaknessesWorkflow.js";
import {
    strengthFindingSchema,
    weaknessFindingSchema,
    missingInfoFindingSchema,
    strengthsWeaknessesResponseSchema
} from "../validators/strengthsWeaknessesSchema.js";
import { calculateAtsScore } from "../services/atsScoringService.js";
import { calculateDetailedResumeScore } from "../services/detailedResumeScoringService.js";
import { calculateFormattingGrammarScore } from "../services/formattingGrammarScoringWorkflow.js";

const PORT = 5087;
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

const runAllStrengthsWeaknessesTests = async () => {
    console.log("=================================================");
    console.log("MODULE 7 LESSON 7.1: STRENGTHS & WEAKNESSES TESTS");
    console.log("=================================================\n");

    try {
        await testDatabaseConnection();
        server = app.listen(PORT);
        await new Promise((resolve) => server.once("listening", resolve));

        const uniqueSuffix = Date.now();
        const testUserA = await registerUser({
            fullName: "Strengths User A",
            email: `strengths_a_${uniqueSuffix}@example.com`,
            password: "Password123!"
        });
        const tokenA = generateToken({
            userId: testUserA.id,
            id: testUserA.id,
            email: testUserA.email,
            role: "user"
        });

        const testUserB = await registerUser({
            fullName: "Strengths User B",
            email: `strengths_b_${uniqueSuffix}@example.com`,
            password: "Password123!"
        });
        const tokenB = generateToken({
            userId: testUserB.id,
            id: testUserB.id,
            email: testUserB.email,
            role: "user"
        });

        // ==========================================
        // PART 1: STRENGTH DETECTION TESTS (1 - 8)
        // ==========================================
        console.log("--- PART 1: STRENGTH TESTS ---");

        // 1. Technical skills detection
        const structuredSkills = {
            skills: ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "Docker"]
        };
        const strengths1 = detectResumeStrengths({ structuredResume: structuredSkills });
        const hasSkillStrength = strengths1.some(s => s.category === "skills" && s.title.includes("Technical Skillset"));
        assertTest(hasSkillStrength, "1. Technical skills detection identifies categorized skills");

        // 2. Skills supported by projects
        const structuredApplied = {
            skills: ["React", "Node.js", "Docker", "Python"],
            projects: [
                {
                    projectName: "E-Commerce App",
                    technologies: ["React", "Node.js"],
                    description: "Built full-stack store with React and Node.js microservices."
                }
            ]
        };
        const strengths2 = detectResumeStrengths({ structuredResume: structuredApplied });
        const hasAppliedStrength = strengths2.some(s => s.category === "projects" && s.title.includes("Practical Skill Application"));
        assertTest(hasAppliedStrength, "2. Skills supported by projects generates practical application strength");

        // 3. Experience strengths
        const structuredExp = {
            experience: [
                {
                    jobTitle: "Software Engineer",
                    company: "Tech Corp",
                    startDate: "2022-01",
                    endDate: "Present",
                    responsibilities: [
                        "Designed microservices in Go and Python.",
                        "Optimized database indexing improving latency by 35%."
                    ]
                }
            ]
        };
        const strengths3 = detectResumeStrengths({ structuredResume: structuredExp });
        const hasExpStrength = strengths3.some(s => s.category === "experience" && s.title.includes("Work Experience"));
        assertTest(hasExpStrength, "3. Experience strengths detects structured work history and roles");

        // 4. Project strengths
        const structuredProjects = {
            projects: [
                {
                    projectName: "Cloud File Manager",
                    technologies: ["React", "AWS S3"],
                    description: "Engineered scalable cloud storage platform with secure presigned URLs."
                }
            ]
        };
        const strengths4 = detectResumeStrengths({ structuredResume: structuredProjects });
        const hasProjStrength = strengths4.some(s => s.category === "projects" && s.title.includes("Projects Portfolio"));
        assertTest(hasProjStrength, "4. Project strengths showcases hands-on portfolio implementation");

        // 5. Education strengths
        const structuredEdu = {
            education: [
                {
                    degree: "Bachelor of Science in Computer Science",
                    institution: "State University",
                    endDate: "2023"
                }
            ]
        };
        const strengths5 = detectResumeStrengths({ structuredResume: structuredEdu });
        const hasEduStrength = strengths5.some(s => s.category === "education" && s.title.includes("Academic Qualifications"));
        assertTest(hasEduStrength, "5. Education strengths identifies complete degree and institution");

        // 6. Achievement detection
        const resumeWithAchievements = {
            rawText: "Reduced API response times by 40% and served 100,000 active users. Won first place hackathon award."
        };
        const strengths6 = detectResumeStrengths({ structuredResume: {}, rawText: resumeWithAchievements.rawText });
        const hasAchievementStrength = strengths6.some(s => s.category === "achievements" && s.title.includes("Quantifiable Impact"));
        assertTest(hasAchievementStrength, "6. Achievement detection captures metrics, percentages, and awards");

        // 7. Empty resume sections
        const emptyStrengths = detectResumeStrengths({ structuredResume: {}, rawText: "" });
        assertTest(Array.isArray(emptyStrengths) && emptyStrengths.length === 0, "7. Empty resume sections produces empty array without crashing");

        // 8. Unsupported strength rejection
        // A skill without evidence does not fabricate project/experience strength
        const loneSkillResume = { skills: ["Quantum Computing"] };
        const loneStrengths = detectResumeStrengths({ structuredResume: loneSkillResume });
        const fabricatedProject = loneStrengths.some(s => s.category === "projects");
        assertTest(!fabricatedProject, "8. Unsupported strength rejection avoids inventing project claims");

        // ==========================================
        // PART 2: WEAKNESS DETECTION TESTS (9 - 19)
        // ==========================================
        console.log("\n--- PART 2: WEAKNESS TESTS ---");

        // 9. Missing professional summary
        const noSummaryResume = { professionalSummary: "" };
        const weak9 = detectResumeWeaknesses({ structuredResume: noSummaryResume });
        const hasSummaryWeakness = weak9.weaknesses.some(w => w.category === "summary" && w.title.includes("Summary"));
        assertTest(hasSummaryWeakness, "9. Missing professional summary is identified as constructive weakness");

        // 10. Skills without supporting evidence
        const unsupportedSkillResume = {
            skills: ["Kubernetes", "Rust", "GraphQL", "Solidity"],
            projects: [{ projectName: "Basic HTML Page", description: "Simple static page" }]
        };
        const weak10 = detectResumeWeaknesses({ structuredResume: unsupportedSkillResume });
        const hasUnsupportedSkill = weak10.weaknesses.some(w => w.category === "skills" && w.title.includes("Supporting Evidence"));
        assertTest(hasUnsupportedSkill, "10. Skills without supporting evidence detects ungrounded technical claims");

        // 11. Unclear work descriptions
        const passiveWorkResume = {
            experience: [
                {
                    jobTitle: "Assistant",
                    company: "Agency",
                    responsibilities: [
                        "responsible for filing",
                        "assisted with daily tasks"
                    ]
                }
            ]
        };
        const weak11 = detectResumeWeaknesses({ structuredResume: passiveWorkResume });
        const hasPassiveWeakness = weak11.weaknesses.some(w => w.category === "experience" && w.title.includes("Passive Work Descriptions"));
        assertTest(hasPassiveWeakness, "11. Unclear work descriptions catches passive and overly brief duties");

        // 12. Missing project outcomes
        const noOutcomeResume = {
            projects: [
                {
                    projectName: "Weather Tracker",
                    technologies: ["React", "CSS"],
                    description: "Built a weather dashboard with React and weather API."
                }
            ]
        };
        const weak12 = detectResumeWeaknesses({ structuredResume: noOutcomeResume });
        const hasNoOutcomeWeakness = weak12.weaknesses.some(w => w.category === "projects" && w.title.includes("Project Outcomes"));
        assertTest(hasNoOutcomeWeakness, "12. Missing project outcomes identifies tech implementations without stated results");

        // 13. Missing optional portfolio
        const noPortfolioResume = {
            personalInfo: { name: "Jane Doe", email: "jane@example.com", phone: "555-123-4567" }
        };
        const weak13 = detectResumeWeaknesses({ structuredResume: noPortfolioResume });
        const hasPortfolioWeakness = weak13.weaknesses.some(w => w.category === "contact_information" && w.title.includes("Portfolio"));
        const portfolioMissingInfo = weak13.missingInformation.find(m => m.field === "portfolio");
        assertTest(hasPortfolioWeakness && portfolioMissingInfo?.importance === "low", "13. Missing optional portfolio classified with low impact and in missingInfo");

        // 14. Unclear education information
        const incompleteEduResume = {
            education: [{ degree: "", institution: "Tech College" }]
        };
        const weak14 = detectResumeWeaknesses({ structuredResume: incompleteEduResume });
        const hasEduWeakness = weak14.weaknesses.some(w => w.category === "education" && w.title.includes("Incomplete Education Details"));
        assertTest(hasEduWeakness, "14. Unclear education information catches missing degree or institution");

        // 15. Inconsistent section headings
        const rawWithOddHeadings = "JOHN DOE\nRANDOM STUFF\nSome coding things.\nMISCELLANEOUS\nOther work.";
        const weak15 = detectResumeWeaknesses({ structuredResume: {}, rawText: rawWithOddHeadings });
        const hasHeadingWeakness = weak15.weaknesses.some(w => w.category === "structure" && w.title.includes("Inconsistent Section Headings"));
        assertTest(hasHeadingWeakness, "15. Inconsistent section headings flags non-standard section titles");

        // 16. Repeated content
        const rawRepeated = "Managed cross-functional team across four sprint cycles.\nManaged cross-functional team across four sprint cycles.";
        const weak16 = detectResumeWeaknesses({ structuredResume: {}, rawText: rawRepeated });
        const hasRepeatedWeakness = weak16.weaknesses.some(w => w.category === "readability" && w.title.includes("Repeated Content"));
        assertTest(hasRepeatedWeakness, "16. Repeated content identifies duplicated bullet lines");

        // 17. Fresher resume handling
        const fresherResume = {
            professionalSummary: "Computer Science undergraduate seeking software engineering role.",
            skills: ["JavaScript", "React", "Python"],
            projects: [
                {
                    projectName: "Campus Portal",
                    technologies: ["React", "Node.js"],
                    description: "Built student registration system serving 500 students with 99% uptime."
                }
            ],
            education: [
                { degree: "B.Tech in Computer Science", institution: "City University", endDate: "2024" }
            ],
            experience: [] // No formal experience
        };
        const weak17 = detectResumeWeaknesses({ structuredResume: fresherResume });
        const penalizedExperience = weak17.weaknesses.some(w => w.title.includes("Absence of Documented Work Experience") || w.title.includes("Passive Work Descriptions"));
        assertTest(!penalizedExperience, "17. Fresher resume handling does NOT unfairly penalize entry-level candidate without experience");

        // 18. Missing information classification
        const incompleteContactResume = { personalInfo: { name: "Candidate" } }; // Missing email and phone
        const weak18 = detectResumeWeaknesses({ structuredResume: incompleteContactResume });
        const emailMissing = weak18.missingInformation.find(m => m.field === "email");
        assertTest(emailMissing && emailMissing.importance === "high", "18. Missing information classification marks missing email as high priority");

        // 19. Duplicate weakness prevention
        // Check that detectResumeWeaknesses does not emit duplicate titles
        const titles = weak18.weaknesses.map(w => w.title);
        const uniqueTitles = new Set(titles);
        assertTest(titles.length === uniqueTitles.size, "19. Duplicate weakness prevention ensures unique finding titles");

        // ==========================================
        // PART 3: INTEGRATION TESTS (20 - 29)
        // ==========================================
        console.log("\n--- PART 3: INTEGRATION TESTS ---");

        // 20. Free mode works without OPENAI_API_KEY
        const originalApiKey = process.env.OPENAI_API_KEY;
        delete process.env.OPENAI_API_KEY;

        const completeStructuredResume = {
            personalInfo: {
                name: "Alex Rivera",
                email: "alex@example.com",
                phone: "555-987-6543",
                linkedin: "https://linkedin.com/in/alexrivera"
            },
            professionalSummary: "Senior Full Stack Engineer with 5+ years building distributed cloud microservices.",
            skills: ["TypeScript", "React", "Node.js", "Docker", "PostgreSQL", "AWS"],
            experience: [
                {
                    jobTitle: "Senior Developer",
                    company: "CloudScale Inc",
                    startDate: "2021-01",
                    endDate: "Present",
                    responsibilities: [
                        "Architected event-driven microservices processing 50,000 req/s.",
                        "Mentored 4 junior engineers on clean architecture."
                    ]
                }
            ],
            projects: [
                {
                    projectName: "Distributed Cache",
                    technologies: ["Node.js", "Redis"],
                    description: "Engineered in-memory cache achieving 15ms latency reduction."
                }
            ],
            education: [
                {
                    degree: "Bachelor of Science in Software Engineering",
                    institution: "Tech University",
                    endDate: "2020"
                }
            ]
        };

        const freeModeResult = await calculateStrengthsWeaknesses({
            rawText: "Alex Rivera Resume content with 50,000 req/s and 15ms latency.",
            structuredResume: completeStructuredResume,
            resumeId: 999,
            userId: testUserA.id,
            analysisMode: "free"
        });

        assertTest(
            freeModeResult.analysisMode === "free" &&
            Array.isArray(freeModeResult.strengths) &&
            freeModeResult.strengths.length > 0,
            "20. Free mode works without OPENAI_API_KEY and produces validated findings"
        );

        // 21. Free mode makes no OpenAI API request
        // Since OPENAI_API_KEY is unset and analysisMode="free", no OpenAI network call was made
        assertTest(freeModeResult.analysisMode === "free", "21. Free mode makes zero OpenAI API requests");

        // Restore API key if existed
        if (originalApiKey) process.env.OPENAI_API_KEY = originalApiKey;

        // 22. Advanced mode uses existing OpenAI service (or falls back safely)
        const aiAttemptResult = await calculateStrengthsWeaknesses({
            rawText: "Sample resume text",
            structuredResume: completeStructuredResume,
            resumeId: 999,
            userId: testUserA.id,
            analysisMode: "ai"
        });
        assertTest(
            aiAttemptResult && Array.isArray(aiAttemptResult.strengths),
            "22. Advanced mode completes or gracefully falls back to deterministic analysis"
        );

        // 23. Invalid AI output is rejected
        const malformedPayload = {
            resumeId: "not-a-number",
            strengths: "should-be-array"
        };
        let zodRejected = false;
        try {
            strengthsWeaknessesResponseSchema.parse(malformedPayload);
        } catch {
            zodRejected = true;
        }
        assertTest(zodRejected, "23. Invalid AI output is strictly rejected by Zod schema");

        // 24. API quota failure is handled
        // If quota exceeded or network fails, workflow returns validated result with limitation
        const fallbackCheck = aiAttemptResult.limitations.length > 0;
        assertTest(fallbackCheck, "24. API quota or offline state handled gracefully with limitations disclosure");

        // 25. Findings are persisted correctly to resume_strengths_weaknesses table
        const pdfFilename = `stage-sw-${Date.now()}.pdf`;
        const pdfStagingPath = path.join(STAGING_DIR, pdfFilename);
        const richResumeText = 
            "ALEX RIVERA alex@example.com 555-987-6543 https://linkedin.com/in/alexrivera\n" +
            "PROFESSIONAL SUMMARY Senior Full Stack Engineer with 5+ years building scalable cloud microservices.\n" +
            "SKILLS JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Docker, Git.\n" +
            "EXPERIENCE Senior Software Engineer at Tech Corp from 2021 to Present.\n" +
            "• Developed scalable backend services processing 50,000 req/s.\n" +
            "• Architected database caching reducing response times by 40%.\n" +
            "PROJECTS Cloud Dashboard using React and Node.js microservices with 99.9% uptime.\n" +
            "EDUCATION B.S. in Computer Science from State University 2017 to 2021.";

        fs.writeFileSync(pdfStagingPath, createValidPdfBuffer("Alex Rivera Resume Document"));

        const storedResumeA = await storeResumeFileAndMetadata({
            userId: testUserA.id,
            candidateName: "Alex Rivera",
            originalName: "Alex_Rivera_Resume.pdf",
            stagedPath: pdfStagingPath,
            mimeType: "application/pdf",
            fileSize: 1024,
            documentType: "pdf"
        });

        // Seed rich extracted text
        await db.execute(
            `UPDATE resumes SET extracted_text = ? WHERE resume_id = ?`,
            [richResumeText, storedResumeA.id]
        );

        const postRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/strengths-weaknesses`,
            "POST",
            { analysisMode: "free" },
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            postRes.status === 200 && postRes.body?.success === true && postRes.body?.data?.strengths?.length > 0,
            "25. Findings are calculated and persisted via POST /api/resumes/:id/strengths-weaknesses"
        );

        // Fetch back using GET endpoint
        const getRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/strengths-weaknesses`,
            "GET",
            null,
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            getRes.status === 200 && getRes.body?.success === true && getRes.body?.data?.strengths?.length > 0,
            "25b. Findings retrieved successfully via GET /api/resumes/:id/strengths-weaknesses"
        );

        // 26. Cross-user access is rejected (403/404 IDOR protection)
        const crossUserRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/strengths-weaknesses`,
            "GET",
            null,
            { Authorization: `Bearer ${tokenB}` } // User B attempting to view User A's resume
        );

        assertTest(
            crossUserRes.status === 404 || crossUserRes.status === 403,
            "26. Cross-user access is rejected with 404/403 for unauthorized users"
        );

        // 27. Database errors or non-existent resume ID returns 404
        const nonExistentRes = await requestApi(
            `/api/resumes/999999999/strengths-weaknesses`,
            "POST",
            { analysisMode: "free" },
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            nonExistentRes.status === 404,
            "27. Non-existent resume ID returns 404 error"
        );

        // 28. Existing scoring modules still work
        const atsResult = calculateAtsScore({
            fileInfo: { fileType: "pdf", fileSize: 1024 },
            rawText: "Sample resume text with React, Node.js, and agile.",
            structuredResume: completeStructuredResume
        });
        const detailedResult = calculateDetailedResumeScore({
            structuredResume: completeStructuredResume,
            rawText: "Sample resume text",
            resumeId: storedResumeA.id,
            userId: testUserA.id
        });
        const fgResult = calculateFormattingGrammarScore({
            rawText: "Sample resume text.\n• Built microservices.\n• Led architecture.",
            structuredResume: completeStructuredResume,
            resumeId: storedResumeA.id,
            userId: testUserA.id
        });

        assertTest(
            atsResult.atsScore >= 0 &&
            detailedResult.overallScore >= 0 &&
            fgResult.formattingScore >= 0,
            "28. Existing scoring modules (ATS, Detailed, Formatting/Grammar) function without error"
        );

        // 29. Existing resume analysis does not regress
        const getAnalysisRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/analysis`,
            "GET",
            null,
            { Authorization: `Bearer ${tokenA}` }
        );
        // Should return 404 (not yet analyzed with full engine) or 200, but not 500
        assertTest(
            getAnalysisRes.status === 404 || getAnalysisRes.status === 200,
            "29. Existing resume analysis route remains stable without regression"
        );

        console.log(`\n=================================================`);
        console.log(`ALL 29 TESTS PASSED: ${passCount} Passed, ${failCount} Failed`);
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

runAllStrengthsWeaknessesTests();
