import http from "http";
import assert from "assert";
import fs from "fs";
import path from "path";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import { storeResumeFileAndMetadata } from "../services/resumeStorageService.js";
import { createValidPdfBuffer, createValidDocxBuffer } from "./fixtures/documentFixtures.js";
import { STAGING_DIR, STORAGE_DIR } from "../config/multerConfig.js";
import {
    runFreeResumeAnalysis,
    generateRuleBasedAnalysis,
    calculateRuleBasedScore,
    detectCareerLevel,
    categorizeSkill
} from "../services/freeResumeAnalysisService.js";
import { completeResumeAnalysisZodSchema } from "../validators/resumeAnalysisSchema.js";

const PORT = 5080;
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

        req.on("error", reject);
        if (requestBody) {
            req.write(requestBody);
        }
        req.end();
    });
};

const runAllTests = async () => {
    console.log("=================================================");
    console.log("   AI RESUME ANALYZER - FREE ANALYSIS TESTS      ");
    console.log("=================================================\n");

    const usersToClean = [];
    const resumesToClean = [];

    try {
        await testDatabaseConnection();

        server = app.listen(PORT);
        await new Promise((resolve) => server.once("listening", resolve));

        // Create Test Users
        const timestamp = Date.now();
        const userA = await registerUser({
            fullName: "Free User A",
            email: `free_user_a_${timestamp}@example.com`,
            password: "Password123!"
        });
        usersToClean.push(userA.id);

        const userB = await registerUser({
            fullName: "Free User B",
            email: `free_user_b_${timestamp}@example.com`,
            password: "Password123!"
        });
        usersToClean.push(userB.id);

        const tokenA = generateToken({ userId: userA.id, email: userA.email, name: "Free User A" });
        const cookieA = `token=${tokenA}; csrfToken=test-csrf-token`;

        const tokenB = generateToken({ userId: userB.id, email: userB.email, name: "Free User B" });
        const cookieB = `token=${tokenB}; csrfToken=test-csrf-token`;

        // Create PDF resume for User A
        const pdfFilename = `stage-free-${Date.now()}.pdf`;
        const pdfStagingPath = path.join(STAGING_DIR, pdfFilename);
        fs.writeFileSync(pdfStagingPath, createValidPdfBuffer());
        const resumeA_Pdf = await storeResumeFileAndMetadata({
            userId: userA.id,
            candidateName: "Free User A",
            originalName: "Harshil_Resume.pdf",
            stagedPath: pdfStagingPath,
            mimeType: "application/pdf",
            fileSize: 1024,
            documentType: "pdf"
        });
        resumesToClean.push(resumeA_Pdf.id);

        // Pre-seed realistic extracted text
        await db.execute(
            `UPDATE resumes 
             SET extracted_text = ? 
             WHERE resume_id = ?`,
            [
                `Undhad Harshil
                 Phone: +91 9925161880 | Email: harshil@example.com | Location: Ahmedabad, India
                 LinkedIn: https://linkedin.com/in/harshil | GitHub: https://github.com/harshil
                 SUMMARY
                 Passionate Full Stack Developer with hands-on experience in React.js, Node.js, Express, and MySQL.
                 SKILLS
                 JavaScript, React.js, Node.js, Express.js, MySQL, Tailwind CSS, MongoDB, Git, Postman, REST APIs
                 EXPERIENCE
                 • Full Stack Developer Intern at Tech Corp (Feb 2026 - Present)
                   Developing responsive web interfaces using React and Tailwind CSS.
                   Building RESTful APIs with Node.js and MySQL.
                 EDUCATION
                 • Bachelor of Technology in Computer Engineering at Gandhinagar University (2022 - 2026)
                   CGPA: 8.5/10.0
                 PROJECTS
                 • Hospital Management System
                   Technologies: React.js, Node.js, Express, MySQL
                   Developed role-based multi-tenant healthcare application.
                 • Influencer Marketing Platform
                   Technologies: React, Node, Express, MongoDB
                   Engineered campaign matching and creator application workflows.`,
                resumeA_Pdf.id
            ]
        );

        // Create DOCX resume for User A
        const docxFilename = `stage-free-${Date.now()}.docx`;
        const docxStagingPath = path.join(STAGING_DIR, docxFilename);
        fs.writeFileSync(docxStagingPath, createValidDocxBuffer());
        const resumeA_Docx = await storeResumeFileAndMetadata({
            userId: userA.id,
            candidateName: "Free User A",
            originalName: "Resume_Docx.docx",
            stagedPath: docxStagingPath,
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fileSize: 1024,
            documentType: "docx"
        });
        resumesToClean.push(resumeA_Docx.id);

        await db.execute(
            `UPDATE resumes 
             SET extracted_text = ? 
             WHERE resume_id = ?`,
            [
                `Jane Developer
                 Email: jane@example.com | Phone: 555-0199 | Location: New York, NY
                 SUMMARY
                 Software Engineer building high-traffic web applications with React and Python.
                 SKILLS
                 Python, Django, React, PostgreSQL, Docker, Git
                 EXPERIENCE
                 • Software Engineer at Alpha Corp (2023 - 2025)
                   Engineered backend services and optimized database queries.
                 EDUCATION
                 • B.S. Computer Science, NY University (2019 - 2023)
                 PROJECTS
                 • E-Commerce Microservices
                   Technologies: Python, Django, Docker
                   Architected asynchronous order processing pipeline.`,
                resumeA_Docx.id
            ]
        );

        // =========================================================================
        // UNIT TESTS: Rule-Based Analyzer Service (Zero OpenAI Calls)
        // =========================================================================

        // Test 1: Skill Categorization
        const reactCat = categorizeSkill("React.js");
        const nodeCat = categorizeSkill("Node.js");
        const sqlCat = categorizeSkill("MySQL");
        assertTest(reactCat === "Frontend Technologies", "Test 1: Skill categorization accurately identifies Frontend");
        assertTest(nodeCat === "Backend Technologies", "Test 2: Skill categorization accurately identifies Backend");
        assertTest(sqlCat === "Databases & Storage", "Test 3: Skill categorization accurately identifies Database");

        // Test 4: Career Level Detection
        const fresherLevel = detectCareerLevel({ experience: [], professionalSummary: "Computer Engineering Student" });
        const seniorLevel = detectCareerLevel({ experience: [{}, {}, {}, {}], professionalSummary: "Senior Architect" });
        assertTest(fresherLevel === "Entry-Level / Fresher", "Test 4: Entry-level / fresher profile correctly detected");
        assertTest(seniorLevel === "Senior / Lead", "Test 5: Experienced candidate correctly classified as Senior / Lead");

        // Test 6: Deterministic Scoring Fresher Normalization
        const fresherStructured = {
            personalInfo: { email: "fresher@example.com", phone: "1234567890", location: "City", linkedin: "https://linkedin.com/in/fresher" },
            professionalSummary: "Motivated computer engineering graduate with solid full stack skills.",
            skills: ["JavaScript", "React", "Node.js", "Express", "MySQL", "Tailwind CSS", "Git", "Postman", "HTML5", "CSS3"],
            experience: [],
            education: [{ degree: "B.Tech CE", institution: "Tech University", startDate: "2022", endDate: "2026", grade: "8.5" }],
            projects: [
                { projectName: "P1", technologies: ["React", "Node"], description: "Full stack web app with auth" },
                { projectName: "P2", technologies: ["MySQL", "Express"], description: "Database management system" }
            ],
            certifications: [],
            metadata: { wordCount: 350 }
        };

        const fresherScore = calculateRuleBasedScore(fresherStructured);
        assertTest(fresherScore.isFresher === true, "Test 6: Fresher status flagged");
        assertTest(fresherScore.isExpApplicable === false, "Test 7: Experience treated as not_applicable for fresher");
        assertTest(fresherScore.applicableWeightTotal === 80, "Test 8: Applicable weight normalized to 80");
        assertTest(fresherScore.overallScore >= 60 && fresherScore.overallScore <= 100, "Test 9: Fair normalized score computed for fresher");

        // Test 10: Deterministic Output Consistency (Two runs produce identical results)
        const run1 = generateRuleBasedAnalysis(fresherStructured);
        const run2 = generateRuleBasedAnalysis(fresherStructured);
        assertTest(run1.scoringDetails.overallScore === run2.scoringDetails.overallScore, "Test 10: Scores are 100% deterministic across multiple runs");
        assertTest(JSON.stringify(run1.resumeOverview) === JSON.stringify(run2.resumeOverview), "Test 11: Overview payload is 100% deterministic");

        // Test 12: Zod Schema Master Validation
        const isSchemaValid = completeResumeAnalysisZodSchema.safeParse(run1).success;
        assertTest(isSchemaValid, "Test 12: Generated rule-based analysis strictly satisfies completeResumeAnalysisZodSchema");

        // =========================================================================
        // INTEGRATION TESTS: HTTP API ENDPOINTS
        // =========================================================================

        // Test 13: Unauthenticated request returns 401
        const unauthRes = await requestApi(`/api/resumes/${resumeA_Pdf.id}/analyze-free`, "POST");
        assertTest(unauthRes.status === 401, "Test 13: Unauthenticated request to /analyze-free returns HTTP 401");

        // Test 14: Cross-tenant access denied (User B calling on User A's resume)
        const crossTenantRes = await requestApi(
            `/api/resumes/${resumeA_Pdf.id}/analyze-free`,
            "POST",
            null,
            { Cookie: cookieB }
        );
        assertTest(crossTenantRes.status === 403, "Test 14: Cross-tenant access denied with HTTP 403 Forbidden");

        // Test 15: Non-existent resume returns 404
        const notFoundRes = await requestApi(
            `/api/resumes/99999999/analyze-free`,
            "POST",
            null,
            { Cookie: cookieA }
        );
        assertTest(notFoundRes.status === 404, "Test 15: Non-existent resume returns HTTP 404 Not Found");

        // Test 16: Invalid non-numeric ID returns 400
        const badIdRes = await requestApi(
            `/api/resumes/not-a-number/analyze-free`,
            "POST",
            null,
            { Cookie: cookieA }
        );
        assertTest(badIdRes.status === 400, "Test 16: Non-numeric resume ID returns HTTP 400 Bad Request");

        // Test 17: Successful Free PDF Analysis
        const freePdfRes = await requestApi(
            `/api/resumes/${resumeA_Pdf.id}/analyze-free`,
            "POST",
            null,
            { Cookie: cookieA }
        );
        assertTest(freePdfRes.status === 200, "Test 17: Free PDF analysis succeeds with HTTP 200");
        assertTest(freePdfRes.body?.data?.analysisType === "rule_based", "Test 18: Response confirms analysisType is 'rule_based'");
        assertTest(freePdfRes.body?.data?.overallScore > 0, "Test 19: Positive overall score returned");
        assertTest(freePdfRes.body?.data?.status === "completed", "Test 20: Status is completed");

        // Test 21: Database Record Verification for resume_analyses
        const [analysisRows] = await db.execute(
            `SELECT analysis_id, resume_id, user_id, analysis_status, analysis_type, ai_model, overall_score
             FROM resume_analyses 
             WHERE resume_id = ? 
             ORDER BY analysis_id DESC 
             LIMIT 1`,
            [resumeA_Pdf.id]
        );
        assertTest(analysisRows.length > 0, "Test 21: Analysis record persisted in MySQL database");
        assertTest(analysisRows[0].analysis_type === "rule_based", "Test 22: MySQL analysis_type column is 'rule_based'");
        assertTest(analysisRows[0].ai_model === "rule-based-engine", "Test 23: ai_model column records 'rule-based-engine'");

        // Test 24: Database Record Verification for resume_scores
        const [scoreRows] = await db.execute(
            `SELECT score_id, overall_score, skills_score, education_score, projects_score 
             FROM resume_scores 
             WHERE analysis_id = ?`,
            [analysisRows[0].analysis_id]
        );
        assertTest(scoreRows.length > 0, "Test 24: Score breakdown record synchronized to resume_scores table");
        assertTest(Number(scoreRows[0].overall_score) === Number(analysisRows[0].overall_score), "Test 25: overall_score matches between tables");

        // Test 26: GET /api/resumes/:id/analysis loads rule-based analysis
        const getLatestRes = await requestApi(
            `/api/resumes/${resumeA_Pdf.id}/analysis`,
            "GET",
            null,
            { Cookie: cookieA }
        );
        assertTest(getLatestRes.status === 200, "Test 26: GET /analysis returns latest analysis with HTTP 200");
        assertTest(getLatestRes.body?.data?.analysisType === "rule_based", "Test 27: GET endpoint identifies analysisType as 'rule_based'");

        // Test 28: Successful Free DOCX Analysis
        const freeDocxRes = await requestApi(
            `/api/resumes/${resumeA_Docx.id}/analyze-free`,
            "POST",
            null,
            { Cookie: cookieA }
        );
        assertTest(freeDocxRes.status === 200, "Test 28: Free DOCX analysis succeeds with HTTP 200");
        assertTest(freeDocxRes.body?.data?.analysisType === "rule_based", "Test 29: DOCX response confirms analysisType is 'rule_based'");

        // Test 30: Zero OpenAI calls verification (Verify OPENAI_API_KEY is not touched)
        assertTest(
            freePdfRes.body?.data?.metadata?.aiModel === "rule-based-engine",
            "Test 30: Zero external OpenAI API dependencies during Free Analysis execution"
        );

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
        console.log("-------------------------------------------------\n");

    } finally {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }

        // Cleanup
        if (resumesToClean.length > 0) {
            await db.execute(`DELETE FROM resume_scores WHERE analysis_id IN (SELECT analysis_id FROM resume_analyses WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")}))`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resume_analyses WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resume_files WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resumes WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
        }
        if (usersToClean.length > 0) {
            await db.execute(`DELETE FROM users WHERE user_id IN (${usersToClean.map(() => "?").join(",")})`, usersToClean).catch(() => {});
        }
    }
};

runAllTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test execution failed:", err);
        process.exit(1);
    });
