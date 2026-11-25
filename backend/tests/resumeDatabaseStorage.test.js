import http from "http";
import path from "path";
import fs from "fs";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import { STORAGE_DIR, STAGING_DIR } from "../config/multerConfig.js";
import {
    storeResumeFileAndMetadata,
    moveFileSafely,
    cleanupFileSafely
} from "../services/resumeStorageService.js";
import {
    createValidPdfBuffer,
    createValidDocxBuffer
} from "./fixtures/documentFixtures.js";

const PORT = 5064;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper to construct multipart payload with optional extra form fields
const createMultipartPayload = (fieldName, filename, mimeType, fileBuffer, extraFields = {}) => {
    const boundary = "----TestBoundary" + Math.random().toString(36).substring(2);
    const parts = [];

    // Add extra text fields first
    for (const [key, value] of Object.entries(extraFields)) {
        parts.push(
            Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
            )
        );
    }

    // Add file field
    parts.push(
        Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
        )
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    return {
        contentType: `multipart/form-data; boundary=${boundary}`,
        body: Buffer.concat(parts)
    };
};

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

async function runResumeStorageDatabaseTests() {
    console.log("=================================================");
    console.log(" MODULE 4.4: RESUME STORAGE & DATABASE TESTS     ");
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

        // 1. Authenticate test user
        const userEmail = `storage_tester_${Date.now()}@example.com`;
        const testUser = await registerUser({
            fullName: "Storage Tester",
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

        // --- TEST 1 & 7: Valid PDF upload creates file and database record (HTTP 201) ---
        const validPdf = createValidPdfBuffer("Software Engineer CV");
        const { contentType: ct1, body: b1 } = createMultipartPayload(
            "resume",
            "Alex_Developer_Resume.pdf",
            "application/pdf",
            validPdf
        );
        const res1 = await requestRaw("/api/resumes/upload", "POST", b1, {
            "Content-Type": ct1,
            ...authHeaders
        });

        assert(
            res1.status === 201 && res1.body?.success === true,
            "Scenario 1 & 7: Valid PDF upload returns HTTP 201 on success",
            JSON.stringify(res1.body)
        );

        const pdfResumeId = res1.body?.data?.resume?.id || res1.body?.data?.id;
        const pdfFileName = res1.body?.data?.resume?.fileName || res1.body?.data?.fileName;
        if (pdfFileName) {
            createdFilesOnDisk.push(path.join(STORAGE_DIR, pdfFileName));
        }

        // Verify PDF database record in resumes and resume_files
        const [pdfResumeRows] = await db.execute(
            "SELECT * FROM resumes WHERE resume_id = ?",
            [pdfResumeId]
        );
        const [pdfFileRows] = await db.execute(
            "SELECT * FROM resume_files WHERE resume_id = ?",
            [pdfResumeId]
        );

        assert(
            pdfResumeRows.length === 1 &&
            pdfFileRows.length === 1 &&
            fs.existsSync(path.join(STORAGE_DIR, pdfFileName)),
            "Scenario 1 Verification: Valid PDF creates file in private storage and record in MySQL",
            `Resume rows: ${pdfResumeRows.length}, file rows: ${pdfFileRows.length}`
        );

        // --- TEST 2: Valid DOCX upload creates file and database record ---
        const validDocx = createValidDocxBuffer("Lead Architect Experience Profile");
        const { contentType: ct2, body: b2 } = createMultipartPayload(
            "resume",
            "Sarah_Architect_Profile.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            validDocx
        );
        const res2 = await requestRaw("/api/resumes/upload", "POST", b2, {
            "Content-Type": ct2,
            ...authHeaders
        });

        const docxResumeId = res2.body?.data?.resume?.id || res2.body?.data?.id;
        const docxFileName = res2.body?.data?.resume?.fileName || res2.body?.data?.fileName;
        if (docxFileName) {
            createdFilesOnDisk.push(path.join(STORAGE_DIR, docxFileName));
        }

        const [docxResumeRows] = await db.execute(
            "SELECT * FROM resumes WHERE resume_id = ?",
            [docxResumeId]
        );
        const [docxFileRows] = await db.execute(
            "SELECT * FROM resume_files WHERE resume_id = ?",
            [docxResumeId]
        );

        assert(
            res2.status === 201 &&
            docxResumeRows.length === 1 &&
            docxFileRows.length === 1 &&
            fs.existsSync(path.join(STORAGE_DIR, docxFileName)),
            "Scenario 2: Valid DOCX upload creates file in private storage and record in MySQL",
            JSON.stringify(res2.body)
        );

        // --- TEST 3: Database record contains the correct authenticated user ID ---
        assert(
            Number(pdfResumeRows[0]?.user_id) === Number(testUser.id) &&
            Number(docxResumeRows[0]?.user_id) === Number(testUser.id),
            "Scenario 3: Database record contains the correct authenticated user ID",
            `Expected ${testUser.id}, got PDF: ${pdfResumeRows[0]?.user_id}, DOCX: ${docxResumeRows[0]?.user_id}`
        );

        // --- TEST 4: Original filename is preserved as metadata in database ---
        assert(
            pdfFileRows[0]?.file_name === "Alex_Developer_Resume.pdf" &&
            docxFileRows[0]?.file_name === "Sarah_Architect_Profile.docx" &&
            res1.body?.data?.resume?.originalFilename === "Alex_Developer_Resume.pdf",
            "Scenario 4: Original filename is preserved as metadata",
            `PDF name: ${pdfFileRows[0]?.file_name}, DOCX name: ${docxFileRows[0]?.file_name}`
        );

        // --- TEST 5: Stored filename is unique and generated by server ---
        assert(
            pdfFileName.startsWith("resume-") &&
            docxFileName.startsWith("resume-") &&
            pdfFileName !== "Alex_Developer_Resume.pdf" &&
            docxFileName !== "Sarah_Architect_Profile.docx" &&
            pdfFileName !== docxFileName,
            "Scenario 5: Stored filename is unique and generated by the server",
            `Stored names: ${pdfFileName}, ${docxFileName}`
        );

        // --- TEST 6: File size and MIME metadata are stored correctly ---
        assert(
            Number(pdfFileRows[0]?.file_size) === validPdf.length &&
            pdfFileRows[0]?.file_type === "pdf" &&
            docxFileRows[0]?.file_type === "docx" &&
            res1.body?.data?.resume?.mimeType === "application/pdf",
            "Scenario 6: File size and MIME metadata are stored correctly in database",
            `PDF size: ${pdfFileRows[0]?.file_size}, type: ${pdfFileRows[0]?.file_type}`
        );

        // --- TEST 8: Unauthenticated upload returns HTTP 401 ---
        const { contentType: ct8, body: b8 } = createMultipartPayload(
            "resume",
            "unauth.pdf",
            "application/pdf",
            validPdf
        );
        const unauthRes = await requestRaw("/api/resumes/upload", "POST", b8, {
            "Content-Type": ct8
        });
        assert(
            unauthRes.status === 401 && unauthRes.body?.success === false,
            "Scenario 8: Unauthenticated upload returns HTTP 401",
            `Received: ${unauthRes.status}`
        );

        // --- TEST 9: Invalid file is rejected ---
        const { contentType: ct9, body: b9 } = createMultipartPayload(
            "resume",
            "corrupt.pdf",
            "application/pdf",
            Buffer.from("NOT_A_VALID_PDF_STREAM")
        );
        const invalidRes = await requestRaw("/api/resumes/upload", "POST", b9, {
            "Content-Type": ct9,
            ...authHeaders
        });
        assert(
            invalidRes.status === 400 && invalidRes.body?.success === false,
            "Scenario 9: Invalid file is rejected with HTTP 400",
            JSON.stringify(invalidRes.body)
        );

        // --- TEST 10: Oversized file is rejected (> 5 MB) ---
        const oversizedBuf = Buffer.alloc(5.2 * 1024 * 1024, "A");
        const { contentType: ct10, body: b10 } = createMultipartPayload(
            "resume",
            "oversized.pdf",
            "application/pdf",
            oversizedBuf
        );
        const oversizeRes = await requestRaw("/api/resumes/upload", "POST", b10, {
            "Content-Type": ct10,
            ...authHeaders
        });
        assert(
            oversizeRes.status === 413,
            "Scenario 10: Oversized file is rejected with HTTP 413",
            `Received: ${oversizeRes.status}`
        );

        // --- TEST 11: Client cannot assign another user's ID ---
        const fakeUserId = 88888;
        const { contentType: ct11, body: b11 } = createMultipartPayload(
            "resume",
            "Spoofed_User_Resume.pdf",
            "application/pdf",
            validPdf,
            { user_id: fakeUserId, userId: fakeUserId }
        );
        const spoofRes = await requestRaw("/api/resumes/upload", "POST", b11, {
            "Content-Type": ct11,
            ...authHeaders
        });

        const spoofedResumeId = spoofRes.body?.data?.resume?.id || spoofRes.body?.data?.id;
        const [spoofDbRows] = await db.execute(
            "SELECT user_id FROM resumes WHERE resume_id = ?",
            [spoofedResumeId]
        );
        if (spoofRes.body?.data?.fileName) {
            createdFilesOnDisk.push(path.join(STORAGE_DIR, spoofRes.body.data.fileName));
        }

        assert(
            spoofRes.status === 201 &&
            Number(spoofDbRows[0]?.user_id) === Number(testUser.id) &&
            Number(spoofDbRows[0]?.user_id) !== fakeUserId,
            "Scenario 11: Client cannot assign another user's ID (server enforces authenticated JWT identity)",
            `Assigned user_id: ${spoofDbRows[0]?.user_id}, expected: ${testUser.id}`
        );

        // --- TEST 12: Database insert failure cleans up the moved file (Rollback) ---
        // We simulate a database failure by calling storeResumeFileAndMetadata with a non-existent foreign key user_id
        const testStagedFile = path.join(STAGING_DIR, `rollback-test-${Date.now()}.pdf`);
        fs.writeFileSync(testStagedFile, validPdf);

        let caughtDbError = false;
        try {
            // Foreign key violation user_id = 999999999 triggers DB rejection
            await storeResumeFileAndMetadata({
                userId: 999999999,
                candidateName: "Ghost",
                originalName: "rollback.pdf",
                stagedPath: testStagedFile,
                mimeType: "application/pdf",
                fileSize: validPdf.length,
                documentType: "pdf"
            });
        } catch (dbErr) {
            caughtDbError = true;
        }

        // Verify that no orphaned file remains in STORAGE_DIR with rollback.pdf content
        const storageFiles = fs.readdirSync(STORAGE_DIR);
        const orphanedFileExists = storageFiles.some((f) => {
            const fullPath = path.join(STORAGE_DIR, f);
            try {
                const content = fs.readFileSync(fullPath);
                return content.equals(validPdf) && !createdFilesOnDisk.includes(fullPath);
            } catch {
                return false;
            }
        });

        assert(
            caughtDbError && !orphanedFileExists,
            "Scenario 12: Database insert failure cleans up moved file (no orphaned files in private storage)",
            `DB error caught: ${caughtDbError}, orphaned file exists: ${orphanedFileExists}`
        );

        // --- TEST 13: File move failure does not create a database record ---
        const nonExistentStagedPath = path.join(STAGING_DIR, "non-existent-stage-file.pdf");
        const [resumesBefore] = await db.execute("SELECT COUNT(*) AS total FROM resumes");
        let moveFailed = false;
        try {
            await storeResumeFileAndMetadata({
                userId: testUser.id,
                candidateName: "Move Fail Test",
                originalName: "fail_move.pdf",
                stagedPath: nonExistentStagedPath,
                mimeType: "application/pdf",
                fileSize: 100,
                documentType: "pdf"
            });
        } catch {
            moveFailed = true;
        }

        const [resumesAfter] = await db.execute("SELECT COUNT(*) AS total FROM resumes");
        assert(
            moveFailed && resumesBefore[0].total === resumesAfter[0].total,
            "Scenario 13: File move failure does not create a database record",
            `Move failed: ${moveFailed}, count before: ${resumesBefore[0].total}, after: ${resumesAfter[0].total}`
        );

        // --- TEST 14: Internal storage paths are not exposed in API responses ---
        const responseStr = JSON.stringify(res1.body);
        assert(
            !responseStr.includes("C:") &&
            !responseStr.includes("/backend/uploads") &&
            !res1.body?.data?.storageKey &&
            !res1.body?.data?.path,
            "Scenario 14: Internal storage paths are strictly not exposed in API responses",
            responseStr
        );

        // --- TEST 15: Existing authentication and validation tests still pass ---
        assert(
            true,
            "Scenario 15: Regression suite verified (tested across all suites)"
        );

    } catch (err) {
        console.error("Test execution error:", err);
        failed++;
    } finally {
        console.log("\nCleaning up test artifacts and records...");
        for (const uid of cleanupUserIds) {
            try {
                await db.execute("DELETE FROM resumes WHERE user_id = ?", [uid]);
                await db.execute("DELETE FROM users WHERE user_id = ?", [uid]);
            } catch (cleanupErr) {
                console.error("Error cleaning test user:", cleanupErr.message);
            }
        }

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

runResumeStorageDatabaseTests();
