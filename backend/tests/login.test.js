import http from "http";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import bcrypt from "bcrypt";

const PORT = 5056;
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
    console.log("      AI RESUME ANALYZER - LOGIN API TESTS       ");
    console.log("=================================================\n");

    await testDatabaseConnection();

    // Start ephemeral test server
    const server = await new Promise((resolve) => {
        const s = app.listen(PORT, "127.0.0.1", () => resolve(s));
    });

    const cleanupUserIds = [];
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
        const testEmail = `login.tester.${uniqueSuffix}@example.com`;
        const testPassword = "PasswordSecure123!";
        const wrongPassword = "IncorrectPassword999!";

        // 1. Setup: Register active test user
        const activeUser = await registerUser({
            fullName: "Alex Mercer",
            email: testEmail,
            password: testPassword
        });
        cleanupUserIds.push(activeUser.id);

        // 2. Setup: Create suspended test user
        const suspendedEmail = `suspended.tester.${uniqueSuffix}@example.com`;
        const suspendedHash = await bcrypt.hash(testPassword, 12);
        const [suspendedRes] = await db.execute(
            `INSERT INTO users (role_id, name, email, password_hash, account_status)
             VALUES (2, 'Suspended User', ?, ?, 'suspended')`,
            [suspendedEmail, suspendedHash]
        );
        cleanupUserIds.push(suspendedRes.insertId);

        // -------------------------------------------------------------
        // Case 1: Correct email and correct password -> HTTP 200
        // -------------------------------------------------------------
        const res1 = await request("/login", "POST", {
            email: testEmail,
            password: testPassword
        });

        assert(
            res1.status === 200 &&
            res1.body?.success === true &&
            res1.body?.message === "Login successful" &&
            res1.body?.user?.id === activeUser.id &&
            res1.body?.user?.fullName === "Alex Mercer" &&
            res1.body?.user?.email === testEmail.toLowerCase(),
            "Case 1: Correct credentials returns HTTP 200 with user profile",
            JSON.stringify(res1.body)
        );

        // -------------------------------------------------------------
        // Case 2: Correct email and wrong password -> HTTP 401
        // -------------------------------------------------------------
        const res2 = await request("/login", "POST", {
            email: testEmail,
            password: wrongPassword
        });

        assert(
            res2.status === 401 &&
            res2.body?.success === false &&
            res2.body?.message === "Invalid email or password",
            "Case 2: Correct email and wrong password returns HTTP 401 with generic message",
            JSON.stringify(res2.body)
        );

        // -------------------------------------------------------------
        // Case 3: Unknown email -> HTTP 401 (Same generic message)
        // -------------------------------------------------------------
        const res3 = await request("/login", "POST", {
            email: `unknown.user.${uniqueSuffix}@example.com`,
            password: testPassword
        });

        assert(
            res3.status === 401 &&
            res3.body?.success === false &&
            res3.body?.message === "Invalid email or password",
            "Case 3: Unknown email returns identical HTTP 401 generic message (prevents enumeration)",
            JSON.stringify(res3.body)
        );

        // -------------------------------------------------------------
        // Case 4: Missing email -> HTTP 400
        // -------------------------------------------------------------
        const res4 = await request("/login", "POST", {
            password: testPassword
        });

        assert(
            res4.status === 400 &&
            res4.body?.success === false &&
            Array.isArray(res4.body?.errors) &&
            res4.body.errors.some((e) => e.field === "email"),
            "Case 4: Missing email returns HTTP 400 with validation error",
            JSON.stringify(res4.body)
        );

        // -------------------------------------------------------------
        // Case 5: Missing password -> HTTP 400
        // -------------------------------------------------------------
        const res5 = await request("/login", "POST", {
            email: testEmail
        });

        assert(
            res5.status === 400 &&
            res5.body?.success === false &&
            Array.isArray(res5.body?.errors) &&
            res5.body.errors.some((e) => e.field === "password"),
            "Case 5: Missing password returns HTTP 400 with validation error",
            JSON.stringify(res5.body)
        );

        // -------------------------------------------------------------
        // Case 6: Invalid email format -> HTTP 400
        // -------------------------------------------------------------
        const res6 = await request("/login", "POST", {
            email: "not-an-email-at-all",
            password: testPassword
        });

        assert(
            res6.status === 400 &&
            res6.body?.success === false &&
            Array.isArray(res6.body?.errors) &&
            res6.body.errors.some((e) => e.field === "email"),
            "Case 6: Invalid email format returns HTTP 400",
            JSON.stringify(res6.body)
        );

        // -------------------------------------------------------------
        // Case 7: Email with different letter casing -> HTTP 200 (Normalized)
        // -------------------------------------------------------------
        const upperCasedEmail = testEmail.toUpperCase();
        const res7 = await request("/login", "POST", {
            email: upperCasedEmail,
            password: testPassword
        });

        assert(
            res7.status === 200 &&
            res7.body?.success === true &&
            res7.body?.user?.email === testEmail.toLowerCase(),
            "Case 7: Case-insensitive email normalization authenticates successfully (HTTP 200)",
            JSON.stringify(res7.body)
        );

        // -------------------------------------------------------------
        // Case 8: Inactive or suspended account -> HTTP 403 (Access Denied)
        // -------------------------------------------------------------
        const res8 = await request("/login", "POST", {
            email: suspendedEmail,
            password: testPassword
        });

        assert(
            res8.status === 403 &&
            res8.body?.success === false &&
            res8.body?.message?.toLowerCase().includes("suspended"),
            "Case 8: Suspended account returns HTTP 403 Forbidden with safe account status message",
            JSON.stringify(res8.body)
        );

        // -------------------------------------------------------------
        // Case 9: Database unavailable -> Safe HTTP 500 response
        // -------------------------------------------------------------
        const mockDbError = new Error("PROTOCOL_CONNECTION_LOST: Server shut down unexpectedly");
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
        errorMiddleware(mockDbError, mockReq, mockRes, () => {});

        assert(
            capturedStatus === 500 &&
            capturedJson?.success === false &&
            capturedJson?.message === "Internal server error" &&
            !JSON.stringify(capturedJson).includes("PROTOCOL_CONNECTION_LOST"),
            "Case 9: Database failure safely masked to HTTP 500 without leaking SQL internals",
            JSON.stringify(capturedJson)
        );

        // -------------------------------------------------------------
        // Case 10: Response inspection -> No password or sensitive fields
        // -------------------------------------------------------------
        const responseKeys = Object.keys(res1.body);
        const userKeys = Object.keys(res1.body.user);
        const forbiddenKeys = ["password", "password_hash", "jwt_secret", "secret", "db_password"];
        const hasForbiddenInRoot = responseKeys.some((k) => forbiddenKeys.includes(k.toLowerCase()));
        const hasForbiddenInUser = userKeys.some((k) => forbiddenKeys.includes(k.toLowerCase()));

        assert(
            !hasForbiddenInRoot && !hasForbiddenInUser,
            "Case 10: Response payload strictly omits password, password_hash, and internal secrets"
        );

        // -------------------------------------------------------------
        // Case 11: Authentication cookie inspection
        // -------------------------------------------------------------
        const setCookieHeaders = res1.headers["set-cookie"];
        const cookieString = Array.isArray(setCookieHeaders) ? setCookieHeaders.join("; ") : setCookieHeaders || "";

        const hasTokenCookie = cookieString.includes("token=");
        const isHttpOnly = cookieString.toLowerCase().includes("httponly");
        const hasPath = cookieString.toLowerCase().includes("path=/");
        const hasSameSite = cookieString.toLowerCase().includes("samesite=lax");

        assert(
            hasTokenCookie && isHttpOnly && hasPath && hasSameSite,
            "Case 11: Session JWT issued via HttpOnly, SameSite=lax, path=/ cookie",
            `Cookie header: ${cookieString}`
        );

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log("-------------------------------------------------");

    } finally {
        // Clean up test records
        if (cleanupUserIds.length > 0) {
            console.log(`Cleaning up test user records: [${cleanupUserIds.join(", ")}]...`);
            for (const uid of cleanupUserIds) {
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
    console.error("Login test execution failed:", err);
    process.exit(1);
});
