import http from "http";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import bcrypt from "bcrypt";

const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}/api/auth`;

// Helper for making JSON HTTP requests
const request = (path, method = "POST", data = null) => {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const url = new URL(`${BASE_URL}${path}`);

        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
                }
            },
            (res) => {
                let rawBody = "";
                res.on("data", (chunk) => (rawBody += chunk));
                res.on("end", () => {
                    let json = null;
                    try {
                        json = JSON.parse(rawBody);
                    } catch {
                        json = rawBody;
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
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
};

async function runTests() {
    console.log("=================================================");
    console.log("   AI RESUME ANALYZER - REGISTRATION API TESTS   ");
    console.log("=================================================\n");

    await testDatabaseConnection();

    // Start ephemeral test server
    const server = await new Promise((resolve) => {
        const s = app.listen(PORT, "127.0.0.1", () => resolve(s));
    });

    const createdUserIds = [];
    let passed = 0;
    let failed = 0;

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
        const uniqueSuffix = Date.now();
        const primaryEmail = `sarah.connor.${uniqueSuffix}@example.com`;
        const testPassword = "CyberDyne2026!";

        // -------------------------------------------------------------
        // Case 1: Valid registration -> HTTP 201
        // -------------------------------------------------------------
        const res1 = await request("/register", "POST", {
            fullName: "Sarah Connor",
            email: primaryEmail,
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            res1.status === 201 &&
            res1.body?.success === true &&
            res1.body?.user?.id &&
            res1.body?.user?.fullName === "Sarah Connor" &&
            res1.body?.user?.email === primaryEmail.toLowerCase(),
            "Case 1: Valid registration returns HTTP 201 with sanitized user",
            JSON.stringify(res1.body)
        );

        if (res1.body?.user?.id) {
            createdUserIds.push(res1.body.user.id);
        }

        // -------------------------------------------------------------
        // Case 2: Missing fullName -> HTTP 400
        // -------------------------------------------------------------
        const res2 = await request("/register", "POST", {
            email: `missing.name.${uniqueSuffix}@example.com`,
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            res2.status === 400 &&
            res2.body?.success === false &&
            Array.isArray(res2.body?.errors) &&
            res2.body.errors.some((e) => e.field === "fullName"),
            "Case 2: Missing fullName returns HTTP 400",
            JSON.stringify(res2.body)
        );

        // -------------------------------------------------------------
        // Case 3: Invalid email -> HTTP 400
        // -------------------------------------------------------------
        const res3 = await request("/register", "POST", {
            fullName: "Kyle Reese",
            email: "invalid-email-format",
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            res3.status === 400 &&
            res3.body?.success === false &&
            Array.isArray(res3.body?.errors) &&
            res3.body.errors.some((e) => e.field === "email"),
            "Case 3: Invalid email returns HTTP 400",
            JSON.stringify(res3.body)
        );

        // -------------------------------------------------------------
        // Case 4: Password shorter than policy -> HTTP 400
        // -------------------------------------------------------------
        const res4 = await request("/register", "POST", {
            fullName: "John Connor",
            email: `short.pass.${uniqueSuffix}@example.com`,
            password: "Sh1",
            confirmPassword: "Sh1"
        });

        assert(
            res4.status === 400 &&
            res4.body?.success === false &&
            Array.isArray(res4.body?.errors) &&
            res4.body.errors.some((e) => e.field === "password"),
            "Case 4: Password shorter than policy returns HTTP 400",
            JSON.stringify(res4.body)
        );

        // -------------------------------------------------------------
        // Case 5: Password confirmation mismatch -> HTTP 400
        // -------------------------------------------------------------
        const res5 = await request("/register", "POST", {
            fullName: "John Connor",
            email: `mismatch.${uniqueSuffix}@example.com`,
            password: testPassword,
            confirmPassword: "WrongPassword999!"
        });

        assert(
            res5.status === 400 &&
            res5.body?.success === false &&
            Array.isArray(res5.body?.errors) &&
            res5.body.errors.some((e) => e.field === "confirmPassword"),
            "Case 5: Password confirmation mismatch returns HTTP 400",
            JSON.stringify(res5.body)
        );

        // -------------------------------------------------------------
        // Case 6: Duplicate email -> HTTP 409
        // -------------------------------------------------------------
        const res6 = await request("/register", "POST", {
            fullName: "Imposter Sarah",
            email: primaryEmail,
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            res6.status === 409 &&
            res6.body?.success === false &&
            res6.body?.message?.toLowerCase().includes("already exists"),
            "Case 6: Duplicate email returns HTTP 409",
            JSON.stringify(res6.body)
        );

        // -------------------------------------------------------------
        // Case 7: Same email with different letter casing -> rejected as duplicate (409)
        // -------------------------------------------------------------
        const upperCasedEmail = primaryEmail.toUpperCase();
        const res7 = await request("/register", "POST", {
            fullName: "Sarah Connor Uppercase",
            email: upperCasedEmail,
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            res7.status === 409 &&
            res7.body?.success === false,
            "Case 7: Case-insensitive duplicate email returns HTTP 409",
            JSON.stringify(res7.body)
        );

        // -------------------------------------------------------------
        // Case 8: Database unavailable -> Safe HTTP 500 response
        // -------------------------------------------------------------
        // Simulate DB failure by querying with a broken SQL mock or invalid route error
        const mockError = new Error("Connection lost: The server closed the connection.");
        // We verify that errorMiddleware safely transforms 500 errors
        const mockReq = {};
        let capturedStatus = 0;
        let capturedJson = null;
        const mockRes = {
            status: (s) => {
                capturedStatus = s;
                return mockRes;
            },
            json: (j) => {
                capturedJson = j;
                return mockRes;
            }
        };

        const { errorMiddleware } = await import("../middleware/errorMiddleware.js");
        errorMiddleware(mockError, mockReq, mockRes, () => {});

        assert(
            capturedStatus === 500 &&
            capturedJson?.success === false &&
            capturedJson?.message === "Internal server error" &&
            !JSON.stringify(capturedJson).includes("Connection lost"),
            "Case 8: Database unavailable returns safe HTTP 500 without leaking stack or raw errors",
            JSON.stringify(capturedJson)
        );

        // -------------------------------------------------------------
        // Case 9: SQL injection-like input -> Handled safely via parameterized query
        // -------------------------------------------------------------
        const sqliName = "Robert'); DROP TABLE users;--";
        const sqliEmail = `sqli.${uniqueSuffix}@example.com`;
        const res9 = await request("/register", "POST", {
            fullName: sqliName,
            email: sqliEmail,
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            res9.status === 201 &&
            res9.body?.user?.fullName === sqliName,
            "Case 9: SQL injection-like input safely escaped and stored as literal data",
            JSON.stringify(res9.body)
        );

        if (res9.body?.user?.id) {
            createdUserIds.push(res9.body.user.id);
        }

        // Verify users table is intact
        const [tables] = await db.query("SHOW TABLES LIKE 'users'");
        assert(
            tables.length === 1,
            "Case 9 Verification: users table remains intact after injection attempt"
        );

        // -------------------------------------------------------------
        // Case 10: Verify database password storage
        // -------------------------------------------------------------
        const [dbRows] = await db.execute(
            "SELECT user_id, name, email, password_hash FROM users WHERE user_id = ?",
            [res1.body.user.id]
        );

        const storedHash = dbRows[0]?.password_hash || "";
        const isBcrypt = storedHash.startsWith("$2b$12$") || storedHash.startsWith("$2a$12$");
        const isNotPlain = storedHash !== testPassword;
        const matchesBcrypt = await bcrypt.compare(testPassword, storedHash);

        assert(
            isBcrypt && isNotPlain && matchesBcrypt,
            "Case 10: Stored password in database is a bcrypt hash (factor 12), never plain text"
        );

        // -------------------------------------------------------------
        // Case 11: Verify response safety
        // -------------------------------------------------------------
        const responseKeys = Object.keys(res1.body);
        const userKeys = Object.keys(res1.body.user);
        const forbiddenKeys = ["password", "confirmPassword", "password_hash", "jwt", "token", "secret"];
        const hasForbiddenInRoot = responseKeys.some((k) => forbiddenKeys.includes(k.toLowerCase()));
        const hasForbiddenInUser = userKeys.some((k) => forbiddenKeys.includes(k.toLowerCase()));

        assert(
            !hasForbiddenInRoot && !hasForbiddenInUser,
            "Case 11: Response completely omits passwords, hashes, and secrets"
        );

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log("-------------------------------------------------");

    } finally {
        // Clean up test records
        if (createdUserIds.length > 0) {
            console.log(`Cleaning up test user records: [${createdUserIds.join(", ")}]...`);
            for (const uid of createdUserIds) {
                await db.execute("DELETE FROM users WHERE user_id = ?", [uid]);
            }
            console.log("Cleanup completed.");
        }

        server.close();
        await db.end();
    }

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
