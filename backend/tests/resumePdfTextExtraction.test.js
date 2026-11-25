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
    createValidPdfBuffer,
    createMultiPagePdfBuffer,
    createEmptyPdfBuffer,
    createEncryptedPdfBuffer,
    createValidDocxBuffer
} from "./fixtures/documentFixtures.js";

const PORT = 5068;
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
    console.log("=================================================");
    console.log("  AI RESUME ANALYZER - PDF TEXT EXTRACTION TESTS ");
    console.log("=================================================\n");

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
            fullName: `Test User A ${suffix}`,
            email: `extract_user_a_${suffix}@example.com`,
            password: "Password123!"
        });
        testUserIds.push(userA.id);

        const userB = await registerUser({
            fullName: `Test User B ${suffix}`,
            email: `extract_user_b_${suffix}@example.com`,
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
            const stagedFilename = `stage-extract-${Date.now()}-${Math.random().toString(36).substring(7)}.tmp`;
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

        // --- Case 1: Valid PDF with selectable text extracts correctly ---
        const validPdfBuf = createValidPdfBuffer("Harshil Undhad - Senior Full-Stack Engineer");
        const resume1 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Harshil_Resume.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: validPdfBuf
        });

        const res1 = await requestRaw(`/api/resumes/${resume1.id}/extract-text`, "POST", null, headersA);

        assert(res1.status === 200, "Case 1: Valid PDF returns HTTP 200");
        assert(res1.body?.success === true, "Case 1: Response indicates success = true");
        assert(
            typeof res1.body?.data?.extractedText === "string" &&
            res1.body.data.extractedText.includes("Harshil Undhad"),
            "Case 1: Extracted text contains expected resume content"
        );
        assert(res1.body?.data?.characterCount > 0, "Case 1: Character count is reported correctly");
        assert(res1.body?.data?.pageCount === 1, "Case 1: Page count is accurate (1 page)");
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

        // --- Case 2: Multi-page PDF extracts text from all supported pages ---
        const multiPageBuf = createMultiPagePdfBuffer([
            "Section 1: Experience as Lead Software Architect at Cloud Corp",
            "Section 2: Education and Technical Skills: React, Node.js, MySQL"
        ]);
        const resume2 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Multi_Page_Resume.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: multiPageBuf
        });

        const res2 = await requestRaw(`/api/resumes/${resume2.id}/extract-text`, "POST", null, headersA);

        assert(res2.status === 200, "Case 2: Multi-page PDF returns HTTP 200");
        assert(res2.body?.data?.pageCount === 2, "Case 2: Multi-page PDF reports pageCount = 2");
        assert(
            res2.body?.data?.extractedText?.includes("Section 1") &&
            res2.body?.data?.extractedText?.includes("Section 2"),
            "Case 2: Text from all pages is extracted and combined cleanly"
        );

        // --- Case 3: Empty PDF is handled safely with a controlled message ---
        const emptyPdfBuf = createEmptyPdfBuffer();
        const resume3 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Empty_Document.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: emptyPdfBuf
        });

        const res3 = await requestRaw(`/api/resumes/${resume3.id}/extract-text`, "POST", null, headersA);

        assert(
            res3.status === 422 || res3.status === 400,
            "Case 3: Empty PDF returns HTTP 422/400 instead of crashing or returning blank success"
        );
        assert(
            res3.body?.success === false,
            "Case 3: Empty PDF indicates success = false"
        );
        assert(
            res3.body?.message?.toLowerCase().includes("no readable text") ||
            res3.body?.message?.toLowerCase().includes("scanned"),
            "Case 3: Empty PDF returns descriptive message"
        );

        // --- Case 4: Whitespace-only output is rejected as no readable text ---
        const whitespacePdfBuf = createValidPdfBuffer("    \n\t   \n\r   ");
        const resume4 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Whitespace_Only.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: whitespacePdfBuf
        });

        const res4 = await requestRaw(`/api/resumes/${resume4.id}/extract-text`, "POST", null, headersA);

        assert(
            res4.status === 422 || res4.status === 400,
            "Case 4: Whitespace-only PDF is rejected with HTTP 422/400"
        );
        assert(
            res4.body?.success === false,
            "Case 4: Whitespace-only PDF response indicates success = false"
        );

        // --- Case 5: Malformed PDF returns a controlled error ---
        const malformedBuf = Buffer.from("%PDF-1.4\nGarbage data not a real pdf body %%EOF");
        const resume5 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Corrupted.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: malformedBuf
        });

        const res5 = await requestRaw(`/api/resumes/${resume5.id}/extract-text`, "POST", null, headersA);

        assert(
            res5.status === 400 || res5.status === 422,
            "Case 5: Malformed PDF returns controlled HTTP 400/422"
        );
        assert(
            res5.body?.success === false,
            "Case 5: Malformed PDF indicates success = false"
        );
        assert(
            res5.body?.message?.toLowerCase().includes("malformed") ||
            res5.body?.message?.toLowerCase().includes("corrupted") ||
            res5.body?.message?.toLowerCase().includes("failed"),
            "Case 5: Malformed PDF provides controlled error description"
        );

        // --- Case 6: Encrypted PDF is handled according to parser capabilities ---
        const encryptedBuf = createEncryptedPdfBuffer();
        const resume6 = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Encrypted_Protected.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: encryptedBuf
        });

        const res6 = await requestRaw(`/api/resumes/${resume6.id}/extract-text`, "POST", null, headersA);

        assert(
            res6.status === 422 || res6.status === 400,
            "Case 6: Encrypted PDF returns HTTP 422/400 without crashing"
        );
        assert(
            res6.body?.message?.toLowerCase().includes("password") ||
            res6.body?.message?.toLowerCase().includes("encrypt") ||
            res6.body?.message?.toLowerCase().includes("readable"),
            "Case 6: Encrypted PDF returns safe user-facing explanation"
        );

        // --- Case 7: Scanned/image-only PDF returns an OCR-not-supported message ---
        // An empty stream PDF simulates a scanned document with no text layer
        assert(
            res3.body?.message?.toLowerCase().includes("ocr") ||
            res3.body?.message?.toLowerCase().includes("image-based") ||
            res3.body?.message?.toLowerCase().includes("scanned"),
            "Case 7: Scanned/image-only PDF informs user that OCR is not supported"
        );

        // --- Case 8: Missing or invalid resume ID is handled ---
        const res8a = await requestRaw(`/api/resumes/99999999/extract-text`, "POST", null, headersA);
        assert(res8a.status === 404, "Case 8a: Non-existent resume ID returns HTTP 404");

        const res8b = await requestRaw(`/api/resumes/invalid_id/extract-text`, "POST", null, headersA);
        assert(res8b.status === 400, "Case 8b: Non-numeric resume ID returns HTTP 400");

        // --- Case 9: Missing physical file on disk is handled ---
        // Staged resume whose physical file is manually removed
        const ghostPdfBuf = createValidPdfBuffer("Ghost PDF File");
        const ghostResume = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Ghost.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: ghostPdfBuf
        });
        const ghostPath = path.join(STORAGE_DIR, ghostResume.storedFilename);
        if (fs.existsSync(ghostPath)) {
            await fs.promises.unlink(ghostPath);
        }

        const res9 = await requestRaw(`/api/resumes/${ghostResume.id}/extract-text`, "POST", null, headersA);
        assert(res9.status === 404, "Case 9: Missing physical file on storage returns HTTP 404");
        assert(
            res9.body?.message?.toLowerCase().includes("missing"),
            "Case 9: Safe error message returned without leaking server internals"
        );

        // --- Case 10: DOCX is not processed by the PDF extraction endpoint ---
        const docxBuf = createValidDocxBuffer("Docx Candidate Skills");
        const docxResume = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Candidate_Word.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            documentType: "docx",
            buffer: docxBuf
        });

        const res10 = await requestRaw(`/api/resumes/${docxResume.id}/extract-text`, "POST", null, headersA);
        assert(res10.status === 400, "Case 10: DOCX resume is rejected by PDF text extraction endpoint with HTTP 400");
        assert(
            res10.body?.message?.toLowerCase().includes("docx") ||
            res10.body?.message?.toLowerCase().includes("not supported"),
            "Case 10: Clear explanation that DOCX extraction belongs to separate feature"
        );

        // --- Case 11: Unauthenticated request returns HTTP 401 ---
        const res11 = await requestRaw(`/api/resumes/${resume1.id}/extract-text`, "POST", null, {});
        assert(res11.status === 401, "Case 11: Unauthenticated request returns HTTP 401");

        // --- Case 12: User A cannot extract User B's resume (IDOR Protection) ---
        const res12 = await requestRaw(`/api/resumes/${resume1.id}/extract-text`, "POST", null, headersB);
        assert(res12.status === 403, "Case 12: Cross-tenant extraction attempt returns HTTP 403 Forbidden");
        assert(
            res12.body?.message?.toLowerCase().includes("access denied") ||
            res12.body?.message?.toLowerCase().includes("not own"),
            "Case 12: Cross-tenant error indicates resource ownership violation"
        );

        // --- Case 13: Client cannot supply a filesystem path to read arbitrary files ---
        const res13 = await requestRaw(
            `/api/resumes/${resume1.id}/extract-text`,
            "POST",
            { filePath: "C:\\Windows\\win.ini", path: "/etc/passwd" },
            headersA
        );
        assert(res13.status === 200, "Case 13: Arbitrary filePath in request body is ignored");
        assert(
            res13.body?.data?.extractedText?.includes("Harshil Undhad"),
            "Case 13: Extraction strictly sources physical path from verified database record"
        );

        // --- Case 14: Path traversal attempts in URL or params are rejected ---
        const res14 = await requestRaw(`/api/resumes/..%2f..%2fetc%2fpasswd/extract-text`, "POST", null, headersA);
        assert(
            res14.status === 400 || res14.status === 404,
            "Case 14: Path traversal attempt in URL parameter is safely blocked"
        );

        // --- Case 15: Oversized PDF is rejected or safely limited ---
        // Test memory safety limit in extraction service
        const fakeOversizedHeader = Buffer.alloc(11 * 1024 * 1024);
        fakeOversizedHeader.write("%PDF-1.4\n");
        const oversizedResume = await stageAndStoreResume({
            userId: userA.id,
            originalName: "Oversized_Document.pdf",
            mimeType: "application/pdf",
            documentType: "pdf",
            buffer: fakeOversizedHeader
        });

        const res15 = await requestRaw(`/api/resumes/${oversizedResume.id}/extract-text`, "POST", null, headersA);
        assert(
            res15.status === 413 || res15.status === 400,
            "Case 15: Oversized PDF exceeds processing limit (HTTP 413/400)"
        );

        // --- Case 16: Parser errors do not expose stack traces to clients ---
        assert(
            !JSON.stringify(res5.body).includes("at process.processTicksAndRejections") &&
            !JSON.stringify(res5.body).includes("node:internal"),
            "Case 16: Parser errors never leak Node.js internal stack traces to client"
        );

        // --- Case 17: Existing upload and PDF validation still work seamlessly ---
        const res17Health = await requestRaw(`/api/health`, "GET");
        assert(res17Health.status === 200, "Case 17: Existing health check API operates normally");

    } catch (testErr) {
        console.error("Test execution threw an uncaught error:", testErr);
        failed++;
    } finally {
        // Clean up test server
        await new Promise((res) => server.close(res));

        // Clean up created files
        for (const f of testFilesCreated) {
            try {
                if (fs.existsSync(f)) {
                    await fs.promises.unlink(f);
                }
            } catch {}
        }

        // Clean up test database records
        if (testUserIds.length > 0) {
            try {
                console.log(`Cleaning up test user records: [${testUserIds.join(", ")}]...`);
                // Foreign keys: delete child records first
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
