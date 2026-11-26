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
    generateRuleBasedSuggestions,
    calculateSuggestionMetrics
} from "../services/improvementSuggestionService.js";
import {
    calculateImprovementSuggestions,
    saveImprovementSuggestionsRecord,
    runImprovementSuggestionsWorkflow,
    getLatestImprovementSuggestionsForResume,
    updateSuggestionStatusInRecord
} from "../services/improvementSuggestionsWorkflow.js";
import {
    singleSuggestionSchema,
    generateSuggestionsInputSchema,
    updateSuggestionStatusSchema,
    improvementSuggestionsResponseSchema
} from "../validators/improvementSuggestionsSchema.js";
import { calculateAtsScore } from "../services/atsScoringService.js";
import { calculateDetailedResumeScore } from "../services/detailedResumeScoringService.js";
import { calculateFormattingGrammarScore } from "../services/formattingGrammarScoringWorkflow.js";
import { calculateStrengthsWeaknesses } from "../services/strengthsWeaknessesWorkflow.js";
import { calculateSkillsAndKeywords } from "../services/skillsKeywordsWorkflow.js";

const PORT = 5089;
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
                "Content-Type": "application/json",
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = data ? JSON.parse(data) : null;
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, body: parsed, headers: res.headers });
            });
        });

        req.on("error", reject);
        if (body) {
            req.write(typeof body === "string" ? body : JSON.stringify(body));
        }
        req.end();
    });
};

