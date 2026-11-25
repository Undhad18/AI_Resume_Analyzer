import http from "http";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";

const PORT = 5059;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper for making JSON HTTP requests
const request = (path, method = "GET", data = null, headers = {}) => {
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
                    ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
                    ...headers
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
    console.log("    AI RESUME ANALYZER - USER PROFILE TESTS      ");
    console.log("=================================================\n");

    let server;
    let passed = 0;
    let failed = 0;

    const cleanupUserIds = [];

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

        // 1. Create two test users (User A and User B)
        const userAEmail = `profile_user_a_${Date.now()}@example.com`;
        const userBEmail = `profile_user_b_${Date.now()}@example.com`;

        const userA = await registerUser({
            fullName: "Alice Developer",
            email: userAEmail,
            password: "Password123!",
            confirmPassword: "Password123!"
        });
        cleanupUserIds.push(userA.id);

        const userB = await registerUser({
            fullName: "Bob Engineer",
            email: userBEmail,
            password: "Password123!",
            confirmPassword: "Password123!"
        });
        cleanupUserIds.push(userB.id);

        const tokenA = generateToken({ userId: userA.id, email: userA.email, roleId: 2 });
        const tokenB = generateToken({ userId: userB.id, email: userB.email, roleId: 2 });

        // --- TEST 1: Unauthenticated profile request is rejected ---
        const unauthRes = await request("/api/users/profile", "GET");
        assert(
            unauthRes.status === 401 && unauthRes.body?.success === false,
            "Case 1: Unauthenticated GET /api/users/profile is rejected with HTTP 401",
            `Received: ${unauthRes.status}`
        );

        // --- TEST 2: Authenticated user can retrieve their profile ---
        const getProfileRes = await request("/api/users/profile", "GET", null, {
            Cookie: `token=${tokenA}`
        });
        assert(
            getProfileRes.status === 200 &&
            getProfileRes.body?.success === true &&
            getProfileRes.body?.data?.id === userA.id &&
            getProfileRes.body?.data?.fullName === "Alice Developer" &&
            getProfileRes.body?.data?.email === userAEmail.toLowerCase() &&
            getProfileRes.body?.data?.accountStatus === "active",
            "Case 2: Authenticated user retrieves their profile successfully (HTTP 200)",
            JSON.stringify(getProfileRes.body)
        );

        // --- TEST 3: Password hash is strictly omitted from profile response ---
        assert(
            getProfileRes.body?.data?.password === undefined &&
            getProfileRes.body?.data?.password_hash === undefined &&
            !JSON.stringify(getProfileRes.body).includes("hash"),
            "Case 3: Password and password_hash are completely absent from response",
            JSON.stringify(getProfileRes.body)
        );

        // --- TEST 4: Update full name successfully ---
        // Provide CSRF double-submit header for mutating PUT request
        const updateNameRes = await request(
            "/api/users/profile",
            "PUT",
            {
                fullName: "Alice Senior Developer",
                email: userAEmail
            },
            {
                Cookie: `token=${tokenA}; csrfToken=valid-csrf-token`,
                "X-CSRF-Token": "valid-csrf-token"
            }
        );
        assert(
            updateNameRes.status === 200 &&
            updateNameRes.body?.success === true &&
            updateNameRes.body?.data?.fullName === "Alice Senior Developer" &&
            updateNameRes.body?.data?.email === userAEmail.toLowerCase(),
            "Case 4: User updates their full name successfully (HTTP 200)",
            JSON.stringify(updateNameRes.body)
        );

        // --- TEST 5: Update email successfully ---
        const updatedEmailA = `alice_updated_${Date.now()}@example.com`;
        const updateEmailRes = await request(
            "/api/users/profile",
            "PUT",
            {
                fullName: "Alice Senior Developer",
                email: updatedEmailA
            },
            {
                Cookie: `token=${tokenA}; csrfToken=valid-csrf-token`,
                "X-CSRF-Token": "valid-csrf-token"
            }
        );
        assert(
            updateEmailRes.status === 200 &&
            updateEmailRes.body?.success === true &&
            updateEmailRes.body?.data?.email === updatedEmailA.toLowerCase(),
            "Case 5: User updates their email address successfully (HTTP 200)",
            JSON.stringify(updateEmailRes.body)
        );

        // --- TEST 6: User keeps existing email unchanged (no duplicate collision with self) ---
        const keepSameEmailRes = await request(
            "/api/users/profile",
            "PUT",
            {
                fullName: "Alice Senior Architect",
                email: updatedEmailA
            },
            {
                Cookie: `token=${tokenA}; csrfToken=valid-csrf-token`,
                "X-CSRF-Token": "valid-csrf-token"
            }
        );
        assert(
            keepSameEmailRes.status === 200 &&
            keepSameEmailRes.body?.success === true &&
            keepSameEmailRes.body?.data?.fullName === "Alice Senior Architect",
            "Case 6: Keeping the user's existing email causes no duplicate error (HTTP 200)",
            JSON.stringify(keepSameEmailRes.body)
        );

        // --- TEST 7: Duplicate email collision with another user returns HTTP 409 ---
        const duplicateEmailRes = await request(
            "/api/users/profile",
            "PUT",
            {
                fullName: "Alice Trying Bob's Email",
                email: userBEmail // User B's email
            },
            {
                Cookie: `token=${tokenA}; csrfToken=valid-csrf-token`,
                "X-CSRF-Token": "valid-csrf-token"
            }
        );
        assert(
            duplicateEmailRes.status === 409 &&
            duplicateEmailRes.body?.success === false &&
            duplicateEmailRes.body?.message?.includes("already in use"),
            "Case 7: Duplicate email collision returns HTTP 409 Conflict",
            JSON.stringify(duplicateEmailRes.body)
        );

        // --- TEST 8: Invalid email format is rejected with HTTP 400 ---
        const invalidEmailRes = await request(
            "/api/users/profile",
            "PUT",
            {
                fullName: "Alice Valid Name",
                email: "not-an-email"
            },
            {
                Cookie: `token=${tokenA}; csrfToken=valid-csrf-token`,
                "X-CSRF-Token": "valid-csrf-token"
            }
        );
        assert(
            invalidEmailRes.status === 400 &&
            invalidEmailRes.body?.success === false,
            "Case 8: Invalid email format is rejected with HTTP 400 Validation Error",
            JSON.stringify(invalidEmailRes.body)
        );

        // --- TEST 9: Empty full name is rejected with HTTP 400 ---
        const emptyNameRes = await request(
            "/api/users/profile",
            "PUT",
            {
                fullName: "   ",
                email: updatedEmailA
            },
            {
                Cookie: `token=${tokenA}; csrfToken=valid-csrf-token`,
                "X-CSRF-Token": "valid-csrf-token"
            }
        );
        assert(
            emptyNameRes.status === 400 &&
            emptyNameRes.body?.success === false,
            "Case 9: Empty full name is rejected with HTTP 400 Validation Error",
            JSON.stringify(emptyNameRes.body)
        );

        // --- TEST 10: Attempt to tamper with role_id or password via profile update is safely ignored ---
        const tamperRes = await request(
            "/api/users/profile",
            "PUT",
            {
                fullName: "Alice Normal User",
                email: updatedEmailA,
                roleId: 1, // Attempted privilege escalation to admin
                role_id: 1,
                password: "HackedPassword999!",
                account_status: "suspended"
            },
            {
                Cookie: `token=${tokenA}; csrfToken=valid-csrf-token`,
                "X-CSRF-Token": "valid-csrf-token"
            }
        );
        // Verify in database that role_id remained 2 and account_status remained active
        const [dbRows] = await db.execute(
            `SELECT role_id, account_status, password_hash FROM users WHERE user_id = ?`,
            [userA.id]
        );
        assert(
            tamperRes.status === 200 &&
            dbRows[0]?.role_id === 2 &&
            dbRows[0]?.account_status === "active",
            "Case 10: Role, password, and status fields cannot be modified via profile update",
            JSON.stringify(dbRows[0])
        );

        // --- TEST 11: Multi-tenant isolation - User A's update does not mutate User B ---
        const userBProfileRes = await request("/api/users/profile", "GET", null, {
            Cookie: `token=${tokenB}`
        });
        assert(
            userBProfileRes.status === 200 &&
            userBProfileRes.body?.data?.id === userB.id &&
            userBProfileRes.body?.data?.fullName === "Bob Engineer" &&
            userBProfileRes.body?.data?.email === userBEmail.toLowerCase(),
            "Case 11: Multi-tenant isolation verified: User B's profile remained completely unchanged",
            JSON.stringify(userBProfileRes.body)
        );

        // --- TEST 12: Session cookie is updated with refreshed token on profile update ---
        const setCookieHeader = updateEmailRes.headers["set-cookie"];
        const hasTokenCookie = setCookieHeader?.some((c) => c.startsWith("token="));
        assert(
            hasTokenCookie,
            "Case 12: Profile update returns refreshed session cookie with new token claims",
            JSON.stringify(setCookieHeader)
        );

    } catch (err) {
        console.error("Test execution failed with error:", err);
        failed++;
    } finally {
        console.log("Cleaning up test user records...");
        try {
            if (cleanupUserIds.length) {
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

runTests();
