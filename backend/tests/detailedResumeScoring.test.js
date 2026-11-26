import http from "http";
import assert from "assert";
import fs from "fs";
import path from "path";
import app from "../app.js";
import db, { testDatabaseConnection } from "../config/db.js";
import { registerUser } from "../services/authService.js";
import { generateToken } from "../utils/jwtHelper.js";
import { storeResumeFileAndMetadata } from "../services/resumeStorageService.js";
import { createValidPdfBuffer } from "./fixtures/documentFixtures.js";
import { STAGING_DIR, STORAGE_DIR } from "../config/multerConfig.js";
import {
    normalizeSkillName,
    categorizeSkill,
    evaluateSkills,
    evaluateEducation,
    evaluateExperience,
    calculateDetailedResumeScore,
    saveDetailedScoreRecord,
    runDetailedScoringWorkflow,
    getLatestDetailedScoreForResume
} from "../services/detailedResumeScoringService.js";
import {
    skillsScoreSchema,
    educationScoreSchema,
    experienceScoreSchema,
    detailedResumeScoreResponseSchema
} from "../validators/detailedScoreSchema.js";
import { calculateAtsScore } from "../services/atsScoringService.js";
import { calculateRuleBasedScore } from "../services/freeResumeAnalysisService.js";

const PORT = 5084;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;
let passCount = 0;
let failCount = 0;

const assertTest = (condition, message) => {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passCount++;
    } else {
        console.error(`[FAIL] ${message}`);
        failCount++;
        throw new Error(`Test failed: ${message}`);
    }
};

const requestApi = (path, method = "GET", body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                "x-csrf-token": "test-csrf-token",
                ...headers
            }
        };

        let requestBody = null;
        if (body && typeof body === "object" && !(body instanceof Buffer)) {
            requestBody = JSON.stringify(body);
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = Buffer.byteLength(requestBody);
        } else if (body instanceof Buffer) {
            requestBody = body;
            options.headers["Content-Length"] = body.length;
        }

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        if (requestBody) {
            req.write(requestBody);
        }
        req.end();
    });
};