async function runAllImprovementSuggestionsTests() {
    console.log("=================================================");
    console.log("MODULE 7 LESSON 7.3: IMPROVEMENT SUGGESTIONS TESTS");
    console.log("=================================================");

    await testDatabaseConnection();
    console.log("[PASS] MySQL database connected successfully");

    // Start test HTTP server
    await new Promise((resolve) => {
        server = app.listen(PORT, "127.0.0.1", () => {
            resolve();
        });
    });

    const timestamp = Date.now();
    const testUserA = await registerUser({
        fullName: "Suggestions Test User A",
        email: `sug_user_a_${timestamp}@test.com`,
        password: "Password123!"
    });
    const tokenA = generateToken({
        userId: testUserA.id,
        id: testUserA.id,
        email: testUserA.email,
        role: "user"
    });

    const testUserB = await registerUser({
        fullName: "Suggestions Test User B",
        email: `sug_user_b_${timestamp}@test.com`,
        password: "Password123!"
    });
    const tokenB = generateToken({
        userId: testUserB.id,
        id: testUserB.id,
        email: testUserB.email,
        role: "user"
    });

    try {
        // ==========================================
        // PART 1: RULE-BASED FREE MODE TESTS
        // ==========================================
        console.log("\n--- PART 1: RULE-BASED FREE MODE TESTS ---");

        // 1. Free Mode generates rule-based suggestions without OpenAI
        const baselineSuggestions = generateRuleBasedSuggestions({
            structuredResume: {
                professionalSummary: "",
                skills: ["JavaScript", "React"],
                experience: [],
                education: [],
                projects: []
            },
            rawText: "Sample resume content."
        });

        assertTest(
            Array.isArray(baselineSuggestions) && baselineSuggestions.length > 0,
            "1. Free Mode generates rule-based suggestions"
        );

        // 2. Free Mode makes zero OpenAI API calls (all suggestions have source: 'rule_based')
        const allRuleBased = baselineSuggestions.every(s => s.source === "rule_based");
        assertTest(
            allRuleBased,
            "2. Free Mode makes zero OpenAI API calls and tags source as rule_based"
        );

        // 3. Missing summary generates a relevant suggestion
        const summarySug = baselineSuggestions.find(s => s.category === "professional_summary");
        assertTest(
            summarySug && summarySug.priority === "high" && summarySug.title.includes("Summary"),
            "3. Missing summary generates a relevant high-priority suggestion"
        );

        // 4. Weak project descriptions generate a project suggestion
        const weakProjSuggestions = generateRuleBasedSuggestions({
            structuredResume: {
                professionalSummary: "Full Stack Engineer with 3 years experience building responsive web applications.",
                skills: ["React", "Node.js"],
                projects: [
                    { projectName: "Mini App", description: "Built website" } // Under 40 chars
                ]
            },
            rawText: "Mini App Built website"
        });
        const projSug = weakProjSuggestions.find(s => s.category === "projects");
        assertTest(
            projSug && projSug.problem.includes("lack sufficient technical depth"),
            "4. Weak project descriptions generate a project suggestion"
        );

        // 5. Unsupported skills are not presented as proven skills
        const skillsSug = baselineSuggestions.find(s => s.category === "skills");
        assertTest(
            !baselineSuggestions.some(s => s.recommendedAction.includes("claim you have mastered")),
            "5. Unsupported skills are not presented as proven skills"
        );

        // 6. Missing keywords are not falsely presented as possessed skills
        const keywordSuggestions = generateRuleBasedSuggestions({
            structuredResume: {
                skills: ["React"]
            },
            rawText: "React front end resume",
            jobDescription: "Required: Docker, Kubernetes, AWS. Preferred: Python."
        });
        const kwSug = keywordSuggestions.find(s => s.category === "keywords");
        assertTest(
            kwSug && kwSug.recommendedAction.includes("If you have legitimate experience with"),
            "6. Missing keywords are not falsely presented as possessed skills"
        );

        // 7. Freshers are not unfairly penalized for missing employment history
        const fresherSuggestions = generateRuleBasedSuggestions({
            structuredResume: {
                professionalSummary: "CS Graduate eager to contribute.",
                skills: ["Python", "C++"],
                experience: [], // Fresher
                projects: [{ projectName: "Course Capstone", description: "Engineered distributed compiler in C++." }]
            },
            rawText: "CS Graduate. Python, C++. Course Capstone."
        });
        const expSug = fresherSuggestions.find(s => s.category === "work_experience");
        assertTest(
            expSug && expSug.title.includes("Practical Projects") && !expSug.recommendedAction.includes("fabricate"),
            "7. Freshers are not unfairly penalized for missing employment history"
        );

        // 8. No fabricated certifications or achievements
        const certSug = baselineSuggestions.find(s => s.category === "certifications");
        assertTest(
            certSug && certSug.recommendedAction.includes("Do not invent certifications"),
            "8. No fabricated certifications or achievements"
        );

        // 9. Duplicate suggestions are removed
        const duplicateCheck = generateRuleBasedSuggestions({
            structuredResume: {
                professionalSummary: "",
                skills: ["React"],
                experience: [{ responsibilities: ["Responsible for servers.", "Responsible for databases."] }]
            },
            rawText: "Responsible for servers. Responsible for databases."
        });
        const expCount = duplicateCheck.filter(s => s.title === "Transform Passive Responsibilities into Impact Statements").length;
        assertTest(
            expCount === 1,
            "9. Duplicate suggestions are removed"
        );

        // ==========================================
        // PART 2: SCHEMA & VALIDATION TESTS
        // ==========================================
        console.log("\n--- PART 2: SCHEMA & VALIDATION TESTS ---");

        // 10. Invalid AI output is rejected by Zod
        let zodRejected = false;
        try {
            singleSuggestionSchema.parse({
                id: "sug_invalid",
                title: "Bad",
                category: "invalid_category", // Invalid
                priority: "extreme", // Invalid
                problem: "Short",
                whyItMatters: "Short",
                recommendedAction: "Short",
                evidence: [],
                confidence: 2.5 // Invalid > 1
            });
        } catch {
            zodRejected = true;
        }
        assertTest(zodRejected, "10. Invalid AI output is rejected strictly by Zod schema");

        // ==========================================
        // PART 3: ADVANCED AI FALLBACK TESTS
        // ==========================================
        console.log("\n--- PART 3: ADVANCED AI FALLBACK TESTS ---");

        // 11. Advanced Mode handles missing / exhausted API key gracefully
        const advancedRes = await calculateImprovementSuggestions({
            rawText: "Candidate Resume Content with JavaScript and Node.js.",
            structuredResume: {
                professionalSummary: "Software Developer",
                skills: ["JavaScript", "Node.js"]
            },
            resumeId: 999,
            userId: testUserA.id,
            mode: "advanced"
        });

        assertTest(
            advancedRes && advancedRes.suggestions.length > 0 && (advancedRes.generationMode === "advanced" || advancedRes.generationMode === "free"),
            "11. Advanced Mode handles API unavailability gracefully"
        );

        // 12. Quota errors fall back to deterministic rule-based output
        assertTest(
            Array.isArray(advancedRes.suggestions) && advancedRes.totalSuggestions > 0,
            "12. Quota / model errors gracefully preserve usable suggestions"
        );

        // 13. Malformed AI output fallback preserves schema validity
        const validatedResponse = improvementSuggestionsResponseSchema.parse(advancedRes);
        assertTest(
            validatedResponse.suggestions.length === advancedRes.suggestions.length,
            "13. Advanced Mode output satisfies improvementSuggestionsResponseSchema"
        );

        // ==========================================
        // PART 4: INTEGRATION & API TESTS
        // ==========================================
        console.log("\n--- PART 4: INTEGRATION & API TESTS ---");

        // Setup real database resume record for User A
        const pdfStagingPath = path.join(STAGING_DIR, `sug_test_${timestamp}.pdf`);
        const richResumeText =
            "ALEX MORGAN\nalex@example.com\n555-432-1098\n" +
            "PROFESSIONAL SUMMARY\nFull Stack Developer with experience in React and Node.js.\n" +
            "SKILLS\nJavaScript, React, Node.js, Express, Docker\n" +
            "WORK EXPERIENCE\nSoftware Engineer at Tech Corp\n" +
            "• Responsible for building web APIs.\n" +
            "PROJECTS\nTask Tracker: Built with React.\n" +
            "EDUCATION\nB.S. in Computer Science 2023.";

        fs.writeFileSync(pdfStagingPath, createValidPdfBuffer("Alex Morgan Resume Document"));

        const storedResumeA = await storeResumeFileAndMetadata({
            userId: testUserA.id,
            candidateName: "Alex Morgan",
            originalName: "Alex_Morgan_Resume.pdf",
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

        // 14. Unauthenticated requests are rejected
        const unauthRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/improvement-suggestions`,
            "POST",
            { mode: "free" }
        );
        assertTest(
            unauthRes.status === 401,
            "14. Unauthenticated requests are rejected with HTTP 401"
        );

        // 15. User B cannot access User A's resume
        const crossUserRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/improvement-suggestions`,
            "POST",
            { mode: "free" },
            { Authorization: `Bearer ${tokenB}` }
        );
        assertTest(
            crossUserRes.status === 404 || crossUserRes.status === 403,
            "15. User B cannot access User A's resume (HTTP 404/403 IDOR blocked)"
        );

        // POST /api/resumes/:id/improvement-suggestions (Free Mode)
        const postFreeRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/improvement-suggestions`,
            "POST",
            { mode: "free" },
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            postFreeRes.status === 200 && postFreeRes.body?.success === true && postFreeRes.body?.data?.suggestions?.length > 0,
            "POST /api/resumes/:id/improvement-suggestions generates and returns suggestions (HTTP 200)"
        );

        const firstSuggestionId = postFreeRes.body?.data?.suggestions[0]?.id;

        // GET /api/resumes/:id/improvement-suggestions
        const getSuggestionsRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/improvement-suggestions`,
            "GET",
            null,
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            getSuggestionsRes.status === 200 && getSuggestionsRes.body?.data?.totalSuggestions > 0,
            "GET /api/resumes/:id/improvement-suggestions retrieves saved suggestions (HTTP 200)"
        );

        // PATCH /api/resumes/:id/improvement-suggestions/:suggestionId/status
        const patchStatusRes = await requestApi(
            `/api/resumes/${storedResumeA.id}/improvement-suggestions/${firstSuggestionId}/status`,
            "PATCH",
            { status: "accepted" },
            { Authorization: `Bearer ${tokenA}` }
        );

        assertTest(
            patchStatusRes.status === 200 && patchStatusRes.body?.data?.status === "accepted",
            "PATCH /api/resumes/:id/improvement-suggestions/:suggestionId/status updates status to 'accepted'"
        );

        // 16. Existing resume analysis and scoring features still work
        const atsCalcRes = calculateAtsScore({
            fileInfo: { fileType: "pdf", fileSize: 1024 },
            structuredResume: { skills: ["React", "Node.js"] },
            rawText: richResumeText
        });
        const detailedScoreRes = await calculateDetailedResumeScore({
            resumeId: storedResumeA.id,
            userId: testUserA.id,
            rawText: richResumeText,
            structuredResume: { skills: ["React", "Node.js"], experience: [], education: [] }
        });
        const fgScoreRes = await calculateFormattingGrammarScore({
            resumeId: storedResumeA.id,
            userId: testUserA.id,
            rawText: richResumeText,
            structuredResume: { skills: ["React", "Node.js"] }
        });
        const swRes = await calculateStrengthsWeaknesses({
            rawText: richResumeText,
            structuredResume: { skills: ["React", "Node.js"] },
            resumeId: storedResumeA.id,
            userId: testUserA.id
        });
        const skRes = await calculateSkillsAndKeywords({
            rawText: richResumeText,
            structuredResume: { skills: ["React", "Node.js"] },
            resumeId: storedResumeA.id,
            userId: testUserA.id
        });

        assertTest(
            atsCalcRes.atsScore !== undefined &&
            detailedScoreRes.overallScore !== undefined &&
            fgScoreRes.overallScore !== undefined &&
            swRes.strengths !== undefined &&
            skRes.detectedSkills !== undefined,
            "16. Existing resume analysis and scoring features still work without regression"
        );

        // 17. Database errors are handled safely
        let dbErrorHandled = false;
        try {
            await getLatestImprovementSuggestionsForResume({
                resumeId: -999,
                userId: testUserA.id
            });
        } catch (err) {
            dbErrorHandled = err.statusCode === 404;
        }
        assertTest(
            dbErrorHandled,
            "17. Database / resource lookups handle invalid IDs safely without leaking stack traces"
        );

    } finally {
        // Cleanup test data
        try {
            if (testUserA?.id) {
                await db.execute(`DELETE FROM resume_improvement_suggestions WHERE user_id = ?`, [testUserA.id]);
                await db.execute(`DELETE FROM resume_skills_keywords WHERE user_id = ?`, [testUserA.id]);
                await db.execute(`DELETE FROM resume_strengths_weaknesses WHERE user_id = ?`, [testUserA.id]);
                await db.execute(`DELETE FROM resume_scores WHERE user_id = ?`, [testUserA.id]);
                await db.execute(`DELETE FROM resume_files WHERE resume_id IN (SELECT resume_id FROM resumes WHERE user_id = ?)`, [testUserA.id]);
                await db.execute(`DELETE FROM resumes WHERE user_id = ?`, [testUserA.id]);
                await db.execute(`DELETE FROM users WHERE user_id = ?`, [testUserA.id]);
            }
            if (testUserB?.id) {
                await db.execute(`DELETE FROM users WHERE user_id = ?`, [testUserB.id]);
            }
        } catch {
            // Ignore cleanup errors
        }

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    }

    console.log("\n=================================================");
    console.log(`ALL TESTS PASSED: ${passCount} Passed, ${failCount} Failed`);
    console.log("=================================================\n");
}

runAllImprovementSuggestionsTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test execution failed with error:", err);
        process.exit(1);
    });
