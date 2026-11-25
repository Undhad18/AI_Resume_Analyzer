import http from "http";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";

const PORT = 5057;
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
    console.log("   AI RESUME ANALYZER - JWT & PROTECTED ROUTES   ");
    console.log("=================================================\n");

    await testDatabaseConnection();

    // Start ephemeral test server
    const server = await new Promise((resolve) => {
        const s = app.listen(PORT, "127.0.0.1", () => resolve(s));
    });

    const cleanupUserIds = [];
    const cleanupResumeIds = [];
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
        const testPassword = "PasswordSecure123!";

        // 1. Setup User A (active user)
        const userA = await registerUser({
            fullName: "User Alpha",
            email: `user.alpha.${uniqueSuffix}@example.com`,
            password: testPassword
        });
        cleanupUserIds.push(userA.id);

        // 2. Setup User B (active user)
        const userB = await registerUser({
            fullName: "User Beta",
            email: `user.beta.${uniqueSuffix}@example.com`,
            password: testPassword
        });
        cleanupUserIds.push(userB.id);

        // 3. Setup User C (suspended user)
        const suspendedHash = await bcrypt.hash(testPassword, 12);
        const [userCRes] = await db.execute(
            `INSERT INTO users (role_id, name, email, password_hash, account_status)
             VALUES (2, 'User Suspended', ?, ?, 'suspended')`,
            [`user.suspended.${uniqueSuffix}@example.com`, suspendedHash]
        );
        const userCId = userCRes.insertId;
        cleanupUserIds.push(userCId);

        // 4. Create a Resume owned by User B
        const [resumeBRes] = await db.execute(
            `INSERT INTO resumes (user_id, resume_title, candidate_name, status)
             VALUES (?, 'User B Confidential Resume', 'Candidate Beta', 'uploaded')`,
            [userB.id]
        );
        const resumeBId = resumeBRes.insertId;
        cleanupResumeIds.push(resumeBId);

        // Generate tokens for testing
        const validTokenA = generateToken({ userId: userA.id, email: userA.email, roleId: 2 });
        const validTokenC = generateToken({ userId: userCId, email: `user.suspended.${uniqueSuffix}@example.com`, roleId: 2 });

        // Expired token (expires in 0s, with negative offset)
        const expiredToken = jwt.sign(
            { sub: String(userA.id), email: userA.email },
            env.JWT_SECRET,
            { expiresIn: "1ms", issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE }
        );
        // Wait 50ms so it is definitively expired
        await new Promise((r) => setTimeout(r, 50));

        // Wrong signature token
        const wrongSigToken = jwt.sign(
            { sub: String(userA.id) },
            "completely_wrong_secret_key_that_is_at_least_32_chars!",
            { expiresIn: "15m", issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE }
        );

        // Wrong issuer token
        const wrongIssuerToken = jwt.sign(
            { sub: String(userA.id) },
            env.JWT_SECRET,
            { expiresIn: "15m", issuer: "unauthorized-issuer", audience: env.JWT_AUDIENCE }
        );

        // Wrong audience token
        const wrongAudienceToken = jwt.sign(
            { sub: String(userA.id) },
            env.JWT_SECRET,
            { expiresIn: "15m", issuer: env.JWT_ISSUER, audience: "wrong-audience" }
        );

        // -------------------------------------------------------------
        // Case 1: Request without authentication cookie -> HTTP 401
        // -------------------------------------------------------------
        const res1 = await request("/api/auth/me", "GET");
        assert(
            res1.status === 401 && res1.body?.success === false,
            "Case 1: Request without authentication cookie returns HTTP 401",
            JSON.stringify(res1.body)
        );

        // -------------------------------------------------------------
        // Case 2: Request with valid JWT cookie -> HTTP 200
        // -------------------------------------------------------------
        const res2 = await request("/api/auth/me", "GET", null, {
            Cookie: `token=${validTokenA}`
        });
        assert(
            res2.status === 200 &&
            res2.body?.success === true &&
            res2.body?.user?.id === userA.id,
            "Case 2: Request with valid JWT cookie returns HTTP 200 with authenticated user",
            JSON.stringify(res2.body)
        );

        // -------------------------------------------------------------
        // Case 3: Request with expired JWT -> HTTP 401
        // -------------------------------------------------------------
        const res3 = await request("/api/auth/me", "GET", null, {
            Cookie: `token=${expiredToken}`
        });
        assert(
            res3.status === 401 && res3.body?.success === false,
            "Case 3: Request with expired JWT returns HTTP 401",
            JSON.stringify(res3.body)
        );

        // -------------------------------------------------------------
        // Case 4: Request with invalid signature -> HTTP 401
        // -------------------------------------------------------------
        const res4 = await request("/api/auth/me", "GET", null, {
            Cookie: `token=${wrongSigToken}`
        });
        assert(
            res4.status === 401 && res4.body?.success === false,
            "Case 4: Request with invalid signature returns HTTP 401",
            JSON.stringify(res4.body)
        );

        // -------------------------------------------------------------
        // Case 5: Request with incorrect issuer or audience -> HTTP 401
        // -------------------------------------------------------------
        const res5a = await request("/api/auth/me", "GET", null, {
            Cookie: `token=${wrongIssuerToken}`
        });
        const res5b = await request("/api/auth/me", "GET", null, {
            Cookie: `token=${wrongAudienceToken}`
        });
        assert(
            res5a.status === 401 && res5b.status === 401,
            "Case 5: Request with incorrect issuer or audience returns HTTP 401",
            `Issuer: ${res5a.status}, Audience: ${res5b.status}`
        );

        // -------------------------------------------------------------
        // Case 6: Request with malformed token -> HTTP 401
        // -------------------------------------------------------------
        const res6 = await request("/api/auth/me", "GET", null, {
            Cookie: `token=not.a.valid.jwt.token`
        });
        assert(
            res6.status === 401 && res6.body?.success === false,
            "Case 6: Request with malformed token returns HTTP 401",
            JSON.stringify(res6.body)
        );

        // -------------------------------------------------------------
        // Case 7: Request from inactive or suspended account -> HTTP 403
        // -------------------------------------------------------------
        const res7 = await request("/api/auth/me", "GET", null, {
            Cookie: `token=${validTokenC}`
        });
        assert(
            res7.status === 403 &&
            res7.body?.success === false &&
            res7.body?.message?.toLowerCase().includes("suspended"),
            "Case 7: Suspended account token rejected with HTTP 403 Forbidden",
            JSON.stringify(res7.body)
        );

        // -------------------------------------------------------------
        // Case 8: GET /api/auth/me with valid authentication -> Safe profile
        // -------------------------------------------------------------
        const res8 = await request("/api/auth/me", "GET", null, {
            Cookie: `token=${validTokenA}`
        });
        const userKeys = Object.keys(res8.body?.user || {});
        const hasForbidden = userKeys.some((k) =>
            ["password", "password_hash", "secret"].includes(k.toLowerCase())
        );
        assert(
            res8.status === 200 &&
            res8.body?.user?.fullName === "User Alpha" &&
            res8.body?.user?.email === userA.email &&
            !hasForbidden,
            "Case 8: GET /api/auth/me returns safe user profile without sensitive fields",
            JSON.stringify(res8.body)
        );

        // -------------------------------------------------------------
        // Case 9: GET /api/auth/me without authentication -> HTTP 401
        // -------------------------------------------------------------
        const res9 = await request("/api/auth/me", "GET");
        assert(
            res9.status === 401 && res9.body?.success === false,
            "Case 9: GET /api/auth/me without authentication returns HTTP 401",
            JSON.stringify(res9.body)
        );

        // -------------------------------------------------------------
        // Case 10: POST /api/auth/logout -> Authentication cookie cleared
        // -------------------------------------------------------------
        const res10 = await request("/api/auth/logout", "POST", {}, {
            Origin: env.CLIENT_URL,
            Cookie: `token=${validTokenA}`
        });
        const setCookie = res10.headers["set-cookie"] || [];
        const setCookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : String(setCookie);
        const clearsToken =
            setCookieStr.includes("token=;") ||
            setCookieStr.toLowerCase().includes("max-age=0") ||
            setCookieStr.toLowerCase().includes("expires=");
        assert(
            res10.status === 200 &&
            res10.body?.success === true &&
            clearsToken,
            "Case 10: POST /api/auth/logout clears the authentication cookie",
            `Set-Cookie: ${setCookieStr}`
        );

        // -------------------------------------------------------------
        // Case 11: User A attempts to access User B's private resource -> Access denied (403/404)
        // -------------------------------------------------------------
        const res11 = await request(`/api/resumes/${resumeBId}`, "GET", null, {
            Cookie: `token=${validTokenA}`
        });
        assert(
            (res11.status === 403 || res11.status === 404) && res11.body?.success === false,
            "Case 11: User A attempting to access User B's resume returns HTTP 403 Access Denied (preventing IDOR)",
            `Status: ${res11.status}, Body: ${JSON.stringify(res11.body)}`
        );

        // -------------------------------------------------------------
        // Case 12: Registration still works (regression check)
        // -------------------------------------------------------------
        const regEmail = `regression.reg.${uniqueSuffix}@example.com`;
        const res12 = await request("/api/auth/register", "POST", {
            fullName: "Reg User",
            email: regEmail,
            password: testPassword,
            confirmPassword: testPassword
        });
        assert(
            res12.status === 201 && res12.body?.success === true && res12.body?.user?.id,
            "Case 12: Registration API regression verified (HTTP 201)",
            JSON.stringify(res12.body)
        );
        if (res12.body?.user?.id) cleanupUserIds.push(res12.body.user.id);

        // -------------------------------------------------------------
        // Case 13: Login still works (regression check)
        // -------------------------------------------------------------
        const res13 = await request("/api/auth/login", "POST", {
            email: regEmail,
            password: testPassword
        });
        assert(
            res13.status === 200 && res13.body?.success === true && res13.body?.user?.id,
            "Case 13: Login API regression verified (HTTP 200)",
            JSON.stringify(res13.body)
        );

        // -------------------------------------------------------------
        // Case 14: CSRF protection works for cookie-authenticated state-changing requests
        // -------------------------------------------------------------
        // Subcase A: Request WITH auth cookie but WITHOUT trusted Origin or CSRF header -> 403 Forbidden
        const res14a = await request("/api/auth/logout", "POST", {}, {
            Origin: "http://malicious-attacker.com",
            Cookie: `token=${validTokenA}`
        });

        // Subcase B: Request WITH auth cookie and trusted Origin -> 200 OK
        const res14b = await request("/api/auth/logout", "POST", {}, {
            Origin: env.CLIENT_URL,
            Cookie: `token=${validTokenA}`
        });

        assert(
            res14a.status === 403 &&
            res14a.body?.message?.includes("CSRF") &&
            res14b.status === 200,
            "Case 14: CSRF protection blocks cross-origin requests (403) and allows trusted origin (200)",
            `Untrusted: ${res14a.status}, Trusted: ${res14b.status}`
        );

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log("-------------------------------------------------");

    } finally {
        // Clean up test records
        if (cleanupResumeIds.length > 0) {
            for (const rid of cleanupResumeIds) {
                await db.execute("DELETE FROM resumes WHERE resume_id = ?", [rid]);
            }
        }
        if (cleanupUserIds.length > 0) {
            for (const uid of cleanupUserIds) {
                await db.execute("DELETE FROM users WHERE user_id = ?", [uid]);
            }
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
