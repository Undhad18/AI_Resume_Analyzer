import http from "http";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";

const PORT = 5058;
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
    console.log("   AI RESUME ANALYZER - DASHBOARD SUMMARY TESTS  ");
    console.log("=================================================\n");

    let server;
    let passed = 0;
    let failed = 0;

    const cleanupUserIds = [];
    const cleanupResumeIds = [];
    const cleanupAnalysisIds = [];
    const cleanupJobIds = [];

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

        // 1. Create two test users (User A and User B) to test multi-tenancy
        const userAEmail = `dash_user_a_${Date.now()}@example.com`;
        const userBEmail = `dash_user_b_${Date.now()}@example.com`;

        const userA = await registerUser({
            fullName: "User Alpha",
            email: userAEmail,
            password: "Password123!",
            confirmPassword: "Password123!"
        });
        cleanupUserIds.push(userA.id);

        const userB = await registerUser({
            fullName: "User Beta",
            email: userBEmail,
            password: "Password123!",
            confirmPassword: "Password123!"
        });
        cleanupUserIds.push(userB.id);

        const tokenA = generateToken({ userId: userA.id, email: userA.email, roleId: 2 });
        const tokenB = generateToken({ userId: userB.id, email: userB.email, roleId: 2 });

        // --- TEST 1: Unauthenticated request to /api/dashboard/summary is rejected ---
        const unauthRes = await request("/api/dashboard/summary", "GET");
        assert(
            unauthRes.status === 401 && unauthRes.body?.success === false,
            "Case 1: Unauthenticated request is rejected with HTTP 401",
            `Received: ${unauthRes.status}`
        );

        // --- TEST 2: New user with zero records returns accurate empty summary ---
        const emptySummaryRes = await request("/api/dashboard/summary", "GET", null, {
            Cookie: `token=${tokenA}`
        });

        assert(
            emptySummaryRes.status === 200 &&
            emptySummaryRes.body?.success === true &&
            emptySummaryRes.body?.data?.totalResumes === 0 &&
            emptySummaryRes.body?.data?.totalAnalyses === 0 &&
            emptySummaryRes.body?.data?.averageScore === null &&
            emptySummaryRes.body?.data?.totalJobMatches === 0 &&
            Array.isArray(emptySummaryRes.body?.data?.recentResumes) &&
            emptySummaryRes.body?.data?.recentResumes.length === 0 &&
            Array.isArray(emptySummaryRes.body?.data?.recentAnalyses) &&
            emptySummaryRes.body?.data?.recentAnalyses.length === 0,
            "Case 2: New user returns zero counts, null average score, and empty arrays",
            JSON.stringify(emptySummaryRes.body)
        );

        // --- Populate data for User A:
        // - Resume 1: completed, original file attached
        const [r1Result] = await db.execute(
            `INSERT INTO resumes (user_id, resume_title, candidate_name, status)
             VALUES (?, 'Frontend Dev Resume', 'User Alpha', 'completed')`,
            [userA.id]
        );
        const r1Id = r1Result.insertId;
        cleanupResumeIds.push(r1Id);

        await db.execute(
            `INSERT INTO resume_files (resume_id, file_name, file_path, file_type, file_size, file_purpose)
             VALUES (?, 'resume_alpha.pdf', '/secret/storage/path/resume_alpha.pdf', 'pdf', 104857, 'original')`,
            [r1Id]
        );

        // Analysis 1 for Resume 1: completed, score 80
        const [a1Result] = await db.execute(
            `INSERT INTO resume_analyses (resume_id, overall_score, analysis_status, ai_model)
             VALUES (?, 80.00, 'completed', 'gpt-4o')`,
            [r1Id]
        );
        const a1Id = a1Result.insertId;
        cleanupAnalysisIds.push(a1Id);

        await db.execute(
            `INSERT INTO resume_scores (analysis_id, overall_score, ats_score, skills_score)
             VALUES (?, 80.00, 85.00, 75.00)`,
            [a1Id]
        );

        // - Resume 2 for User A: completed
        const [r2Result] = await db.execute(
            `INSERT INTO resumes (user_id, resume_title, candidate_name, status)
             VALUES (?, 'Fullstack Resume', 'User Alpha', 'completed')`,
            [userA.id]
        );
        const r2Id = r2Result.insertId;
        cleanupResumeIds.push(r2Id);

        // Analysis 2 for Resume 2: completed, score 90
        const [a2Result] = await db.execute(
            `INSERT INTO resume_analyses (resume_id, overall_score, analysis_status, ai_model)
             VALUES (?, 90.00, 'completed', 'gpt-4o')`,
            [r2Id]
        );
        const a2Id = a2Result.insertId;
        cleanupAnalysisIds.push(a2Id);

        await db.execute(
            `INSERT INTO resume_scores (analysis_id, overall_score, ats_score, skills_score)
             VALUES (?, 90.00, 92.00, 88.00)`,
            [a2Id]
        );

        // Analysis 3 for Resume 2: FAILED analysis with score 50 (must be excluded from completed counts & average!)
        const [a3Result] = await db.execute(
            `INSERT INTO resume_analyses (resume_id, overall_score, analysis_status, ai_model)
             VALUES (?, 50.00, 'failed', 'gpt-4o')`,
            [r2Id]
        );
        cleanupAnalysisIds.push(a3Result.insertId);

        // - Resume 3 for User A: SOFT DELETED (deleted_at set) - must be ignored!
        const [r3Result] = await db.execute(
            `INSERT INTO resumes (user_id, resume_title, candidate_name, status, deleted_at)
             VALUES (?, 'Deleted Old Resume', 'User Alpha', 'uploaded', NOW())`,
            [userA.id]
        );
        cleanupResumeIds.push(r3Result.insertId);

        // Job match for Resume 1
        const [jobResult] = await db.execute(
            `INSERT INTO job_descriptions (user_id, job_title, job_description)
             VALUES (?, 'Senior React Dev', 'Experience with React and Tailwind')`,
            [userA.id]
        );
        const jobId = jobResult.insertId;
        cleanupJobIds.push(jobId);

        await db.execute(
            `INSERT INTO job_matches (resume_id, job_id, match_score)
             VALUES (?, ?, 87.50)`,
            [r1Id, jobId]
        );

        // --- Populate data for User B (to test isolation):
        // 3 resumes for User B
        for (let i = 1; i <= 3; i++) {
            const [bRes] = await db.execute(
                `INSERT INTO resumes (user_id, resume_title, candidate_name, status)
                 VALUES (?, ?, 'User Beta', 'completed')`,
                [userB.id, `User B Resume ${i}`]
            );
            cleanupResumeIds.push(bRes.insertId);
        }

        // --- TEST 3: User A's summary reflects accurate counts and averages ---
        const userASummaryRes = await request("/api/dashboard/summary", "GET", null, {
            Cookie: `token=${tokenA}`
        });

        const dataA = userASummaryRes.body?.data;
        assert(
            userASummaryRes.status === 200 &&
            dataA?.totalResumes === 2 && // 2 active resumes (soft-deleted one excluded)
            dataA?.totalAnalyses === 2 && // only completed analyses
            dataA?.averageScore === 85.0 && // (80 + 90) / 2 = 85.0 (failed score 50 excluded)
            dataA?.totalJobMatches === 1 &&
            dataA?.recentResumes?.length === 2 &&
            dataA?.recentAnalyses?.length === 3, // recentAnalyses lists history of recent attempts
            "Case 3: User A calculates exact metrics (2 resumes, 2 completed analyses, avg 85.0, 1 job match)",
            JSON.stringify(dataA)
        );

        // --- TEST 4: Soft-deleted resumes are excluded from recentResumes ---
        const deletedFound = dataA?.recentResumes?.some((r) => r.title === "Deleted Old Resume");
        assert(
            !deletedFound,
            "Case 4: Soft-deleted resumes are excluded from recentResumes",
            `Found deleted: ${deletedFound}`
        );

        // --- TEST 5: Sensitive internal file paths are strictly omitted from recentResumes ---
        const leakedPath = dataA?.recentResumes?.some((r) => r.filePath || JSON.stringify(r).includes("/secret/storage/path"));
        assert(
            !leakedPath,
            "Case 5: Server storage file paths are strictly omitted from response",
            JSON.stringify(dataA?.recentResumes)
        );

        // --- TEST 6: Multi-tenant isolation - User B cannot see User A's data ---
        const userBSummaryRes = await request("/api/dashboard/summary", "GET", null, {
            Cookie: `token=${tokenB}`
        });
        const dataB = userBSummaryRes.body?.data;

        assert(
            userBSummaryRes.status === 200 &&
            dataB?.totalResumes === 3 &&
            dataB?.totalAnalyses === 0 &&
            dataB?.averageScore === null &&
            dataB?.totalJobMatches === 0 &&
            dataB?.recentResumes?.length === 3 &&
            dataB?.recentResumes?.every((r) => r.title.startsWith("User B Resume")),
            "Case 6: Multi-tenant isolation verified: User B sees strictly their own 3 resumes and 0 from User A",
            JSON.stringify(dataB)
        );

    } catch (err) {
        console.error("Test execution failed with error:", err);
        failed++;
    } finally {
        // Clean up test records
        console.log("Cleaning up test records...");
        try {
            if (cleanupJobIds.length) {
                await db.query(`DELETE FROM job_matches WHERE job_id IN (?)`, [cleanupJobIds]);
                await db.query(`DELETE FROM job_descriptions WHERE job_id IN (?)`, [cleanupJobIds]);
            }
            if (cleanupAnalysisIds.length) {
                await db.query(`DELETE FROM resume_scores WHERE analysis_id IN (?)`, [cleanupAnalysisIds]);
                await db.query(`DELETE FROM resume_analyses WHERE analysis_id IN (?)`, [cleanupAnalysisIds]);
            }
            if (cleanupResumeIds.length) {
                await db.query(`DELETE FROM resume_files WHERE resume_id IN (?)`, [cleanupResumeIds]);
                await db.query(`DELETE FROM resumes WHERE resume_id IN (?)`, [cleanupResumeIds]);
            }
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
