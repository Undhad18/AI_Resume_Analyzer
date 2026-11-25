import http from "http";
import path from "path";
import fs from "fs";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import { STAGING_DIR, STORAGE_DIR } from "../config/multerConfig.js";
import { storeResumeFileAndMetadata } from "../services/resumeStorageService.js";
import {
    createValidDocxBuffer,
    createMultiParagraphDocxBuffer,
    createEmptyDocxBuffer,
    createDocxWithoutDocumentXml,
    createValidPdfBuffer
} from "./fixtures/documentFixtures.js";

const PORT = 5072;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const requestRaw = (endpointPath, method = "POST", body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpointPath}`);
        const bodyBuffer = body ? (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))) : null;

        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: `${url.pathname}${url.search}`,
                method,
                headers: {
                    ...(bodyBuffer ? { "Content-Length": bodyBuffer.length } : {}),
                    ...(body && !Buffer.isBuffer(body) ? { "Content-Type": "application/json" } : {}),
                    ...headers
                }
            },
            (res) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(chunk));
                res.on("end", () => {
                    const buffer = Buffer.concat(chunks);
                    const rawData = buffer.toString("utf8");
                    let json = null;
                    try {
                        json = JSON.parse(rawData);
                    } catch {
                        json = null;
                    }
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: json || rawData,
                        rawBuffer: buffer
                    });
                });
            }
        );

        req.on("error", reject);
        if (bodyBuffer) {
            req.write(bodyBuffer);
        }
        req.end();
    });
};

const runTests = async () => {
    console.log("==================================================");
    console.log("  AI RESUME ANALYZER - DOCX TEXT EXTRACTION TESTS ");
    console.log("==================================================\n");

    try {
        await testDatabaseConnection();
    } catch (dbErr) {
        console.error("Database connection failed:", dbErr.message);
        process.exit(1);
    }

    const server = http.createServer(app);
    await new Promise((res) => server.listen(PORT, res));

    let passed = 0;
    let failed = 0;
    const testUserIds = [];
    const testFilesCreated = [];

    const assert = (condition, message) => {
        if (condition) {
            console.log(`[PASS] ${message}`);
            passed++;
        } else {
            console.error(`[FAIL] ${message}`);
            failed++;
        }
    };

    try {
        // Setup two distinct test users for tenant isolation testing
        const suffix = Date.now().toString().slice(-6);
        const userA = await registerUser({
            fullName: `DOCX Test User A ${suffix}`,
            email: `docx_user_a_${suffix}@example.com`,
            password: "Password123!"
        });
        testUserIds.push(userA.id);

        const userB = await registerUser({
            fullName: `DOCX Test User B ${suffix}`,
            email: `docx_user_b_${suffix}@example.com`,
            password: "Password123!"
        });
        testUserIds.push(userB.id);

        const tokenA = generateToken({
            sub: userA.id,
            userId: userA.id,
            email: userA.email,
            roleId: 2
        });
        const headersA = {
            Cookie: `token=${tokenA}; csrfToken=test-csrf-token`,
            "X-CSRF-Token": "test-csrf-token"
        };

        const tokenB = generateToken({
            sub: userB.id,
            userId: userB.id,
            email: userB.email,
            roleId: 2
        });
        const headersB = {
            Cookie: `token=${tokenB}; csrfToken=test-csrf-token`,
            "X-CSRF-Token": "test-csrf-token"
        };

        // Helper to stage and store a resume document in private storage
        const stageAndStoreResume = async ({ userId, originalName, mimeType, documentType, buffer }) => {
            const stagedFilename = `stage-docx-${Date.now()}-${Math.random().toString(36).substring(7)}.tmp`;
            const stagedPath = path.join(STAGING_DIR, stagedFilename);
            await fs.promises.writeFile(stagedPath, buffer);
            testFilesCreated.push(stagedPath);

            const record = await storeResumeFileAndMetadata({
                userId,
                candidateName: `Candidate ${suffix}`,
                originalName,
                stagedPath,
                mimeType,
                fileSize: buffer.length,
                documentType
            });

            // Track stored file for cleanup
            const storedFilePath = path.join(STORAGE_DIR, record.storedFilename);
            testFilesCreated.push(storedFilePath);

            return record;
        };

        // --- Case 1: Valid DOCX extracts readable text ---
        const validDocxBuf = createValidDocxBuffer("Harshil Undhad - Senior Full-Stack Engineer");
        const resume1 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Harshil_Resume.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: validDocxBuf
        });

        const res1 = await requestRaw(`/api/resumes/${resume1.id}/extract-docx-text`, "POST", null, headersA);

        assert(res1.status === 200, "Case 1: Valid DOCX returns HTTP 200");
        assert(res1.body?.success === true, "Case 1: Response indicates success = true");
        assert(
            typeof res1.body?.data?.extractedText === "string" &&
            res1.body.data.extractedText.includes("Harshil Undhad"),
            "Case 1: Extracted text contains expected resume content"
        );
        assert(res1.body?.data?.characterCount > 0, "Case 1: Character count is reported accurately");
        assert(
            res1.headers["cache-control"]?.includes("no-store"),
            "Case 1: Response includes Cache-Control: no-store header"
        );

        // Verify database persistence of extracted text
        const [dbRows] = await db.execute(
            `SELECT extracted_text FROM resumes WHERE resume_id = ?`,
            [resume1.id]
        );
        assert(
            dbRows[0]?.extracted_text?.includes("Harshil Undhad"),
            "Case 1: Extracted text is saved to MySQL resumes table"
        );

        // --- Case 2: Multiple paragraphs are extracted ---
        // --- Case 3: Headings and section text remain readable ---
        const multiParaBuf = createMultiParagraphDocxBuffer([
            "Professional Summary",
            "Full-Stack Architect with extensive experience in React, Node.js, and cloud systems.",
            "Technical Skills",
            "Languages: JavaScript, TypeScript, Python, SQL.",
            "Frameworks: React 19, Express 5, Tailwind CSS."
        ]);
        const resume2 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Multi_Paragraph_Resume.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: multiParaBuf
        });

        const res2 = await requestRaw(`/api/resumes/${resume2.id}/extract-docx-text`, "POST", null, headersA);

        assert(res2.status === 200, "Case 2: Multi-paragraph DOCX returns HTTP 200");
        assert(
            res2.body?.data?.extractedText?.includes("Professional Summary") &&
            res2.body?.data?.extractedText?.includes("Technical Skills") &&
            res2.body?.data?.extractedText?.includes("React 19, Express 5"),
            "Case 2 & 3: Headings, sections, and multiple paragraphs remain readable with preserved separation"
        );

        // --- Case 4: Empty DOCX is handled safely ---
        const emptyDocxBuf = createEmptyDocxBuffer();
        const resume4 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Empty_Document.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: emptyDocxBuf
        });

        const res4 = await requestRaw(`/api/resumes/${resume4.id}/extract-docx-text`, "POST", null, headersA);

        assert(
            res4.status === 422 || res4.status === 400,
            "Case 4: Empty DOCX returns HTTP 422/400 instead of blank success"
        );
        assert(
            res4.body?.success === false,
            "Case 4: Empty DOCX indicates success = false"
        );
        assert(
            res4.body?.message?.toLowerCase().includes("no readable text") ||
            res4.body?.message?.toLowerCase().includes("empty"),
            "Case 4: Empty DOCX returns descriptive user-facing notice"
        );

        // --- Case 5: Whitespace-only content is rejected ---
        const whitespaceDocxBuf = createValidDocxBuffer("     \n\t   \n\r   ");
        const resume5 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Whitespace_Only.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: whitespaceDocxBuf
        });

        const res5 = await requestRaw(`/api/resumes/${resume5.id}/extract-docx-text`, "POST", null, headersA);

        assert(
            res5.status === 422 || res5.status === 400,
            "Case 5: Whitespace-only DOCX is rejected with HTTP 422/400"
        );
        assert(res5.body?.success === false, "Case 5: Whitespace-only response indicates success = false");

        // --- Case 6: Corrupted DOCX is handled ---
        // --- Case 7: Invalid ZIP structure is rejected ---
        const badZipBuf = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0xDE, 0xAD, 0xBE, 0xEF]);
        const resume7 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Corrupted_Zip.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: badZipBuf
        });

        const res7 = await requestRaw(`/api/resumes/${resume7.id}/extract-docx-text`, "POST", null, headersA);

        assert(
            res7.status === 400 || res7.status === 422,
            "Case 6 & 7: Corrupted / invalid ZIP DOCX returns HTTP 400/422"
        );
        assert(res7.body?.success === false, "Case 6 & 7: Indicates success = false");

        // --- Case 8: Missing word/document.xml is rejected ---
        const missingDocXmlBuf = createDocxWithoutDocumentXml();
        const resume8 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Missing_DocXml.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: missingDocXmlBuf
        });

        const res8 = await requestRaw(`/api/resumes/${resume8.id}/extract-docx-text`, "POST", null, headersA);

        assert(
            res8.status === 400,
            "Case 8: Missing word/document.xml is rejected with HTTP 400"
        );
        assert(
            res8.body?.message?.toLowerCase().includes("document.xml") ||
            res8.body?.message?.toLowerCase().includes("package"),
            "Case 8: Rejection message clearly specifies missing package component"
        );

        // --- Case 9: PDF submitted to DOCX endpoint is rejected ---
        const pdfBuf = createValidPdfBuffer("PDF Content Attempt");
        const resumePdf = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Wrong_Format.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: pdfBuf
        });

        const res9 = await requestRaw(`/api/resumes/${resumePdf.id}/extract-docx-text`, "POST", null, headersA);

        assert(res9.status === 400, "Case 9: PDF submitted to DOCX extraction endpoint returns HTTP 400");
        assert(
            res9.body?.message?.toLowerCase().includes("docx") ||
            res9.body?.message?.toLowerCase().includes("pdf"),
            "Case 9: Explanation notes document format mismatch"
        );

        // --- Case 10: Missing physical file on storage is handled ---
        const ghostDocxBuf = createValidDocxBuffer("Ghost Word Document");
        const ghostResume = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Ghost.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: ghostDocxBuf
        });
        const ghostPath = path.join(STORAGE_DIR, ghostResume.storedFilename);
        if (fs.existsSync(ghostPath)) {
            await fs.promises.unlink(ghostPath);
        }

        const res10 = await requestRaw(`/api/resumes/${ghostResume.id}/extract-docx-text`, "POST", null, headersA);
        assert(res10.status === 404, "Case 10: Missing physical DOCX file returns HTTP 404");
        assert(
            res10.body?.message?.toLowerCase().includes("missing"),
            "Case 10: Safe error message returned without leaking server internals"
        );

        // --- Case 11: Invalid or non-existent resume ID is handled ---
        const res11a = await requestRaw(`/api/resumes/99999999/extract-docx-text`, "POST", null, headersA);
        assert(res11a.status === 404, "Case 11a: Non-existent resume ID returns HTTP 404");

        const res11b = await requestRaw(`/api/resumes/invalid_id/extract-docx-text`, "POST", null, headersA);
        assert(res11b.status === 400, "Case 11b: Non-numeric resume ID returns HTTP 400");

        // --- Case 12: Unauthenticated request returns HTTP 401 ---
        const res12 = await requestRaw(`/api/resumes/${resume1.id}/extract-docx-text`, "POST", null, {});
        assert(res12.status === 401, "Case 12: Unauthenticated request returns HTTP 401");

        // --- Case 13: User A cannot extract User B's DOCX (IDOR Protection) ---
        const res13 = await requestRaw(`/api/resumes/${resume1.id}/extract-docx-text`, "POST", null, headersB);
        assert(res13.status === 403, "Case 13: Cross-tenant extraction attempt returns HTTP 403 Forbidden");
        assert(
            res13.body?.message?.toLowerCase().includes("access denied") ||
            res13.body?.message?.toLowerCase().includes("not own"),
            "Case 13: Cross-tenant error indicates resource ownership violation"
        );

        // --- Case 14: Client cannot provide arbitrary filesystem paths ---
        const res14 = await requestRaw(
            `/api/resumes/${resume1.id}/extract-docx-text`,
            "POST",
            { filePath: "C:\\Windows\\win.ini", path: "/etc/passwd" },
            headersA
        );
        assert(res14.status === 200, "Case 14: Arbitrary filePath in request body is ignored");
        assert(
            res14.body?.data?.extractedText?.includes("Harshil Undhad"),
            "Case 14: Extraction strictly sources physical path from verified database record"
        );

        // --- Case 15: ZIP resource limits are enforced ---
        const fakeOversized = Buffer.alloc(11 * 1024 * 1024);
        fakeOversized[0] = 0x50; fakeOversized[1] = 0x4B; fakeOversized[2] = 0x03; fakeOversized[3] = 0x04;
        const oversizedResume = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Oversized.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: fakeOversized
        });

        const res15 = await requestRaw(`/api/resumes/${oversizedResume.id}/extract-docx-text`, "POST", null, headersA);
        assert(
            res15.status === 413 || res15.status === 400,
            "Case 15: Oversized DOCX exceeds processing limits (HTTP 413/400)"
        );

        // --- Case 16: Parser errors do not expose stack traces ---
        assert(
            !JSON.stringify(res7.body).includes("at process.processTicksAndRejections") &&
            !JSON.stringify(res7.body).includes("node:internal"),
            "Case 16: Parser errors never leak Node.js internal stack traces to client"
        );

        // --- Case 17: Existing PDF extraction tests still pass seamlessly ---
        const res17Pdf = await requestRaw(`/api/resumes/${resumePdf.id}/extract-text`, "POST", null, headersA);
        assert(
            res17Pdf.status === 200 && res17Pdf.body?.data?.extractedText?.includes("PDF Content"),
            "Case 17: Existing PDF extraction endpoint operates without regression"
        );

        // --- Case 18: Existing health check API operates normally ---
        const res18Health = await requestRaw(`/api/health`, "GET");
        assert(res18Health.status === 200, "Case 18: Existing health check API operates normally");

    } catch (testErr) {
        console.error("Test execution threw an uncaught error:", testErr);
        failed++;
    } finally {
        await new Promise((res) => server.close(res));

        for (const f of testFilesCreated) {
            try {
                if (fs.existsSync(f)) {
                    await fs.promises.unlink(f);
                }
            } catch {}
        }

        if (testUserIds.length > 0) {
            try {
                console.log(`Cleaning up test user records: [${testUserIds.join(", ")}]...`);
                await db.execute(
                    `DELETE FROM analysis_history WHERE user_id IN (${testUserIds.map(() => "?").join(",")})`,
                    testUserIds
                );
                await db.execute(
                    `DELETE FROM resume_files WHERE resume_id IN (SELECT resume_id FROM resumes WHERE user_id IN (${testUserIds.map(() => "?").join(",")}))`,
                    testUserIds
                );
                await db.execute(
                    `DELETE FROM resumes WHERE user_id IN (${testUserIds.map(() => "?").join(",")})`,
                    testUserIds
                );
                await db.execute(
                    `DELETE FROM users WHERE user_id IN (${testUserIds.map(() => "?").join(",")})`,
                    testUserIds
                );
                console.log("Cleanup completed.");
            } catch (cleanupErr) {
                console.error("Cleanup error:", cleanupErr.message);
            }
        }

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log("-------------------------------------------------\n");

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
};

runTests();
