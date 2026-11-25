import http from "http";
import path from "path";
import fs from "fs";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import { UPLOAD_DIR } from "../config/multerConfig.js";
import { createValidPdfBuffer, createValidDocxBuffer } from "./fixtures/documentFixtures.js";

const PORT = 5060;
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
const requestRaw = (path, method = "POST", bodyBuffer = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${path}`);
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

async function runUploadTests() {
    console.log("=================================================");
    console.log("   AI RESUME ANALYZER - RESUME UPLOAD API TESTS  ");
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

        // Create an authenticated test user
        const userEmail = `upload_tester_${Date.now()}@example.com`;
        const testUser = await registerUser({
            fullName: "Upload Tester",
            email: userEmail,
            password: "Password123!",
            confirmPassword: "Password123!"
        });
        cleanupUserIds.push(testUser.id);

        const token = generateToken({ userId: testUser.id, email: testUser.email, roleId: 2 });
        const authCookie = `token=${token}; csrfToken=valid-csrf-token`;

        // --- TEST 1: Unauthenticated upload is rejected (HTTP 401) ---
        const samplePdf = createValidPdfBuffer("Test Resume Content");
        const { contentType: ct1, body: b1 } = createMultipartPayload("resume", "resume.pdf", "application/pdf", samplePdf);
        const unauthRes = await requestRaw("/api/resumes/upload", "POST", b1, {
            "Content-Type": ct1
        });
        assert(
            unauthRes.status === 401 && unauthRes.body?.success === false,
            "Case 1: Unauthenticated request is rejected with HTTP 401 before Multer processes file",
            `Received: ${unauthRes.status}`
        );

        // --- TEST 2: Authenticated user uploads valid PDF (HTTP 201) ---
        const { contentType: ct2, body: b2 } = createMultipartPayload("resume", "developer_resume.pdf", "application/pdf", samplePdf);
        const pdfRes = await requestRaw("/api/resumes/upload", "POST", b2, {
            "Content-Type": ct2,
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        });

        assert(
            pdfRes.status === 201 &&
            pdfRes.body?.success === true &&
            pdfRes.body?.data?.originalName === "developer_resume.pdf" &&
            pdfRes.body?.data?.mimeType === "application/pdf" &&
            pdfRes.body?.data?.fileName.startsWith("resume-") &&
            pdfRes.body?.data?.fileName.endsWith(".pdf"),
            "Case 2: Authenticated user uploads valid PDF successfully (HTTP 201)",
            JSON.stringify(pdfRes.body)
        );

        if (pdfRes.body?.data?.fileName) {
            createdFilesOnDisk.push(path.join(UPLOAD_DIR, pdfRes.body.data.fileName));
        }

        // --- TEST 3: Authenticated user uploads valid DOCX (HTTP 201) ---
        const sampleDocx = createValidDocxBuffer("Senior Engineer Profile");
        const { contentType: ct3, body: b3 } = createMultipartPayload(
            "resume",
            "senior_engineer.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            sampleDocx
        );
        const docxRes = await requestRaw("/api/resumes/upload", "POST", b3, {
            "Content-Type": ct3,
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        });

        assert(
            docxRes.status === 201 &&
            docxRes.body?.success === true &&
            docxRes.body?.data?.originalName === "senior_engineer.docx" &&
            docxRes.body?.data?.fileName.endsWith(".docx"),
            "Case 3: Authenticated user uploads valid DOCX successfully (HTTP 201)",
            JSON.stringify(docxRes.body)
        );

        if (docxRes.body?.data?.fileName) {
            createdFilesOnDisk.push(path.join(UPLOAD_DIR, docxRes.body.data.fileName));
        }

        // --- TEST 4: No file selected in multipart request (HTTP 400) ---
        const emptyMultipart = Buffer.from("------TestBoundary\r\nContent-Disposition: form-data; name=\"dummy\"\r\n\r\nvalue\r\n------TestBoundary--\r\n");
        const noFileRes = await requestRaw("/api/resumes/upload", "POST", emptyMultipart, {
            "Content-Type": "multipart/form-data; boundary=----TestBoundary",
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        });
        assert(
            noFileRes.status === 400 && noFileRes.body?.success === false,
            "Case 4: Request with no file returns HTTP 400",
            JSON.stringify(noFileRes.body)
        );

        // --- TEST 5: JPG image file is rejected (HTTP 400) ---
        const fakeJpg = Buffer.from("\xFF\xD8\xFFMock JPG binary");
        const { contentType: ct5, body: b5 } = createMultipartPayload("resume", "photo.jpg", "image/jpeg", fakeJpg);
        const jpgRes = await requestRaw("/api/resumes/upload", "POST", b5, {
            "Content-Type": ct5,
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        });
        assert(
            jpgRes.status === 400 &&
            jpgRes.body?.success === false &&
            jpgRes.body?.message?.includes("Only PDF and DOCX"),
            "Case 5: Unsupported image format (.jpg) is rejected with HTTP 400",
            JSON.stringify(jpgRes.body)
        );

        // --- TEST 6: PNG image file is rejected (HTTP 400) ---
        const fakePng = Buffer.from("\x89PNGMock PNG binary");
        const { contentType: ct6, body: b6 } = createMultipartPayload("resume", "scanned.png", "image/png", fakePng);
        const pngRes = await requestRaw("/api/resumes/upload", "POST", b6, {
            "Content-Type": ct6,
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        });
        assert(
            pngRes.status === 400 &&
            pngRes.body?.success === false &&
            pngRes.body?.message?.includes("Only PDF and DOCX"),
            "Case 6: Unsupported image format (.png) is rejected with HTTP 400",
            JSON.stringify(pngRes.body)
        );

        // --- TEST 7: File exceeding 5 MB limit is rejected (HTTP 413) ---
        const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, "A"); // 5 MB + 1 KB
        const { contentType: ct7, body: b7 } = createMultipartPayload(
            "resume",
            "oversized_resume.pdf",
            "application/pdf",
            oversizedBuffer
        );
        const sizeRes = await requestRaw("/api/resumes/upload", "POST", b7, {
            "Content-Type": ct7,
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        });
        assert(
            sizeRes.status === 413 &&
            sizeRes.body?.success === false &&
            sizeRes.body?.message?.includes("5 MB limit"),
            "Case 7: Oversized file (> 5 MB) is rejected with HTTP 413 LIMIT_FILE_SIZE",
            JSON.stringify(sizeRes.body)
        );

        // --- TEST 8: Unexpected multipart field name (e.g. 'document') is rejected (HTTP 400) ---
        const { contentType: ct8, body: b8 } = createMultipartPayload(
            "document",
            "resume.pdf",
            "application/pdf",
            samplePdf
        );
        const fieldRes = await requestRaw("/api/resumes/upload", "POST", b8, {
            "Content-Type": ct8,
            Cookie: authCookie,
            "X-CSRF-Token": "valid-csrf-token"
        });
        assert(
            fieldRes.status === 400 &&
            fieldRes.body?.success === false &&
            fieldRes.body?.message?.includes("expected 'resume'"),
            "Case 8: Unexpected multipart field name is rejected with HTTP 400",
            JSON.stringify(fieldRes.body)
        );

        // --- TEST 9: Internal absolute file path is strictly NOT exposed in response payload ---
        const responseJsonStr = JSON.stringify(pdfRes.body);
        assert(
            !responseJsonStr.includes("C:") &&
            !responseJsonStr.includes("/backend/uploads") &&
            !pdfRes.body?.data?.path &&
            !pdfRes.body?.data?.destination,
            "Case 9: Internal absolute disk storage paths are strictly omitted from response",
            responseJsonStr
        );

        // --- TEST 10: Generated filenames are randomized and collision-resistant ---
        assert(
            pdfRes.body?.data?.fileName !== docxRes.body?.data?.fileName &&
            pdfRes.body?.data?.fileName !== "developer_resume.pdf",
            "Case 10: Generated filenames are randomized, unique, and never use raw client path",
            `${pdfRes.body?.data?.fileName} vs ${docxRes.body?.data?.fileName}`
        );

        // --- TEST 11: Stored file actually exists on disk in the private upload directory ---
        const pdfFileDiskPath = path.join(UPLOAD_DIR, pdfRes.body.data.fileName);
        assert(
            fs.existsSync(pdfFileDiskPath),
            "Case 11: Staged file exists on disk in private upload directory",
            pdfFileDiskPath
        );

    } catch (err) {
        console.error("Test execution failed:", err);
        failed++;
    } finally {
        console.log("Cleaning up test artifacts and records...");
        // Clean up created files on disk
        for (const filePath of createdFilesOnDisk) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch {
                // ignore
            }
        }

        // Clean up test users and their resumes
        try {
            if (cleanupUserIds.length) {
                await db.query(`DELETE FROM resumes WHERE user_id IN (?)`, [cleanupUserIds]);
                await db.query(`DELETE FROM users WHERE user_id IN (?)`, [cleanupUserIds]);
            }
            console.log("Cleanup completed.");
        } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
        }

        if (server) {
            server.close();
        }
        await db.end();

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log("-------------------------------------------------\n");

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

runUploadTests();
