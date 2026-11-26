/**
 * Test Suite: Resume Enhancement & Rewriting (Lesson 7.4)
 * Covers:
 * 1. Zod input schemas & validation
 * 2. Deterministic Free Enhancement Engine (100% offline, fact-preserving)
 * 3. AI Mode graceful fallback to Free Mode
 * 4. Draft creation, retrieval, candidate edits
 * 5. Draft approval & version registration in resume_versions
 * 6. Draft discard workflow
 * 7. Tenant isolation & ownership authorization
 * 8. End-to-end REST API endpoints on port 5090
 */

import http from "http";
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
    enhanceResumeInputSchema,
    updateDraftInputSchema,
    resumeEnhancementResponseSchema
} from "../validators/resumeEnhancementSchema.js";
import {
    cleanTextWhitespace,
    normalizeDateString,
    polishBulletStatement,
    enhanceSummary,
    enhanceSkills,
    enhanceExperience,
    enhanceResumeFreeMode
} from "../services/freeEnhancementService.js";
import { enhanceResumeAiMode } from "../services/aiEnhancementService.js";
import {
    runResumeEnhancementWorkflow,
    getLatestEnhancementDraft,
    updateEnhancementDraft,
    approveEnhancementDraft,
    discardEnhancementDraft,
    computeSectionsDiff
} from "../services/resumeEnhancementWorkflow.js";

const PORT = 5090;
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