const runAllDetailedScoringTests = async () => {
    console.log("=================================================");
    console.log("MODULE 6 LESSON 6.3: DETAILED RESUME SCORING TESTS");
    console.log("=================================================\n");

    const usersToClean = [];
    const resumesToClean = [];

    try {
        await testDatabaseConnection();

        if (!fs.existsSync(STAGING_DIR)) fs.mkdirSync(STAGING_DIR, { recursive: true });
        if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

        server = http.createServer(app);
        await new Promise((resolve) => server.listen(PORT, resolve));
        console.log(`Test server running on port ${PORT}\n`);

        // Setup test users
        const userA = await registerUser({
            fullName: "Detailed Score Candidate A",
            email: `score.user.a.${Date.now()}@example.com`,
            password: "Password123!Secure"
        });
        usersToClean.push(userA.id);
        const tokenA = generateToken({ userId: userA.id, id: userA.id, email: userA.email, name: "Candidate A" });
        const cookieA = `token=${tokenA}; csrfToken=test-csrf-token`;

        const userB = await registerUser({
            fullName: "Detailed Score Candidate B",
            email: `score.user.b.${Date.now()}@example.com`,
            password: "Password123!Secure"
        });
        usersToClean.push(userB.id);
        const tokenB = generateToken({ userId: userB.id, id: userB.id, email: userB.email, name: "Candidate B" });
        const cookieB = `token=${tokenB}; csrfToken=test-csrf-token`;

        // Upload a synthetic resume document for integration tests
        const pdfFilename = `stage-detailed-${Date.now()}.pdf`;
        const pdfStagingPath = path.join(STAGING_DIR, pdfFilename);
        fs.writeFileSync(pdfStagingPath, createValidPdfBuffer(
            "HARSHIL UNDHAD Full Stack Engineer email: harshil@example.com phone: 555-234-5678 " +
            "SKILLS: JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MySQL, Docker, Git, AWS. " +
            "EXPERIENCE: Senior Software Engineer at Tech Solutions Inc from 2022 to Present. Built microservices using Node.js and Express improving API response time by 40%. " +
            "EDUCATION: B.Tech in Computer Science from State University 2018 to 2022. " +
            "PROJECTS: AI Resume Platform built using React and Node.js."
        ));

        const uploadedResume = await storeResumeFileAndMetadata({
            userId: userA.id,
            candidateName: "Harshil Undhad",
            originalName: "Harshil_Undhad_Resume.pdf",
            stagedPath: pdfStagingPath,
            mimeType: "application/pdf",
            fileSize: 1024,
            documentType: "pdf"
        });
        const resumeIdA = uploadedResume.id;
        resumesToClean.push(resumeIdA);

        // =========================================================================
        // SKILLS TESTS (Tests 1 - 8)
        // =========================================================================
        console.log("--- GROUP 1: SKILLS SCORING TESTS ---");

        // Test 1: Skills detection
        const rawSkills = ["JavaScript", "React", "Node.js", "Docker", "PostgreSQL"];
        const eval1 = evaluateSkills({
            structuredResume: { skills: rawSkills, projects: [], experience: [] }
        });
        assertTest(eval1.normalizedSkills.length === 5, "Test 1: Skills detection identifies valid skills array");

        // Test 2: Duplicate skill normalization
        const dupSkills = ["react", "react.js", "ReactJS", "node", "Node.JS", "nodejs", "python", "py"];
        const eval2 = evaluateSkills({
            structuredResume: { skills: dupSkills, projects: [], experience: [] }
        });
        assertTest(
            eval2.normalizedSkills.includes("React") &&
            eval2.normalizedSkills.includes("Node.js") &&
            eval2.normalizedSkills.includes("Python") &&
            eval2.normalizedSkills.length === 3,
            "Test 2: Duplicate skill variations are normalized and deduplicated"
        );

        // Test 3: Skills organization
        assertTest(
            Object.keys(eval1.categorizedSkills).length >= 3 &&
            eval1.parameters.organization.rating >= 60,
            "Test 3: Skills are organized across distinct domain categories"
        );

        // Test 4: Evidence in projects
        const eval4 = evaluateSkills({
            structuredResume: {
                skills: ["React", "PostgreSQL", "Go"],
                projects: [{ title: "Web App", technologies: ["React", "PostgreSQL"], description: "Built with React and PostgreSQL" }],
                experience: []
            }
        });
        assertTest(
            eval4.evidenceSupportedSkills.includes("React") &&
            eval4.evidenceSupportedSkills.includes("PostgreSQL") &&
            eval4.listedOnlySkills.includes("Go"),
            "Test 4: Evidence in projects distinguishes supported vs listed-only skills"
        );

        // Test 5: Evidence in experience
        const eval5 = evaluateSkills({
            structuredResume: {
                skills: ["Python", "AWS", "Rust"],
                projects: [],
                experience: [{ role: "Engineer", company: "Cloud Corp", description: "Deployed Python backend on AWS infrastructure." }]
            }
        });
        assertTest(
            eval5.evidenceSupportedSkills.includes("Python") &&
            eval5.evidenceSupportedSkills.includes("AWS") &&
            eval5.listedOnlySkills.includes("Rust"),
            "Test 5: Evidence in work experience correctly identifies verified skills"
        );

        // Test 6: Missing skills information
        const eval6 = evaluateSkills({
            structuredResume: { skills: [], projects: [], experience: [] }
        });
        assertTest(
            eval6.rating === 0 && eval6.status === "not_evaluable",
            "Test 6: Missing skills section returns not_evaluable status and 0 rating"
        );

        // Test 7: Invalid skills data
        const eval7 = evaluateSkills({
            structuredResume: { skills: null, projects: null, experience: null }
        });
        assertTest(
            eval7.rating === 0 && Array.isArray(eval7.normalizedSkills),
            "Test 7: Null or invalid skills data handled gracefully without crashing"
        );

        // Test 8: Skills score calculation
        const skillsZodCheck = skillsScoreSchema.safeParse(eval1);
        assertTest(
            skillsZodCheck.success &&
            eval1.weight === 20 &&
            eval1.earnedPoints === Math.round(((eval1.rating / 100) * 20) * 10) / 10,
            "Test 8: Skills score calculation adheres to 20-point weight formula and Zod schema"
        );

        // =========================================================================
        // EDUCATION TESTS (Tests 9 - 15)
        // =========================================================================
        console.log("\n--- GROUP 2: EDUCATION SCORING TESTS ---");

        // Test 9: Complete education record
        const completeEdu = [{
            degree: "Bachelor of Technology",
            institution: "Stanford University",
            fieldOfStudy: "Computer Science",
            startDate: "2018",
            endDate: "2022",
            grade: "3.9 GPA"
        }];
        const evalEdu9 = evaluateEducation({ structuredResume: { education: completeEdu } });
        assertTest(
            evalEdu9.rating >= 90 && evalEdu9.status === "evaluated",
            "Test 9: Complete education record scores high across all 5 parameters"
        );

        // Test 10: Missing institution
        const missingInst = [{ degree: "B.Tech", institution: "", fieldOfStudy: "CS" }];
        const evalEdu10 = evaluateEducation({ structuredResume: { education: missingInst } });
        assertTest(
            evalEdu10.parameters.institutionInformation.rating === 0 &&
            evalEdu10.rating < evalEdu9.rating,
            "Test 10: Missing institution correctly penalizes institution parameter"
        );

        // Test 11: Missing graduation year
        const noYearEdu = [{ degree: "Bachelor of Science", institution: "City College", fieldOfStudy: "IT" }];
        const evalEdu11 = evaluateEducation({ structuredResume: { education: noYearEdu } });
        assertTest(
            evalEdu11.parameters.graduationDates.rating === 60 &&
            evalEdu11.findings.some(f => f.includes("evaluated neutrally")),
            "Test 11: Missing graduation year is evaluated neutrally without assuming non-completion"
        );

        // Test 12: Multiple education records
        const multiEdu = [
            { degree: "Master of Science", institution: "Georgia Tech", fieldOfStudy: "Computer Science", endDate: "2024" },
            { degree: "Bachelor of Engineering", institution: "State University", fieldOfStudy: "Software Engineering", endDate: "2022" }
        ];
        const evalEdu12 = evaluateEducation({ structuredResume: { education: multiEdu } });
        assertTest(
            evalEdu12.qualifications.length === 2 && evalEdu12.rating >= 95,
            "Test 12: Multiple education records handled and rewarded for comprehensive profile"
        );

        // Test 13: Different qualification formats
        const diplomaEdu = [{ degree: "Diploma in Web Technologies", institution: "Polytechnic Institute" }];
        const evalEdu13 = evaluateEducation({ structuredResume: { education: diplomaEdu } });
        assertTest(
            evalEdu13.parameters.qualificationDetails.rating === 100,
            "Test 13: Non-degree qualifications (diploma, certificates) evaluated objectively"
        );

        // Test 14: Invalid education data
        const evalEdu14 = evaluateEducation({ structuredResume: { education: null } });
        assertTest(
            evalEdu14.status === "not_evaluable" && evalEdu14.earnedPoints === 0,
            "Test 14: Null or empty education array results in 0 earned points and not_evaluable"
        );

        // Test 15: Education score calculation
        const eduZodCheck = educationScoreSchema.safeParse(evalEdu9);
        assertTest(
            eduZodCheck.success &&
            evalEdu9.weight === 10 &&
            evalEdu9.earnedPoints === Math.round(((evalEdu9.rating / 100) * 10) * 10) / 10,
            "Test 15: Education score calculation adheres to 10-point weight formula and Zod schema"
        );

        // =========================================================================
        // EXPERIENCE TESTS (Tests 16 - 24)
        // =========================================================================
        console.log("\n--- GROUP 3: EXPERIENCE SCORING TESTS ---");

        // Test 16: Complete work experience
        const completeExp = [{
            role: "Senior Software Engineer",
            company: "Acme Corp",
            startDate: "2021",
            endDate: "2024",
            isCurrent: false,
            description: "Led development of core billing API. Optimized query execution times by 45% and scaled system to 100,000 active users.",
            technologies: ["Node.js", "PostgreSQL", "Docker"]
        }];
        const evalExp16 = evaluateExperience({ structuredResume: { experience: completeExp, projects: [] } });
        assertTest(
            evalExp16.rating >= 80 && evalExp16.parameters.achievementImpactEvidence.rating === 75,
            "Test 16: Complete work experience evaluates responsibilities, metrics, and tech stack"
        );

        // Test 17: Multiple work experiences
        const multiExp = [
            completeExp[0],
            {
                role: "Software Developer",
                company: "Beta Systems",
                startDate: "2019",
                endDate: "2021",
                description: "Built customer facing dashboards using React. Reduced client load times by 30%.",
                technologies: ["React", "JavaScript"]
            }
        ];
        const evalExp17 = evaluateExperience({ structuredResume: { experience: multiExp, projects: [] } });
        assertTest(
            evalExp17.roles.length === 2 && evalExp17.parameters.achievementImpactEvidence.rating === 100,
            "Test 17: Multiple work experiences aggregate achievements and chronological context"
        );

        // Test 18: Missing job dates
        const noDatesExp = [{
            role: "Developer",
            company: "StartUp",
            description: "Developed web features.",
            technologies: ["Python"]
        }];
        const evalExp18 = evaluateExperience({ structuredResume: { experience: noDatesExp, projects: [] } });
        assertTest(
            evalExp18.parameters.timelineClarity.rating === 55,
            "Test 18: Missing employment dates penalized in timeline parameter without breaking"
        );

        // Test 19: Current employment
        const currentExp = [{
            role: "Tech Lead",
            company: "Current Corp",
            startDate: "2023",
            endDate: "Present",
            isCurrent: true,
            description: "Directing backend engineering team. Increased deployment frequency by 50%."
        }];
        const evalExp19 = evaluateExperience({ structuredResume: { experience: currentExp, projects: [] } });
        assertTest(
            evalExp19.roles[0].isCurrent === true && evalExp19.parameters.timelineClarity.rating === 100,
            "Test 19: Active current employment detected and timeline scored favorably"
        );

        // Test 20: Missing achievements
        const noMetricsExp = [{
            role: "QA Tester",
            company: "Quality Labs",
            startDate: "2022",
            endDate: "2023",
            description: "Responsible for writing manual test plans and attending daily standup meetings."
        }];
        const evalExp20 = evaluateExperience({ structuredResume: { experience: noMetricsExp, projects: [] } });
        assertTest(
            evalExp20.parameters.achievementImpactEvidence.rating === 45,
            "Test 20: Routine responsibilities lacking measurable metrics receive lower impact score"
        );

        // Test 21: Internship experience
        const internExp = [{
            role: "Software Engineering Intern",
            company: "Innovate Inc",
            startDate: "Summer 2023",
            endDate: "Fall 2023",
            description: "Contributed bug fixes to React frontend and wrote unit tests.",
            technologies: ["React", "Jest"]
        }];
        const evalExp21 = evaluateExperience({ structuredResume: { experience: internExp, projects: [] } });
        assertTest(
            evalExp21.roles[0].isInternship === true && evalExp21.rating > 0,
            "Test 21: Internships recognized as valid professional experience"
        );

        // Test 22: Fresher with academic projects (Fresher-Friendly Policy)
        const fresherWithProjects = {
            professionalSummary: "Computer Science graduate and passionate fresher seeking entry role.",
            experience: [],
            projects: [
                {
                    title: "E-Commerce Microservice",
                    description: "Built scalable order processing pipeline with Node.js and Redis, handling 500 requests/sec with 99.9% uptime.",
                    technologies: ["Node.js", "Redis", "Docker"]
                },
                {
                    title: "Portfolio Website",
                    description: "Developed responsive frontend in React and Tailwind CSS.",
                    technologies: ["React", "Tailwind CSS"]
                }
            ]
        };
        const evalExp22 = evaluateExperience({ structuredResume: fresherWithProjects });
        assertTest(
            evalExp22.fresherPolicyApplied === true &&
            evalExp22.rating >= 70 &&
            evalExp22.earnedPoints > 10,
            "Test 22: Fresher with practical projects receives fair experience rating via Fresher Policy"
        );

        // Test 23: Fresher with no work history and no projects
        const pureFresher = {
            professionalSummary: "Recent university graduate seeking opportunities.",
            experience: [],
            projects: []
        };
        const evalExp23 = evaluateExperience({ structuredResume: pureFresher });
        assertTest(
            evalExp23.status === "not_applicable_fresher" &&
            evalExp23.fresherPolicyApplied === true &&
            evalExp23.earnedPoints === 0,
            "Test 23: Fresher with no experience or projects marked not_applicable_fresher with policy note"
        );

        // Test 24: Experience score calculation
        const expZodCheck = experienceScoreSchema.safeParse(evalExp16);
        assertTest(
            expZodCheck.success &&
            evalExp16.weight === 20 &&
            evalExp16.earnedPoints === Math.round(((evalExp16.rating / 100) * 20) * 10) / 10,
            "Test 24: Experience score calculation adheres to 20-point weight formula and Zod schema"
        );

        // =========================================================================
        // INTEGRATION TESTS (Tests 25 - 33)
        // =========================================================================
        console.log("\n--- GROUP 4: INTEGRATION & REGRESSION TESTS ---");

        // Test 25: Detailed scores integrate with Lesson 6.1
        const composite = calculateDetailedResumeScore({
            structuredResume: {
                personalInfo: { email: "test@example.com", phone: "1234567890", location: "NYC" },
                professionalSummary: "Senior software engineer with 5 years building scalable web systems.",
                skills: ["JavaScript", "React", "Node.js", "PostgreSQL", "Docker", "Git", "AWS", "Redis"],
                experience: completeExp,
                education: completeEdu,
                projects: [{ title: "Platform", description: "Built microservices using Node.js.", technologies: ["Node.js"] }]
            },
            rawText: "Sample resume text",
            resumeId: resumeIdA,
            userId: userA.id
        });
        const masterZodCheck = detailedResumeScoreResponseSchema.safeParse(composite);
        assertTest(
            masterZodCheck.success &&
            composite.integratedOverallBreakdown.skills === composite.categories.skills.earnedPoints &&
            composite.integratedOverallBreakdown.experience === composite.categories.experience.earnedPoints &&
            composite.integratedOverallBreakdown.education === composite.categories.education.earnedPoints,
            "Test 25: Detailed scores integrate cleanly into Lesson 6.1 category breakdown"
        );

        // Test 26: No duplicate weight calculation
        const weights = [
            25, // contentQuality
            composite.categories.skills.weight, // 20
            composite.categories.experience.weight, // 20
            15, // projects
            composite.categories.education.weight, // 10
            10 // clarity
        ];
        assertTest(
            weights.length === 6 && weights.filter(w => w === 20).length === 2,
            "Test 26: No duplicate weight calculations detected; distinct category assignments"
        );

        // Test 27: Total weight remains 100
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        assertTest(totalWeight === 100, "Test 27: Total category weights sum exactly to 100 points");

        // Test 28: Database persistence
        const saveResult = await saveDetailedScoreRecord({
            userId: userA.id,
            resumeId: resumeIdA,
            detailedResult: composite
        });
        assertTest(
            saveResult && saveResult.skillsScore === composite.categories.skills.rating &&
            saveResult.educationScore === composite.categories.education.rating &&
            saveResult.experienceScore === composite.categories.experience.rating,
            "Test 28: Detailed score record persisted in MySQL resume_scores table"
        );

        // Test 29: Cross-user access rejection (IDOR security)
        const crossUserRes = await requestApi(
            `/api/resumes/${resumeIdA}/detailed-score`,
            "GET",
            null,
            { Cookie: cookieB, Authorization: `Bearer ${tokenB}` }
        );
        assertTest(
            crossUserRes.status === 403,
            "Test 29: Cross-user access rejection strictly blocks unauthorized tenants (HTTP 403)"
        );

        // Test 30: Free mode works without OpenAI
        const savedKey = process.env.OPENAI_API_KEY;
        delete process.env.OPENAI_API_KEY;
        try {
            const noKeyResult = calculateDetailedResumeScore({
                structuredResume: {
                    personalInfo: { email: "fresher@example.com" },
                    skills: ["JavaScript", "Python"],
                    education: diplomaEdu,
                    projects: fresherWithProjects.projects
                },
                resumeId: resumeIdA,
                userId: userA.id
            });
            assertTest(noKeyResult.overallScore > 0, "Test 30: Detailed scoring operates 100% locally with zero OpenAI dependency");
        } finally {
            if (savedKey) process.env.OPENAI_API_KEY = savedKey;
        }

        // Test 31: Existing ATS score still works
        const atsResult = calculateAtsScore({
            fileInfo: { fileType: "pdf", fileSize: 1024 },
            structuredResume: { personalInfo: { email: "test@example.com" }, skills: ["React", "Node"] },
            rawText: "Sample resume text with developed, engineered, and database keywords."
        });
        assertTest(atsResult.atsScore > 0, "Test 31: Existing ATS compatibility score (Lesson 6.2) functions without regression");

        // Test 32: Existing overall scoring still works
        const ruleBasedScore = calculateRuleBasedScore({
            personalInfo: { email: "test@example.com", phone: "1234567890" },
            skills: ["JavaScript", "React"],
            experience: [],
            education: completeEdu,
            projects: []
        });
        assertTest(ruleBasedScore.overallScore > 0, "Test 32: Existing overall rule-based score (Lesson 6.1) functions without regression");

        // Test 33: API endpoint integration
        const apiScoreRes = await requestApi(
            `/api/resumes/${resumeIdA}/detailed-score`,
            "POST",
            {},
            { Cookie: cookieA, Authorization: `Bearer ${tokenA}` }
        );
        assertTest(
            apiScoreRes.status === 200 &&
            apiScoreRes.body.success === true &&
            apiScoreRes.body.data.overallScore !== undefined,
            "Test 33: POST /api/resumes/:resumeId/detailed-score end-to-end API execution succeeds"
        );

        console.log("\n-------------------------------------------------");
        console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
        console.log("-------------------------------------------------\n");

    } finally {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }

        // Cleanup
        if (resumesToClean.length > 0) {
            await db.execute(`DELETE FROM resume_scores WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resume_analyses WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resume_files WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
            await db.execute(`DELETE FROM resumes WHERE resume_id IN (${resumesToClean.map(() => "?").join(",")})`, resumesToClean).catch(() => {});
        }
        if (usersToClean.length > 0) {
            await db.execute(`DELETE FROM users WHERE user_id IN (${usersToClean.map(() => "?").join(",")})`, usersToClean).catch(() => {});
        }
    }
};

runAllDetailedScoringTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Test execution failed:", err);
        process.exit(1);
    });
