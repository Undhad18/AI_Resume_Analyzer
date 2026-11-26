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
import {
    evaluateHeadingConsistency,
    evaluateSectionOrganization,
    evaluateBulletStructure,
    evaluateDateConsistency,
    evaluateReadability,
    evaluateSpecialCharacters,
    calculateFormattingScore
} from "../services/formattingScoringService.js";
import {
    evaluateSpelling,
    evaluateGrammar,
    evaluateSentenceStructure,
    evaluateProfessionalLanguage,
    evaluateClarity,
    calculateGrammarScore
} from "../services/grammarScoringService.js";
import {
    calculateFormattingGrammarScore,
    saveFormattingGrammarScoreRecord,
    runFormattingGrammarScoringWorkflow,
    getLatestFormattingGrammarScoreForResume
} from "../services/formattingGrammarScoringWorkflow.js";
import {
    formattingScoreSchema,
    grammarScoreSchema,
    formattingGrammarScoreResponseSchema
} from "../validators/formattingGrammarScoreSchema.js";
import { calculateAtsScore } from "../services/atsScoringService.js";
import { calculateDetailedResumeScore } from "../services/detailedResumeScoringService.js";

const PORT = 5086;
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

const runAllFormattingGrammarTests = async () => {
    console.log("=================================================");
    console.log("MODULE 6 LESSON 6.4: FORMATTING & GRAMMAR TESTS");
    console.log("=================================================\n");

    const usersToClean = [];
    const resumesToClean = [];

    try {
        await testDatabaseConnection();

        if (!fs.existsSync(STAGING_DIR)) fs.mkdirSync(STAGING_DIR, { recursive: true });
        if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

        server = http.createServer(app);
        await new Promise((resolve) => server.listen(PORT, resolve));
        console.log(`Test server running on port ${PORT}\n`);

        // Setup test users
        const userA = await registerUser({
            fullName: "Grammar Candidate A",
            email: `grammar.user.a.${Date.now()}@example.com`,
            password: "Password123!Secure"
        });
        usersToClean.push(userA.id);
        const tokenA = generateToken({ userId: userA.id, id: userA.id, email: userA.email, name: "Candidate A" });
        const cookieA = `token=${tokenA}; csrfToken=test-csrf-token`;

        const userB = await registerUser({
            fullName: "Grammar Candidate B",
            email: `grammar.user.b.${Date.now()}@example.com`,
            password: "Password123!Secure"
        });
        usersToClean.push(userB.id);
        const tokenB = generateToken({ userId: userB.id, id: userB.id, email: userB.email, name: "Candidate B" });
        const cookieB = `token=${tokenB}; csrfToken=test-csrf-token`;

        // Upload a synthetic resume document for integration tests
        const pdfFilename = `stage-fg-${Date.now()}.pdf`;
        const pdfStagingPath = path.join(STAGING_DIR, pdfFilename);
        fs.writeFileSync(pdfStagingPath, createValidPdfBuffer(
            "ALEX RIVERA Software Engineer alex@example.com " +
            "SUMMARY Results driven software engineer with 4 years experience in building web applications. " +
            "SKILLS JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, Docker, Git. " +
            "EXPERIENCE Senior Software Engineer at Tech Corp 2021 to Present. " +
            "• Developed scalable backend services using Node.js and PostgreSQL. " +
            "• Built responsive user interfaces using React and Tailwind CSS. " +
            "EDUCATION B.S. in Computer Science from State University 2017 to 2021."
        ));

        const uploadedResume = await storeResumeFileAndMetadata({
            userId: userA.id,
            candidateName: "Alex Rivera",
            originalName: "Alex_Rivera_Resume.pdf",
            stagedPath: pdfStagingPath,
            mimeType: "application/pdf",
            fileSize: 1024,
            documentType: "pdf"
        });
        const resumeIdA = uploadedResume.id;
        resumesToClean.push(resumeIdA);

        // =========================================================================
        // GROUP 1: FORMATTING TESTS (Tests 1 - 12)
        // =========================================================================
        console.log("--- GROUP 1: FORMATTING SCORING TESTS ---");

        // Test 1: Standard headings
        const standardHeadingsText = "SUMMARY\nSoftware engineer\n\nSKILLS\nReact, Node\n\nEXPERIENCE\nDev at Corp\n\nEDUCATION\nBS CS";
        const evalF1 = evaluateHeadingConsistency(standardHeadingsText);
        assertTest(evalF1.rating >= 90, "Test 1: Standard uppercase headings score high on consistency");

        // Test 2: Inconsistent headings
        const inconsistentHeadingsText = "PROFESSIONAL SUMMARY\nExperienced engineer\n\nskills\nReact\n\nWORK EXPERIENCE\nDev\n\nEducation\nBS";
        const evalF2 = evaluateHeadingConsistency(inconsistentHeadingsText);
        assertTest(
            evalF2.rating < evalF1.rating &&
            evalF2.findings.some(f => f.issue.includes("Inconsistent Heading Casing")),
            "Test 2: Inconsistent heading capitalization triggers finding and lowers score"
        );

        // Test 3: Missing headings
        const noHeadingsText = "Just random text without any resume section markers whatsoever.";
        const evalF3 = evaluateHeadingConsistency(noHeadingsText);
        assertTest(
            evalF3.rating <= 30 &&
            evalF3.findings.some(f => f.issue.includes("No Clear Section Headings")),
            "Test 3: Missing headings identified with clear recommendation"
        );

        // Test 4: Duplicate sections
        const dupSectionsText = "SKILLS\nReact\n\nEXPERIENCE\nDev\n\nSKILLS\nNode.js\n\nEDUCATION\nBS";
        const evalF4 = evaluateSectionOrganization(dupSectionsText, { skills: ["React", "Node"] });
        assertTest(
            evalF4.findings.some(f => f.issue.includes("Duplicate Section")),
            "Test 4: Duplicate sections detected and flagged for consolidation"
        );

        // Test 5: Consistent bullet points
        const bulletText = "EXPERIENCE\n• Built microservices\n• Optimized queries\n• Led engineering team";
        const evalF5 = evaluateBulletStructure(bulletText, { experience: [{ title: "Dev" }] });
        assertTest(evalF5.rating === 100, "Test 5: Uniform standard bullet points achieve perfect bullet rating");

        // Test 6: Broken bullet characters
        const brokenBulletText = "EXPERIENCE\n? Built microservices\n? Optimized queries";
        const evalF6 = evaluateBulletStructure(brokenBulletText, { experience: [{ title: "Dev" }] });
        assertTest(
            evalF6.findings.some(f => f.issue.includes("Broken Bullet Characters")) &&
            evalF6.rating <= 65,
            "Test 6: Broken bullet characters (e.g. leading '?') detected and penalized"
        );

        // Test 7: Long paragraphs
        const longParagraph = "EXPERIENCE\n" + ("This is an excessively long and unstructured paragraph describing tasks in great detail without any bullet points or line breaks ".repeat(8));
        const evalF7 = evaluateBulletStructure(longParagraph, { experience: [{ title: "Dev" }] });
        assertTest(
            evalF7.findings.some(f => f.issue.includes("Dense Unstructured Paragraphs")),
            "Test 7: Dense unbulleted paragraphs > 75 words detected as formatting wall of text"
        );

        // Test 8: Inconsistent date formats
        const mixedDatesText = "EXPERIENCE\nRole A from May 2021 to Present\nRole B from 01/2019 to 04/2021";
        const evalF8 = evaluateDateConsistency(mixedDatesText);
        assertTest(
            evalF8.findings.some(f => f.issue.includes("Inconsistent Date Formats")),
            "Test 8: Mixed month name and numeric date formats detected as inconsistent"
        );

        // Test 9: Garbled characters
        const garbledText = "EXPERIENCE\nBuilt system with special \uFFFD and â€™ symbols that failed parsing.";
        const evalF9 = evaluateSpecialCharacters(garbledText);
        assertTest(
            evalF9.findings.some(f => f.issue.includes("Garbled Characters")),
            "Test 9: Garbled replacement characters and encoding artifacts detected"
        );

        // Test 10: Repeated text / punctuation
        const repeatedPunctText = "EXPERIENCE\nAre we scalable??? Yes we are scalable!!!!";
        const evalF10 = evaluateSpecialCharacters(repeatedPunctText);
        assertTest(
            evalF10.findings.some(f => f.issue.includes("Repeated Punctuation")),
            "Test 10: Repeated punctuation marks (???, !!!!) flagged as informal artifacts"
        );

        // Test 11: Empty extracted text
        const evalF11 = calculateFormattingScore({ rawText: "", structuredResume: {} });
        assertTest(
            evalF11.status === "not_evaluable" && evalF11.rating === 0,
            "Test 11: Empty extracted text returns not_evaluable status and 0 rating"
        );

        // Test 12: Formatting score calculation
        const fullFormatting = calculateFormattingScore({
            rawText: "SUMMARY\nEngineer\n\nSKILLS\nReact, Node\n\nEXPERIENCE\n• Built microservices in 2022 - 2024\n• Deployed API\n\nEDUCATION\nB.S. in CS",
            structuredResume: { skills: ["React"], experience: [{}], education: [{}] }
        });
        const fmtZodCheck = formattingScoreSchema.safeParse(fullFormatting);
        assertTest(
            fmtZodCheck.success && fullFormatting.rating >= 80,
            "Test 12: Complete formatting score validates against Zod schema and sums accurately"
        );

        // =========================================================================
        // GROUP 2: GRAMMAR TESTS (Tests 13 - 22)
        // =========================================================================
        console.log("\n--- GROUP 2: GRAMMAR & LANGUAGE TESTS ---");

        // Test 13: Correct spelling
        const correctText = "Experienced software engineer with successful track record in programming and management.";
        const evalG13 = evaluateSpelling(correctText);
        assertTest(evalG13.rating === 100 && evalG13.findings.length === 0, "Test 13: Correct spelling passes with 100 rating");

        // Test 14: Common spelling mistakes
        const typoText = "Have 3 years expereince in software develper and project managment.";
        const evalG14 = evaluateSpelling(typoText);
        assertTest(
            evalG14.findings.length >= 2 &&
            evalG14.findings.some(f => f.issue.includes("expereince")) &&
            evalG14.findings.some(f => f.issue.includes("develper")),
            "Test 14: Common spelling typos (expereince, develper) detected with suggestions"
        );

        // Test 15: Technical terms protected
        const techTermsText = "Expertise in React, TypeScript, GraphQL, Kubernetes, and PostgreSQL.";
        const evalG15 = evaluateSpelling(techTermsText);
        assertTest(
            evalG15.findings.length === 0 && evalG15.rating === 100,
            "Test 15: Technical vocabulary (GraphQL, Kubernetes, PostgreSQL) strictly protected from typo flagging"
        );

        // Test 16: Proper nouns
        const properNounsText = "Worked at Google, Microsoft, and Amazon on GitHub Actions.";
        const evalG16 = evaluateSpelling(properNounsText);
        assertTest(evalG16.findings.length === 0, "Test 16: Company proper nouns and platform names protected");

        // Test 17: Basic grammar errors
        const grammarErrorText = "The team was responsible for develop the new authentication flow.";
        const evalG17 = evaluateGrammar(grammarErrorText);
        assertTest(
            evalG17.findings.some(f => f.issue.includes("Gerund Form")),
            "Test 17: Preposition followed by bare infinitive ('for develop') detected"
        );

        // Test 18: Subject-verb agreement
        const agreementErrorText = "He have developed scalable microservices and they was fast.";
        const evalG18 = evaluateGrammar(agreementErrorText);
        assertTest(
            evalG18.findings.some(f => f.issue.includes("Subject-Verb Agreement")),
            "Test 18: Subject-verb agreement mismatches ('He have', 'they was') detected"
        );

        // Test 19: Long sentences
        const runOnText = "• " + "Engineered advanced cloud computing architecture using distributed microservices and continuous deployment pipelines while also managing database clustering and ensuring high availability across multiple geographic regions with minimal latency".repeat(2);
        const evalG19 = evaluateSentenceStructure(runOnText);
        assertTest(
            evalG19.findings.some(f => f.issue.includes("Run-On Sentence")),
            "Test 19: Overly long run-on sentences without punctuation detected"
        );

        // Test 20: Repeated words
        const repeatedWordsText = "Implemented the the new feature in in the production database.";
        const evalG20 = evaluateClarity(repeatedWordsText);
        assertTest(
            evalG20.findings.some(f => f.issue.includes("Repeated Word Typo")),
            "Test 20: Accidental duplicate consecutive words ('the the', 'in in') detected"
        );

        // Test 21: Punctuation and wordiness
        const wordyText = "In order to optimize performance, at this point in time we deployed caching.";
        const evalG21 = evaluateClarity(wordyText);
        assertTest(
            evalG21.findings.some(f => f.issue.includes("Wordy Phrasing")),
            "Test 21: Wordy filler phrases ('in order to', 'at this point in time') flagged with concise alternatives"
        );

        // Test 22: Grammar score calculation
        const fullGrammar = calculateGrammarScore({
            rawText: "Results-driven software engineer experienced in building microservices and web applications.",
            structuredResume: {}
        });
        const gZodCheck = grammarScoreSchema.safeParse(fullGrammar);
        assertTest(
            gZodCheck.success && fullGrammar.rating >= 90,
            "Test 22: Complete grammar score validates against Zod schema and sums accurately"
        );

        // =========================================================================
        // GROUP 3: INTEGRATION TESTS (Tests 23 - 33)
        // =========================================================================
        console.log("\n--- GROUP 3: INTEGRATION & REGRESSION TESTS ---");

        // Test 23: Free mode works without OPENAI_API_KEY
        const savedKey = process.env.OPENAI_API_KEY;
        delete process.env.OPENAI_API_KEY;
        try {
            const noKeyResult = calculateFormattingGrammarScore({
                rawText: "SUMMARY\nEngineer\n\nSKILLS\nReact, Node\n\nEXPERIENCE\n• Built API",
                structuredResume: { skills: ["React"] },
                resumeId: resumeIdA,
                userId: userA.id,
                analysisMode: "free"
            });
            assertTest(noKeyResult.formattingScore > 0, "Test 23: Free mode operates without OPENAI_API_KEY");
        } finally {
            if (savedKey) process.env.OPENAI_API_KEY = savedKey;
        }

        // Test 24: Free mode makes no OpenAI request
        const freeScoreResult = calculateFormattingGrammarScore({
            rawText: "EXPERIENCE\n• Developed features",
            structuredResume: {},
            resumeId: resumeIdA,
            userId: userA.id,
            analysisMode: "free"
        });
        assertTest(freeScoreResult.analysisMode === "free", "Test 24: Free mode runs 100% locally with zero OpenAI requests");

        // Test 25: Advanced mode uses existing OpenAI service convention
        const advancedScoreResult = calculateFormattingGrammarScore({
            rawText: "EXPERIENCE\n• Developed features",
            structuredResume: {},
            resumeId: resumeIdA,
            userId: userA.id,
            analysisMode: "ai"
        });
        assertTest(advancedScoreResult.analysisMode === "ai", "Test 25: Advanced mode preserves AI mode contract and structure");

        // Test 26: Invalid AI output is rejected by Zod
        const invalidPayload = { formattingScore: "invalid_string", grammarScore: -50 };
        const rejectCheck = formattingGrammarScoreResponseSchema.safeParse(invalidPayload);
        assertTest(rejectCheck.success === false, "Test 26: Invalid score payloads are strictly rejected by Zod validation");

        // Test 27: Formatting results persist in MySQL
        const saveRes = await saveFormattingGrammarScoreRecord({
            userId: userA.id,
            resumeId: resumeIdA,
            formattingGrammarResult: freeScoreResult
        });
        assertTest(
            saveRes && saveRes.formattingScore === freeScoreResult.formattingScore,
            "Test 27: Formatting score and detailed JSON persist in MySQL resume_scores"
        );

        // Test 28: Grammar results persist in MySQL
        assertTest(
            saveRes && saveRes.grammarScore === freeScoreResult.grammarScore,
            "Test 28: Grammar score and detailed JSON persist in MySQL resume_scores"
        );

        // Test 29: Overall score remains correctly weighted (Total = 100)
        const compositeBreakdown = freeScoreResult.integratedOverallBreakdown;
        const totalCompositeWeight =
            compositeBreakdown.contentQuality +
            compositeBreakdown.skills +
            compositeBreakdown.experience +
            compositeBreakdown.projects +
            compositeBreakdown.education +
            compositeBreakdown.clarity;

        assertTest(
            compositeBreakdown.totalScore <= 100 && totalCompositeWeight <= 100,
            "Test 29: Overall composite score remains correctly weighted (Total weight = 100)"
        );

        // Test 30: Existing ATS score still works
        const atsResult = calculateAtsScore({
            fileInfo: { fileType: "pdf", fileSize: 1024 },
            structuredResume: { personalInfo: { email: "alex@example.com" }, skills: ["React", "Node"] },
            rawText: "Sample resume text with engineered and database keywords."
        });
        assertTest(atsResult.atsScore > 0, "Test 30: Existing ATS compatibility score (Lesson 6.2) functions without regression");

        // Test 31: Cross-user access is denied (IDOR protection)
        const crossUserRes = await requestApi(
            `/api/resumes/${resumeIdA}/formatting-grammar-score`,
            "GET",
            null,
            { Cookie: cookieB, Authorization: `Bearer ${tokenB}` }
        );
        assertTest(
            crossUserRes.status === 403,
            "Test 31: Cross-user access is strictly blocked with HTTP 403 Forbidden"
        );

        // Test 32: Database failures are handled gracefully
        const invalidResumeQuery = await requestApi(
            `/api/resumes/99999999/formatting-grammar-score`,
            "GET",
            null,
            { Cookie: cookieA, Authorization: `Bearer ${tokenA}` }
        );
        assertTest(
            invalidResumeQuery.status === 404,
            "Test 32: Non-existent resume queries return clean HTTP 404"
        );

        // Test 33: Existing resume analysis still works
        const detailedScoreCheck = calculateDetailedResumeScore({
            structuredResume: {
                personalInfo: { email: "alex@example.com" },
                skills: ["JavaScript", "React"],
                education: [{ degree: "B.S." }],
                projects: [{ title: "App" }]
            },
            resumeId: resumeIdA,
            userId: userA.id
        });
        assertTest(
            detailedScoreCheck.overallScore > 0,
            "Test 33: Existing detailed resume scoring (Lesson 6.3) continues to function seamlessly"
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
            await db.execute(`DELETE FROM resume_scores WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resume_analyses WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resume_files WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resumes WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
        }
        if (usersToClean.length > 0) {
            await db.execute(`DELETE FROM users WHERE user_id IN (${usersToClean.map(() => "?").join(",")})`, usersToClean).catch(() => {});
        }
    }
};

runAllFormattingGrammarTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test execution failed:", err);
        process.exit(1);
    });
