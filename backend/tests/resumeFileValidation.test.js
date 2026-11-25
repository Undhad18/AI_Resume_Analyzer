import http from "http";
import path from "path";
import fs from "fs";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import { UPLOAD_DIR } from "../config/multerConfig.js";
import {
    createValidPdfBuffer,
    createValidDocxBuffer,
    createValidJpgBuffer,
    createValidPngBuffer,
    createZipBuffer
} from "./fixtures/documentFixtures.js";

const PORT = 5062;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper to construct a standard multipart/form-data payload
const createMultipartPayload = (fieldName, filename, mimeType, fileBuffer) => {
    const boundary = "----TestBoundary" + Math.random().toString(36).substring(2);
    const header = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    return {
        contentType: `multipart/form-data; boundary=${boundary}`,
        body
    };
};

// Helper to execute HTTP request with raw buffer body
const requestRaw = (endpointPath, method = "POST", bodyBuffer = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpointPath}`);
        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method,
                headers: {
                    ...(bodyBuffer ? { "Content-Length": bodyBuffer.length } : {}),
                    ...headers
                }
            },
            (res) => {
                let rawData = "";
                res.on("data", (chunk) => (rawData += chunk));
                res.on("end", () => {
                    let json = null;
                    try {
                        json = JSON.parse(rawData);
                    } catch {
                        json = rawData;
                    }
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: json
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

async function runFileValidationTests() {
    console.log("=================================================");
    console.log("  MODULE 4 - LESSON 4.3: FILE VALIDATION TESTS  ");
    console.log("=================================================\n");

    let server;
    let passed = 0;
    let failed = 0;

    const cleanupUserIds = [];
    const createdFilesOnDisk = [];

    const assert = (condition, testName, details = "") => {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}: ${details}`);
            failed++;
        }
    };

    try {
        await testDatabaseConnection();

        await new Promise((resolve) => {
            server = app.listen(PORT, "127.0.0.1", () => {
                resolve();
            });
        });

        // 1. Authenticate a test user
        const userEmail = `validation_tester_${Date.now()}@example.com`;
        const testUser = await registerUser({
            fullName: "Validation Tester",
            email: userEmail,
            password: "Password123!",
            confirmPassword: "Password123!"
        });
        cleanupUserIds.push(testUser.id);

        const token = generateToken({ userId: testUser.id, email: testUser.email, roleId: 2 });
        const authCookie = `token=${token}; csrfToken=valid-csrf-token`;
        const authHeaders = {
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        };

        // --- TEST 1: Valid PDF is accepted (HTTP 201) ---
        const validPdf = createValidPdfBuffer("Senior Backend Engineer Resume");
        const { contentType: ct1, body: b1 } = createMultipartPayload(
            "resume",
            "john_doe_resume.pdf",
            "application/pdf",
            validPdf
        );
        const res1 = await requestRaw("/api/resumes/upload", "POST", b1, {
            "Content-Type": ct1,
            ...authHeaders
        });
        assert(
            res1.status === 201 &&
            res1.body?.success === true &&
            res1.body?.data?.documentType === "pdf" &&
            res1.body?.data?.pageCount === 1,
            "Case 1: Valid PDF accepted with HTTP 201",
            JSON.stringify(res1.body)
        );
        if (res1.body?.data?.fileName) {
            createdFilesOnDisk.push(path.join(UPLOAD_DIR, res1.body.data.fileName));
        }

        // --- TEST 2: Valid DOCX is accepted (HTTP 201) ---
        const validDocx = createValidDocxBuffer("Fullstack Developer Resume Experience");
        const { contentType: ct2, body: b2 } = createMultipartPayload(
            "resume",
            "jane_dev_resume.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            validDocx
        );
        const res2 = await requestRaw("/api/resumes/upload", "POST", b2, {
            "Content-Type": ct2,
            ...authHeaders
        });
        assert(
            res2.status === 201 &&
            res2.body?.success === true &&
            res2.body?.data?.documentType === "docx",
            "Case 2: Valid DOCX accepted with HTTP 201",
            JSON.stringify(res2.body)
        );
        if (res2.body?.data?.fileName) {
            createdFilesOnDisk.push(path.join(UPLOAD_DIR, res2.body.data.fileName));
        }

        // --- TEST 3: JPG renamed as PDF is rejected (HTTP 400) ---
        const fakeJpgPdf = createValidJpgBuffer();
        const { contentType: ct3, body: b3 } = createMultipartPayload(
            "resume",
            "avatar.pdf",
            "application/pdf",
            fakeJpgPdf
        );
        const res3 = await requestRaw("/api/resumes/upload", "POST", b3, {
            "Content-Type": ct3,
            ...authHeaders
        });
        assert(
            res3.status === 400 &&
            res3.body?.success === false &&
            (res3.body?.message?.includes("not match") || res3.body?.message?.includes("Invalid PDF header signature")),
            "Case 3: JPG renamed as PDF rejected with HTTP 400",
            JSON.stringify(res3.body)
        );

        // --- TEST 4: PNG renamed as DOCX is rejected (HTTP 400) ---
        const fakePngDocx = createValidPngBuffer();
        const { contentType: ct4, body: b4 } = createMultipartPayload(
            "resume",
            "screenshot.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            fakePngDocx
        );
        const res4 = await requestRaw("/api/resumes/upload", "POST", b4, {
            "Content-Type": ct4,
            ...authHeaders
        });
        assert(
            res4.status === 400 &&
            res4.body?.success === false &&
            (res4.body?.message?.includes("not match") || res4.body?.message?.includes("Invalid DOCX signature")),
            "Case 4: PNG renamed as DOCX rejected with HTTP 400",
            JSON.stringify(res4.body)
        );

        // --- TEST 5: Invalid PDF magic bytes rejected ---
        const invalidMagicPdf = Buffer.from("NOTPDF-1.4\nSome invalid stream data %%EOF");
        const { contentType: ct5, body: b5 } = createMultipartPayload(
            "resume",
            "bad_magic.pdf",
            "application/pdf",
            invalidMagicPdf
        );
        const res5 = await requestRaw("/api/resumes/upload", "POST", b5, {
            "Content-Type": ct5,
            ...authHeaders
        });
        assert(
            res5.status === 400 &&
            res5.body?.success === false &&
            res5.body?.message?.includes("Invalid PDF header signature"),
            "Case 5: Invalid PDF magic bytes rejected with HTTP 400",
            JSON.stringify(res5.body)
        );

        // --- TEST 6: Invalid ZIP archive rejected ---
        const invalidZip = Buffer.from("PK\x03\x04Truncated and corrupted central directory");
        const { contentType: ct6, body: b6 } = createMultipartPayload(
            "resume",
            "corrupt_archive.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            invalidZip
        );
        const res6 = await requestRaw("/api/resumes/upload", "POST", b6, {
            "Content-Type": ct6,
            ...authHeaders
        });
        assert(
            res6.status === 400 &&
            res6.body?.success === false &&
            res6.body?.message?.includes("DOCX archive"),
            "Case 6: Invalid ZIP archive rejected with HTTP 400",
            JSON.stringify(res6.body)
        );

        // --- TEST 7: ZIP file missing [Content_Types].xml rejected ---
        const missingContentTypesZip = createZipBuffer([
            { name: "word/document.xml", content: "<w:document></w:document>" }
        ]);
        const { contentType: ct7, body: b7 } = createMultipartPayload(
            "resume",
            "missing_content_types.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            missingContentTypesZip
        );
        const res7 = await requestRaw("/api/resumes/upload", "POST", b7, {
            "Content-Type": ct7,
            ...authHeaders
        });
        assert(
            res7.status === 400 &&
            res7.body?.success === false &&
            res7.body?.message?.includes("[Content_Types].xml"),
            "Case 7: ZIP file missing [Content_Types].xml rejected with HTTP 400",
            JSON.stringify(res7.body)
        );

        // --- TEST 8: ZIP file missing word/document.xml rejected ---
        const missingDocXmlZip = createZipBuffer([
            { name: "[Content_Types].xml", content: "<Types></Types>" }
        ]);
        const { contentType: ct8, body: b8 } = createMultipartPayload(
            "resume",
            "missing_doc_xml.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            missingDocXmlZip
        );
        const res8 = await requestRaw("/api/resumes/upload", "POST", b8, {
            "Content-Type": ct8,
            ...authHeaders
        });
        assert(
            res8.status === 400 &&
            res8.body?.success === false &&
            res8.body?.message?.includes("word/document.xml"),
            "Case 8: ZIP file missing word/document.xml rejected with HTTP 400",
            JSON.stringify(res8.body)
        );

        // --- TEST 9: Corrupted PDF rejected ---
        const corruptPdf = Buffer.from("%PDF-1.4\n1 0 obj\nBroken Catalog without valid stream or trailer");
        const { contentType: ct9, body: b9 } = createMultipartPayload(
            "resume",
            "corrupt_structure.pdf",
            "application/pdf",
            corruptPdf
        );
        const res9 = await requestRaw("/api/resumes/upload", "POST", b9, {
            "Content-Type": ct9,
            ...authHeaders
        });
        assert(
            res9.status === 400 &&
            res9.body?.success === false &&
            (res9.body?.message?.includes("Corrupted") || res9.body?.message?.includes("PDF")),
            "Case 9: Corrupted PDF rejected with HTTP 400",
            JSON.stringify(res9.body)
        );

        // --- TEST 10: Empty PDF (0 bytes) rejected ---
        const emptyPdf = Buffer.alloc(0);
        const { contentType: ct10, body: b10 } = createMultipartPayload(
            "resume",
            "empty.pdf",
            "application/pdf",
            emptyPdf
        );
        const res10 = await requestRaw("/api/resumes/upload", "POST", b10, {
            "Content-Type": ct10,
            ...authHeaders
        });
        assert(
            res10.status === 400 &&
            res10.body?.success === false &&
            res10.body?.message?.includes("empty"),
            "Case 10: Empty PDF rejected with HTTP 400",
            JSON.stringify(res10.body)
        );

        // --- TEST 11: Empty DOCX (0 bytes) rejected ---
        const emptyDocx = Buffer.alloc(0);
        const { contentType: ct11, body: b11 } = createMultipartPayload(
            "resume",
            "empty.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            emptyDocx
        );
        const res11 = await requestRaw("/api/resumes/upload", "POST", b11, {
            "Content-Type": ct11,
            ...authHeaders
        });
        assert(
            res11.status === 400 &&
            res11.body?.success === false &&
            res11.body?.message?.includes("empty"),
            "Case 11: Empty DOCX rejected with HTTP 400",
            JSON.stringify(res11.body)
        );

        // --- TEST 12: MIME type mismatch rejected ---
        const { contentType: ct12, body: b12 } = createMultipartPayload(
            "resume",
            "test_mismatch.pdf",
            "text/plain", // Incorrect declared MIME
            validPdf
        );
        const res12 = await requestRaw("/api/resumes/upload", "POST", b12, {
            "Content-Type": ct12,
            ...authHeaders
        });
        assert(
            res12.status === 400 &&
            res12.body?.success === false,
            "Case 12: MIME type mismatch rejected with HTTP 400",
            JSON.stringify(res12.body)
        );

        // --- TEST 13: Extension mismatch rejected ---
        const { contentType: ct13, body: b13 } = createMultipartPayload(
            "resume",
            "script.exe",
            "application/octet-stream",
            Buffer.from("MZ Executable binary")
        );
        const res13 = await requestRaw("/api/resumes/upload", "POST", b13, {
            "Content-Type": ct13,
            ...authHeaders
        });
        assert(
            res13.status === 400 &&
            res13.body?.success === false &&
            res13.body?.message?.includes("Only PDF and DOCX"),
            "Case 13: Extension mismatch rejected with HTTP 400",
            JSON.stringify(res13.body)
        );

        // --- TEST 14: Oversized file rejected (> 5 MB) ---
        const oversizedBuf = Buffer.alloc(5.2 * 1024 * 1024, "A");
        const { contentType: ct14, body: b14 } = createMultipartPayload(
            "resume",
            "huge_resume.pdf",
            "application/pdf",
            oversizedBuf
        );
        const res14 = await requestRaw("/api/resumes/upload", "POST", b14, {
            "Content-Type": ct14,
            ...authHeaders
        });
        assert(
            res14.status === 413,
            "Case 14: Oversized file rejected with HTTP 413",
            `Received: ${res14.status}`
        );

        // --- TEST 15: Excessive ZIP entry count rejected (> 500 entries) ---
        const excessiveEntries = [];
        for (let i = 0; i < 505; i++) {
            excessiveEntries.push({ name: `folder/file_${i}.txt`, content: "test" });
        }
        excessiveEntries.push({ name: "[Content_Types].xml", content: "<Types></Types>" });
        excessiveEntries.push({ name: "word/document.xml", content: "<w:document></w:document>" });
        const bombEntriesZip = createZipBuffer(excessiveEntries);
        const { contentType: ct15, body: b15 } = createMultipartPayload(
            "resume",
            "zipbomb_entries.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            bombEntriesZip
        );
        const res15 = await requestRaw("/api/resumes/upload", "POST", b15, {
            "Content-Type": ct15,
            ...authHeaders
        });
        assert(
            res15.status === 400 &&
            res15.body?.success === false &&
            res15.body?.message?.includes("entry limit"),
            "Case 15: Excessive ZIP entry count rejected with HTTP 400",
            JSON.stringify(res15.body)
        );

        // --- TEST 16: Excessive uncompressed ZIP size rejected (> 25 MB) ---
        // Deflate compresses highly repetitive buffers compactly (e.g. 26 MB of spaces to ~26 KB)
        const hugeText = Buffer.alloc(26 * 1024 * 1024, 0x20); // 26 MB
        const bombSizeZip = createZipBuffer([
            { name: "[Content_Types].xml", content: "<Types></Types>" },
            { name: "word/document.xml", content: "<w:document></w:document>" },
            { name: "word/huge.xml", content: hugeText }
        ]);
        const { contentType: ct16, body: b16 } = createMultipartPayload(
            "resume",
            "zipbomb_size.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            bombSizeZip
        );
        const res16 = await requestRaw("/api/resumes/upload", "POST", b16, {
            "Content-Type": ct16,
            ...authHeaders
        });
        assert(
            res16.status === 400 &&
            res16.body?.success === false &&
            (res16.body?.message?.includes("uncompressed size") || res16.body?.message?.includes("compression ratio") || res16.body?.message?.includes("ZIP bomb")),
            "Case 16: Excessive uncompressed ZIP size rejected with HTTP 400",
            JSON.stringify(res16.body)
        );

        // --- TEST 17: Path traversal archive entry rejected ---
        const traversalZip = createZipBuffer([
            { name: "[Content_Types].xml", content: "<Types></Types>" },
            { name: "word/document.xml", content: "<w:document></w:document>" },
            { name: "word/../../evil.xml", content: "<malicious></malicious>" }
        ]);
        const { contentType: ct17, body: b17 } = createMultipartPayload(
            "resume",
            "traversal.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            traversalZip
        );
        const res17 = await requestRaw("/api/resumes/upload", "POST", b17, {
            "Content-Type": ct17,
            ...authHeaders
        });
        assert(
            res17.status === 400 &&
            res17.body?.success === false &&
            (res17.body?.message?.includes("Dangerous or malformed entry path") || res17.body?.message?.includes("relative path")),
            "Case 17: Path traversal archive entry rejected with HTTP 400",
            JSON.stringify(res17.body)
        );

        // --- TEST 18: Invalid staged file is deleted from disk ---
        // Verify disk files before and after invalid upload
        const filesBefore = fs.readdirSync(UPLOAD_DIR);
        const { contentType: ct18, body: b18 } = createMultipartPayload(
            "resume",
            "will_fail.pdf",
            "application/pdf",
            Buffer.from("NOT_A_VALID_PDF_DATA")
        );
        await requestRaw("/api/resumes/upload", "POST", b18, {
            "Content-Type": ct18,
            ...authHeaders
        });
        const filesAfter = fs.readdirSync(UPLOAD_DIR);
        assert(
            filesBefore.length === filesAfter.length,
            "Case 18: Invalid staged file is immediately deleted from private upload storage",
            `Files before: ${filesBefore.length}, after: ${filesAfter.length}`
        );

        // --- TEST 19: Valid file remains available in private staging storage ---
        const { contentType: ct19, body: b19 } = createMultipartPayload(
            "resume",
            "persisted_resume.pdf",
            "application/pdf",
            validPdf
        );
        const res19 = await requestRaw("/api/resumes/upload", "POST", b19, {
            "Content-Type": ct19,
            ...authHeaders
        });
        const savedFileName = res19.body?.data?.fileName;
        const fileExistsOnDisk = savedFileName && fs.existsSync(path.join(UPLOAD_DIR, savedFileName));
        assert(
            fileExistsOnDisk,
            "Case 19: Valid file remains available in private upload directory for next lesson",
            `File ${savedFileName} exists: ${fileExistsOnDisk}`
        );
        if (savedFileName) {
            createdFilesOnDisk.push(path.join(UPLOAD_DIR, savedFileName));
        }

        // --- TEST 20: Unauthenticated upload is rejected (HTTP 401) ---
        const { contentType: ct20, body: b20 } = createMultipartPayload(
            "resume",
            "unauth.pdf",
            "application/pdf",
            validPdf
        );
        const res20 = await requestRaw("/api/resumes/upload", "POST", b20, {
            "Content-Type": ct20
            // No auth cookie or CSRF header
        });
        assert(
            res20.status === 401 && res20.body?.success === false,
            "Case 20: Unauthenticated upload is rejected with HTTP 401",
            `Received: ${res20.status}`
        );

        // --- TEST 21: Existing valid upload workflow still works ---
        const { contentType: ct21, body: b21 } = createMultipartPayload(
            "resume",
            "workflow_verified.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            validDocx
        );
        const res21 = await requestRaw("/api/resumes/upload", "POST", b21, {
            "Content-Type": ct21,
            ...authHeaders
        });
        assert(
            res21.status === 201 &&
            res21.body?.success === true &&
            res21.body?.data?.originalName === "workflow_verified.docx" &&
            res21.body?.data?.fileName &&
            !res21.body?.data?.path, // Absolute paths must NOT be exposed
            "Case 21: Existing valid upload workflow works and internal paths are strictly omitted",
            JSON.stringify(res21.body)
        );
        if (res21.body?.data?.fileName) {
            createdFilesOnDisk.push(path.join(UPLOAD_DIR, res21.body.data.fileName));
        }

    } catch (err) {
        console.error("Test execution error:", err);
        failed++;
    } finally {
        console.log("\nCleaning up test artifacts and records...");
        // Cleanup test users and their resumes
        for (const uid of cleanupUserIds) {
            try {
                await db.execute("DELETE FROM resumes WHERE user_id = ?", [uid]);
                await db.execute("DELETE FROM users WHERE user_id = ?", [uid]);
            } catch (cleanupErr) {
                console.error("Error cleaning test user:", cleanupErr.message);
            }
        }

        // Cleanup created files on disk
        for (const fpath of createdFilesOnDisk) {
            try {
                if (fs.existsSync(fpath)) {
                    fs.unlinkSync(fpath);
                }
            } catch (cleanupErr) {
                console.error("Error cleaning test file:", cleanupErr.message);
            }
        }

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await db.end();
        console.log("Cleanup completed.\n");
    }

    console.log("-------------------------------------------------");
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log("-------------------------------------------------\n");

    if (failed > 0) {
        process.exit(1);
    }
}

runFileValidationTests();
