import http from "http";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { env } from "../config/env.js";

const PORT = 5058;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Client simulation helper that tracks cookies and CSRF tokens across requests like Axios
class AxiosClientSimulator {
    constructor() {
        this.cookies = {};
    }

    setCookieFromHeaders(headers) {
        const setCookie = headers["set-cookie"];
        if (!setCookie) return;
        const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
        cookieArray.forEach((c) => {
            const parts = c.split(";")[0].split("=");
            const name = parts[0].trim();
            const value = parts.slice(1).join("=").trim();
            if (c.toLowerCase().includes("max-age=0") || c.toLowerCase().includes("expires=thu, 01 jan 1970")) {
                delete this.cookies[name];
            } else {
                this.cookies[name] = value;
            }
        });
    }

    getCookieHeader() {
        return Object.entries(this.cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
    }

    request(path, method = "GET", data = null, customHeaders = {}) {
        return new Promise((resolve, reject) => {
            const payload = data ? JSON.stringify(data) : null;
            const url = new URL(`${BASE_URL}${path}`);
            const cookieHeader = this.getCookieHeader();

            const headers = {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                Origin: env.CLIENT_URL,
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
                ...(this.cookies.csrfToken ? { "X-CSRF-Token": this.cookies.csrfToken } : {}),
                ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
                ...customHeaders
            };

            const req = http.request(
                {
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    method,
                    headers
                },
                (res) => {
                    this.setCookieFromHeaders(res.headers);
                    let raw = "";
                    res.on("data", (chunk) => (raw += chunk));
                    res.on("end", () => {
                        let json = null;
                        try {
                            json = JSON.parse(raw);
                        } catch {
                            json = raw;
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
    }
}

async function runTests() {
    console.log("=================================================");
    console.log("   MODULE 2 LESSON 2.5: FRONTEND AUTH TESTS     ");
    console.log("=================================================\n");

    await testDatabaseConnection();

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
        const testEmail = `frontend.user.${uniqueSuffix}@example.com`;
        const testPassword = "CyberDyne2026!";
        const client = new AxiosClientSimulator();

        // -------------------------------------------------------------
        // Scenario 1: User can register with valid data -> HTTP 201
        // -------------------------------------------------------------
        const regRes = await client.request("/api/auth/register", "POST", {
            fullName: "Sarah Connor",
            email: testEmail,
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            regRes.status === 201 &&
            regRes.body?.success === true &&
            regRes.body?.user?.fullName === "Sarah Connor" &&
            regRes.body?.user?.email === testEmail.toLowerCase(),
            "Scenario 1: User can register with valid data (HTTP 201)",
            JSON.stringify(regRes.body)
        );

        if (regRes.body?.user?.id) {
            cleanupUserIds.push(regRes.body.user.id);
        }

        // -------------------------------------------------------------
        // Scenario 2: Invalid registration data displays validation errors -> HTTP 400
        // -------------------------------------------------------------
        const invalidRegRes = await client.request("/api/auth/register", "POST", {
            fullName: "",
            email: "invalid-email",
            password: "short",
            confirmPassword: "mismatch"
        });

        assert(
            invalidRegRes.status === 400 &&
            invalidRegRes.body?.success === false &&
            Array.isArray(invalidRegRes.body?.errors) &&
            invalidRegRes.body.errors.length >= 3,
            "Scenario 2: Invalid registration data returns validation error list (HTTP 400)",
            JSON.stringify(invalidRegRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 3: Duplicate email displays a useful error -> HTTP 409
        // -------------------------------------------------------------
        const dupRegRes = await client.request("/api/auth/register", "POST", {
            fullName: "Sarah Connor Clone",
            email: testEmail,
            password: testPassword,
            confirmPassword: testPassword
        });

        assert(
            dupRegRes.status === 409 &&
            dupRegRes.body?.success === false &&
            dupRegRes.body?.message?.includes("already exists"),
            "Scenario 3: Duplicate email registration rejected with conflict message (HTTP 409)",
            JSON.stringify(dupRegRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 4: User can log in with valid credentials -> HTTP 200
        // -------------------------------------------------------------
        const loginRes = await client.request("/api/auth/login", "POST", {
            email: testEmail,
            password: testPassword
        });

        assert(
            loginRes.status === 200 &&
            loginRes.body?.success === true &&
            loginRes.body?.user?.fullName === "Sarah Connor" &&
            Boolean(client.cookies.token),
            "Scenario 4: User can log in with valid credentials (HTTP 200 and session cookie set)",
            JSON.stringify(loginRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 5: Wrong credentials display an error -> HTTP 401
        // -------------------------------------------------------------
        const wrongClient = new AxiosClientSimulator();
        const wrongLoginRes = await wrongClient.request("/api/auth/login", "POST", {
            email: testEmail,
            password: "IncorrectPassword123!"
        });

        assert(
            wrongLoginRes.status === 401 &&
            wrongLoginRes.body?.success === false &&
            wrongLoginRes.body?.message === "Invalid email or password",
            "Scenario 5: Wrong credentials return generic error (HTTP 401)",
            JSON.stringify(wrongLoginRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 6: Successful login updates AuthContext user data
        // -------------------------------------------------------------
        assert(
            loginRes.body?.user?.id &&
            loginRes.body?.user?.email === testEmail.toLowerCase(),
            "Scenario 6: Successful login provides complete verified user payload",
            JSON.stringify(loginRes.body?.user)
        );

        // -------------------------------------------------------------
        // Scenario 7: Browser refresh restores a valid session (GET /api/auth/me)
        // -------------------------------------------------------------
        const refreshRes = await client.request("/api/auth/me", "GET");

        assert(
            refreshRes.status === 200 &&
            refreshRes.body?.success === true &&
            refreshRes.body?.user?.email === testEmail.toLowerCase(),
            "Scenario 7: Session restored via GET /api/auth/me from HttpOnly cookie (HTTP 200)",
            JSON.stringify(refreshRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 8: Invalid or expired session redirects / returns 401
        // -------------------------------------------------------------
        const expiredClient = new AxiosClientSimulator();
        expiredClient.cookies.token = "malformed.or.expired.jwt.token";
        const expiredRes = await expiredClient.request("/api/auth/me", "GET");

        assert(
            expiredRes.status === 401 &&
            expiredRes.body?.success === false,
            "Scenario 8: Invalid/expired session rejected with HTTP 401",
            JSON.stringify(expiredRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 9: Unauthenticated user cannot access Dashboard / private endpoints
        // -------------------------------------------------------------
        const unauthClient = new AxiosClientSimulator();
        const unauthRes = await unauthClient.request("/api/auth/me", "GET");

        assert(
            unauthRes.status === 401,
            "Scenario 9: Unauthenticated request cannot access protected profile (HTTP 401)",
            JSON.stringify(unauthRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 10: Authenticated user can access private endpoints
        // -------------------------------------------------------------
        const authAccessRes = await client.request("/api/auth/me", "GET");

        assert(
            authAccessRes.status === 200 &&
            authAccessRes.body?.user?.fullName === "Sarah Connor",
            "Scenario 10: Authenticated user with session cookie accesses private profile (HTTP 200)",
            JSON.stringify(authAccessRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 11: Logout calls backend and clears session cookie
        // -------------------------------------------------------------
        const logoutRes = await client.request("/api/auth/logout", "POST");

        assert(
            logoutRes.status === 200 &&
            logoutRes.body?.success === true &&
            !client.cookies.token,
            "Scenario 11: Logout clears session cookie and confirms with HTTP 200",
            JSON.stringify(logoutRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 12: After logout, protected pages/endpoints are inaccessible
        // -------------------------------------------------------------
        const postLogoutRes = await client.request("/api/auth/me", "GET");

        assert(
            postLogoutRes.status === 401 &&
            postLogoutRes.body?.success === false,
            "Scenario 12: Post-logout request is denied with HTTP 401",
            JSON.stringify(postLogoutRes.body)
        );

        // -------------------------------------------------------------
        // Scenario 13: Login and Register navigation endpoints respond correctly
        // -------------------------------------------------------------
        const loginOptionsRes = await client.request("/api/auth/login", "OPTIONS");
        assert(
            loginOptionsRes.status === 204 || loginOptionsRes.status === 200,
            "Scenario 13: Auth endpoints support CORS preflight (OPTIONS)",
            `Status: ${loginOptionsRes.status}`
        );

        // -------------------------------------------------------------
        // Scenario 14: Existing application APIs (health) still work
        // -------------------------------------------------------------
        const healthRes = await client.request("/api/health", "GET");
        assert(
            healthRes.status === 200 &&
            healthRes.body?.success === true &&
            healthRes.body?.data?.database === "Connected",
            "Scenario 14: Existing health check API continues functioning flawlessly",
            JSON.stringify(healthRes.body)
        );

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log("-------------------------------------------------");

    } finally {
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