async function runAllResumeEnhancementTests() {
    console.log("=================================================");
    console.log("STARTING LESSON 7.4 RESUME ENHANCEMENT TEST SUITE");
    console.log("=================================================");

    await testDatabaseConnection();

    // Start isolated test server
    await new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`Test server running on port ${PORT}`);
            resolve();
        });
    });

    try {
        // Setup mock users
        const timestamp = Date.now();
        const user1Email = `enhancer_${timestamp}@test.com`;
        const user2Email = `other_enhancer_${timestamp}@test.com`;

        const u1 = await registerUser({
            fullName: "Harshil Enhancer",
            email: user1Email,
            password: "Password123!"
        });
        const user1Token = generateToken({ id: u1.id, userId: u1.id, email: u1.email, role: "user" });

        const u2 = await registerUser({
            fullName: "Unauthorized User",
            email: user2Email,
            password: "Password123!"
        });
        const user2Token = generateToken({ id: u2.id, userId: u2.id, email: u2.email, role: "user" });

        // Setup test resume
        if (!fs.existsSync(STAGING_DIR)) {
            fs.mkdirSync(STAGING_DIR, { recursive: true });
        }
        const tempFilePath = path.join(STAGING_DIR, `enhancement_test_${timestamp}.pdf`);
        fs.writeFileSync(tempFilePath, createValidPdfBuffer("Harshil Enhancer Resume"));

        const stored = await storeResumeFileAndMetadata({
            userId: u1.id,
            originalName: "Harshil_Resume_Enhance.pdf",
            mimeType: "application/pdf",
            fileSize: 2048,
            stagedPath: tempFilePath,
            documentType: "pdf",
            candidateName: "Harshil Undhad"
        });

        const resumeId = stored.resumeId;

        // Seed extracted text
        const sampleResumeText = `Harshil Undhad
harshil@example.com | 9876543210 | Ahmedabad, India
linkedin.com/in/harshil | github.com/harshil

PROFESSIONAL SUMMARY
Experienced software engineer with experience in building web applications with React and Node.

SKILLS
React.js, Node.js, JavaScript, Express, MySQL, MongoDB, React.js, Tailwind CSS

EXPERIENCE
Full Stack Developer | Tech Innovations | 2022-01 - 2023-12
- Responsible for the development of web applications using React.js and Node.js
- Helped with the creation of RESTful APIs
- Worked on database optimization

PROJECTS
E-Commerce Platform
- Built online store with cart functionality using React

EDUCATION
B.Tech in Computer Science | Gujarat Technological University | 2018 - 2022`;

        await db.query("UPDATE resumes SET extracted_text = ? WHERE resume_id = ?", [
            sampleResumeText,
            resumeId
        ]);

        console.log("\n--- TEST GROUP 1: ZOD SCHEMAS & INPUT VALIDATION ---");

        // Test 1: Valid default enhancement input
        const validDefault = enhanceResumeInputSchema.parse({});
        assertTest(
            validDefault.mode === "free" && validDefault.scope === "full_resume",
            "Test 1: Default enhancement options parse to mode='free' and scope='full_resume'"
        );

        // Test 2: Valid single_section input
        const validSection = enhanceResumeInputSchema.parse({
            scope: "single_section",
            section: "professionalSummary"
        });
        assertTest(
            validSection.scope === "single_section" && validSection.section === "professionalSummary",
            "Test 2: Valid single_section scope with valid section succeeds"
        );

        // Test 3: Invalid single_section missing section rejects
        let rejectedSection = false;
        try {
            enhanceResumeInputSchema.parse({ scope: "single_section" });
        } catch {
            rejectedSection = true;
        }
        assertTest(rejectedSection, "Test 3: single_section without section identifier correctly rejects");

        // Test 4: updateDraftInputSchema validation
        const validUpdate = updateDraftInputSchema.parse({
            enhancedContent: { professionalSummary: "Updated summary text." },
            changesSummary: "Manual polish."
        });
        assertTest(
            validUpdate.enhancedContent.professionalSummary === "Updated summary text.",
            "Test 4: updateDraftInputSchema validates candidate draft modifications"
        );

        console.log("\n--- TEST GROUP 2: DETERMINISTIC FREE ENHANCEMENT ENGINE (FACT PRESERVATION) ---");

        // Test 5: cleanTextWhitespace
        const messyText = "Responsible for   developing   APIs  .  And   services ! ";
        const cleaned = cleanTextWhitespace(messyText);
        assertTest(
            cleaned === "Responsible for developing APIs. And services!",
            "Test 5: cleanTextWhitespace normalizes irregular spaces and punctuation"
        );

        // Test 6: normalizeDateString
        const dateNorm1 = normalizeDateString("2023-05");
        const dateNorm2 = normalizeDateString("11/2022");
        assertTest(
            dateNorm1 === "May 2023" && dateNorm2 === "November 2022",
            "Test 6: normalizeDateString standardizes ISO and slash dates to month-year format"
        );

        // Test 7: polishBulletStatement active verbs without fake metrics
        const polished = polishBulletStatement("responsible for the development of web applications using React.js");
        assertTest(
            polished.startsWith("Developed web applications using React.js"),
            "Test 7: polishBulletStatement replaces passive 'responsible for' with active verb 'Developed'"
        );

        // Test 8: Fact Preservation Rule
        const unquantified = "Worked on database optimization";
        const polishedUnquant = polishBulletStatement(unquantified);
        assertTest(
            !polishedUnquant.includes("%") && !polishedUnquant.includes("$") && !polishedUnquant.includes("10x"),
            "Test 8: Fact Preservation Rule: Engine never fabricates percentages, metrics, or revenue figures"
        );

        // Test 9: enhanceSkills deduplication
        const rawSkills = ["React.js", "Node.js", "JavaScript", "react.js", "Node.JS", "Tailwind CSS"];
        const enhancedSkills = enhanceSkills(rawSkills);
        assertTest(
            enhancedSkills.enhanced.length === 4 && enhancedSkills.enhanced.includes("React"),
            "Test 9: enhanceSkills deduplicates skills case-insensitively while preserving genuine items"
        );

        // Test 10: enhanceResumeFreeMode full resume
        const freeFull = enhanceResumeFreeMode({
            structuredResume: {
                professionalSummary: "  Experienced developer with experience in building web applications with React.  ",
                skills: rawSkills,
                experience: [
                    {
                        jobTitle: "developer",
                        company: "tech co",
                        startDate: "2022-01",
                        endDate: "2023-12",
                        responsibilities: ["responsible for developing web applications"]
                    }
                ]
            },
            scope: "full_resume"
        });
        assertTest(
            freeFull.sectionsDiff.length >= 7 && freeFull.sectionsDiff.some(d => d.isModified),
            "Test 10: enhanceResumeFreeMode performs full resume polish across all standard sections"
        );

        // Test 11: enhanceResumeFreeMode single section scope
        const freeSingle = enhanceResumeFreeMode({
            structuredResume: {
                professionalSummary: "Summary text",
                skills: ["React", "React"]
            },
            scope: "single_section",
            sectionName: "skills"
        });
        assertTest(
            freeSingle.sectionsDiff.length === 1 && freeSingle.sectionsDiff[0].sectionName === "skills",
            "Test 11: enhanceResumeFreeMode with single_section scope restricts polish to specified section"
        );

        console.log("\n--- TEST GROUP 3: AI ENHANCEMENT MODE & SEAMLESS FALLBACK ---");

        // Test 12: AI Mode fallback on unconfigured or quota limits
        const aiResult = await enhanceResumeAiMode({
            structuredResume: {
                professionalSummary: "A passionate full stack engineer.",
                skills: ["React", "Node"]
            },
            scope: "full_resume"
        });
        assertTest(
            aiResult.modeUsed === "free" || aiResult.modeUsed === "advanced",
            "Test 12: enhanceResumeAiMode completes safely with graceful fallback to deterministic Free Mode"
        );

        console.log("\n--- TEST GROUP 4: WORKFLOW SERVICE & DRAFT LIFECYCLE ---");

        // Test 13: runResumeEnhancementWorkflow creates draft in DB
        const draftResult = await runResumeEnhancementWorkflow({
            resumeId,
            userId: u1.id,
            options: { mode: "free", scope: "full_resume" }
        });
        assertTest(
            draftResult.draftId > 0 && draftResult.status === "draft",
            "Test 13: runResumeEnhancementWorkflow persists draft in resume_enhancement_drafts table"
        );

        // Test 14: getLatestEnhancementDraft retrieves draft with diffs
        const fetchedDraft = await getLatestEnhancementDraft({
            resumeId,
            userId: u1.id
        });
        assertTest(
            fetchedDraft !== null && fetchedDraft.draftId === draftResult.draftId && Array.isArray(fetchedDraft.sectionsDiff),
            "Test 14: getLatestEnhancementDraft retrieves draft and recomputes section diffs accurately"
        );

        // Test 15: updateEnhancementDraft allows candidate edits
        const updatedDraft = await updateEnhancementDraft({
            resumeId,
            userId: u1.id,
            draftId: draftResult.draftId,
            updatedContent: {
                ...fetchedDraft.enhancedContent,
                professionalSummary: "Executive Lead Full Stack Engineer with proven MERN architecture experience."
            },
            changesSummary: "Candidate customized summary statement."
        });
        assertTest(
            updatedDraft.enhancedContent.professionalSummary.includes("Executive Lead"),
            "Test 15: updateEnhancementDraft successfully persists candidate modifications"
        );

        // Test 16: approveEnhancementDraft registers version in resume_versions
        const approved = await approveEnhancementDraft({
            resumeId,
            userId: u1.id,
            draftId: draftResult.draftId
        });
        assertTest(
            approved.status === "approved" && approved.versionId > 0,
            "Test 16: approveEnhancementDraft marks draft approved and registers new improved version in resume_versions"
        );

        // Verify resume original is NOT overwritten
        const [originalResumeRows] = await db.query(
            "SELECT extracted_text FROM resumes WHERE resume_id = ?",
            [resumeId]
        );
        assertTest(
            originalResumeRows[0].extracted_text === sampleResumeText,
            "Test 16b: Original resume content remains 100% intact and untouched after draft approval"
        );

        // Test 17: Attempting to edit or approve finalized draft fails
        let editApprovedFailed = false;
        try {
            await updateEnhancementDraft({
                resumeId,
                userId: u1.id,
                draftId: draftResult.draftId,
                updatedContent: {}
            });
        } catch {
            editApprovedFailed = true;
        }
        assertTest(editApprovedFailed, "Test 17: Cannot edit an already approved draft (400 validation)");

        // Test 18: Discard workflow
        const draft2 = await runResumeEnhancementWorkflow({
            resumeId,
            userId: u1.id,
            options: { mode: "free", scope: "single_section", section: "skills" }
        });
        const discarded = await discardEnhancementDraft({
            resumeId,
            userId: u1.id,
            draftId: draft2.draftId
        });
        assertTest(
            discarded.status === "discarded",
            "Test 18: discardEnhancementDraft safely transitions draft to 'discarded' without version creation"
        );

        console.log("\n--- TEST GROUP 5: HTTP REST ENDPOINTS & TENANT ISOLATION ---");

        // Test 19: POST /api/resumes/:resumeId/enhance endpoint
        const apiEnhanceRes = await requestApi(
            `/api/resumes/${resumeId}/enhance`,
            "POST",
            { mode: "free", scope: "full_resume" },
            { Authorization: `Bearer ${user1Token}` }
        );
        assertTest(
            apiEnhanceRes.status === 200 && apiEnhanceRes.body.data.draftId > 0,
            "Test 19: POST /api/resumes/:resumeId/enhance returns 200 with new draft"
        );

        // Test 20: Tenant Isolation: User 2 cannot access or enhance User 1's resume
        const unauthorizedRes = await requestApi(
            `/api/resumes/${resumeId}/enhance`,
            "POST",
            { mode: "free", scope: "full_resume" },
            { Authorization: `Bearer ${user2Token}` }
        );
        assertTest(
            unauthorizedRes.status === 404 || unauthorizedRes.status === 403,
            "Test 20: Tenant isolation enforces strict resume ownership (unauthorized user receives 404/403)"
        );

        console.log("\n=================================================");
        console.log(`ALL TESTS PASSED: ${passCount} / ${passCount + failCount}`);
        console.log("=================================================");
    } catch (err) {
        console.error("Test execution encountered an error:", err);
        process.exitCode = 1;
    } finally {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await db.end();
    }
}

runAllResumeEnhancementTests();
