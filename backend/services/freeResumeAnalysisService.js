import db from "../config/db.js";
import { getResumeFileForPreviewOrDownload, updateResumeExtractedText } from "./resumeStorageService.js";
import { extractTextFromPdf } from "./pdfExtractionService.js";
import { extractTextFromDocx } from "./docxExtractionService.js";
import { structureResumeContent } from "./resumeStructuringService.js";
import { completeResumeAnalysisZodSchema } from "../validators/resumeAnalysisSchema.js";
import { AnalysisWorkflowError } from "./resumeAnalysisService.js";

/**
 * Standard technical skill categorization dictionary for rule-based detection
 */
const SKILL_CATEGORIES = {
    "Programming Languages": [
        "javascript", "typescript", "python", "java", "c++", "c#", "c", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "dart", "r", "bash", "shell"
    ],
    "Frontend Technologies": [
        "react", "react.js", "reactjs", "vue", "vue.js", "vuejs", "angular", "next.js", "nextjs",
        "nuxt.js", "svelte", "html", "html5", "css", "css3", "tailwind", "tailwind css",
        "bootstrap", "redux", "zustand", "sass", "scss", "jquery", "vite", "webpack"
    ],
    "Backend Technologies": [
        "node.js", "nodejs", "node", "express", "express.js", "expressjs", "django", "flask",
        "fastapi", "spring", "spring boot", "asp.net", "laravel", "ruby on rails", "nestjs",
        "graphql", "rest", "rest api", "rest apis", "restful", "socket.io", "grpc"
    ],
    "Databases & Storage": [
        "mysql", "postgresql", "postgres", "mongodb", "redis", "sqlite", "oracle", "sql server",
        "cassandra", "dynamodb", "mariadb", "firebase", "supabase", "elasticsearch"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes",
        "ci/cd", "github actions", "gitlab ci", "jenkins", "terraform", "ansible", "nginx", "linux"
    ],
    "Developer Tools": [
        "git", "github", "gitlab", "bitbucket", "postman", "jira", "vs code", "vscode",
        "cursor", "antigravity", "figma", "npm", "yarn", "pnpm"
    ]
};

/**
 * Categorize a skill deterministically
 * @param {string} skill 
 * @returns {string} Category name
 */
export const categorizeSkill = (skill) => {
    const lower = skill.toLowerCase().trim();
    for (const [category, skillsList] of Object.entries(SKILL_CATEGORIES)) {
        if (skillsList.some((s) => s === lower || (s.length > 2 && (lower.includes(s) || s.includes(lower))))) {
            return category;
        }
    }
    return "Technical";
};

/**
 * Detect career level from structured resume data
 * @param {object} structured 
 * @returns {"Entry-Level / Fresher" | "Junior / Associate" | "Mid-Level" | "Senior / Lead"}
 */
export const detectCareerLevel = (structured) => {
    const expCount = structured.experience?.length || 0;
    const summary = (structured.professionalSummary || "").toLowerCase();
    const hasStudentKeywords = /student|fresher|graduate|intern|undergraduate|b\.tech|bachelor/i.test(summary);

    if (expCount === 0 || hasStudentKeywords) {
        return "Entry-Level / Fresher";
    }

    if (expCount === 1) {
        return "Junior / Associate";
    }

    if (expCount <= 3) {
        return "Mid-Level";
    }

    return "Senior / Lead";
};

/**
 * Score calculation following Lesson 6.1 rubric:
 * Content Quality: 25
 * Skills Relevance & Coverage: 20
 * Work Experience Quality: 20 (fair fresher policy)
 * Projects Quality: 15
 * Education Information: 10
 * Resume Clarity & Completeness: 10
 * Total = 100
 * 
 * @param {object} structured - Validated structured resume object
 * @returns {object} Score breakdown and overall score
 */
export const calculateRuleBasedScore = (structured) => {
    const wordCount = structured.metadata?.wordCount || 0;
    const isFresher = detectCareerLevel(structured) === "Entry-Level / Fresher";

    // 1. Content Quality (Max: 25)
    let contentQuality = 0;
    const summaryLen = structured.professionalSummary?.trim().split(/\s+/).length || 0;
    if (summaryLen >= 15) contentQuality += 10;
    else if (summaryLen > 0) contentQuality += 5;

    if (structured.personalInfo?.email) contentQuality += 4;
    if (structured.personalInfo?.phone) contentQuality += 4;
    if (structured.personalInfo?.location) contentQuality += 2;
    if (structured.personalInfo?.linkedin) contentQuality += 3;
    if (structured.personalInfo?.github || structured.personalInfo?.portfolio) contentQuality += 2;
    contentQuality = Math.min(25, contentQuality);

    // 2. Skills Relevance & Coverage (Max: 20)
    let skillsScore = 0;
    const skillsCount = structured.skills?.length || 0;
    if (skillsCount >= 10) skillsScore += 16;
    else if (skillsCount >= 7) skillsScore += 13;
    else if (skillsCount >= 4) skillsScore += 10;
    else if (skillsCount >= 1) skillsScore += 6;

    // Check category diversity
    const categoriesCovered = new Set(structured.skills.map(categorizeSkill));
    if (categoriesCovered.size >= 3) skillsScore += 4;
    else if (categoriesCovered.size >= 2) skillsScore += 2;
    skillsScore = Math.min(20, skillsScore);

    // 3. Work Experience (Max: 20) - Fresher Friendly
    let experienceScore = 0;
    const expCount = structured.experience?.length || 0;
    let isExpApplicable = true;

    if (expCount === 0 && isFresher) {
        isExpApplicable = false; // Normalized out so freshers are not penalized
    } else {
        if (expCount >= 2) experienceScore += 14;
        else if (expCount === 1) experienceScore += 10;

        const hasDescriptions = structured.experience.some((e) => (e.description?.trim().length || 0) > 30);
        if (hasDescriptions) experienceScore += 6;
        experienceScore = Math.min(20, experienceScore);
    }

    // 4. Projects Quality (Max: 15)
    let projectsScore = 0;
    const projCount = structured.projects?.length || 0;
    if (projCount >= 2) projectsScore += 10;
    else if (projCount === 1) projectsScore += 7;

    const hasTechList = structured.projects.some((p) => p.technologies?.length > 0);
    if (hasTechList) projectsScore += 3;

    const hasProjectDesc = structured.projects.some((p) => (p.description?.trim().length || 0) > 30);
    if (hasProjectDesc) projectsScore += 2;
    projectsScore = Math.min(15, projectsScore);

    // 5. Education Information (Max: 10)
    let educationScore = 0;
    const eduCount = structured.education?.length || 0;
    if (eduCount >= 1) {
        const primaryEdu = structured.education[0];
        if (primaryEdu.degree && primaryEdu.institution) {
            educationScore += 8;
            if (primaryEdu.startDate || primaryEdu.endDate || primaryEdu.grade) {
                educationScore += 2;
            }
        } else if (primaryEdu.institution || primaryEdu.degree) {
            educationScore += 5;
        }
    }
    educationScore = Math.min(10, educationScore);

    // 6. Resume Clarity & Completeness (Max: 10)
    let clarityScore = 0;
    if (wordCount >= 200 && wordCount <= 1200) clarityScore += 4;
    else if (wordCount > 50) clarityScore += 2;

    const coreSectionsCount = [
        Boolean(structured.personalInfo?.email || structured.personalInfo?.phone),
        skillsCount > 0,
        eduCount > 0,
        projCount > 0 || expCount > 0
    ].filter(Boolean).length;

    if (coreSectionsCount === 4) clarityScore += 4;
    else if (coreSectionsCount >= 3) clarityScore += 2;

    if (structured.certifications?.length > 0 || structured.achievements?.length > 0) {
        clarityScore += 2;
    }
    clarityScore = Math.min(10, clarityScore);

    // Composite Calculation with Fair Normalization
    let overallScore = 0;
    let applicableWeightTotal = 100;

    if (isExpApplicable) {
        overallScore = contentQuality + skillsScore + experienceScore + projectsScore + educationScore + clarityScore;
        applicableWeightTotal = 100;
    } else {
        applicableWeightTotal = 80;
        const nonExpEarned = contentQuality + skillsScore + projectsScore + educationScore + clarityScore;
        overallScore = Math.round((nonExpEarned / applicableWeightTotal) * 100);
    }

    overallScore = Math.max(10, Math.min(100, Math.round(overallScore)));

    // Rating Label Mapping
    let ratingLabel = "Average";
    if (overallScore >= 90) ratingLabel = "Excellent";
    else if (overallScore >= 80) ratingLabel = "Very Good";
    else if (overallScore >= 70) ratingLabel = "Good";
    else if (overallScore >= 60) ratingLabel = "Average";
    else if (overallScore >= 40) ratingLabel = "Needs Improvement";
    else ratingLabel = "Poor";

    return {
        overallScore,
        ratingLabel,
        isFresher,
        isExpApplicable,
        applicableWeightTotal,
        categories: {
            contentQuality: { earned: contentQuality, weight: 25 },
            skills: { earned: skillsScore, weight: 20 },
            experience: { earned: isExpApplicable ? experienceScore : 0, weight: isExpApplicable ? 20 : 0, status: isExpApplicable ? "evaluated" : "not_applicable_fresher" },
            projects: { earned: projectsScore, weight: 15 },
            education: { earned: educationScore, weight: 10 },
            clarityCompleteness: { earned: clarityScore, weight: 10 }
        }
    };
};

/**
 * Execute deterministic rule-based resume analysis
 * 
 * @param {object} structured - Structured resume JSON from Lesson 5.3
 * @returns {object} Full analysis object adhering to completeResumeAnalysisZodSchema
 */
export const generateRuleBasedAnalysis = (structured) => {
    const careerLevel = detectCareerLevel(structured);
    const scoreResult = calculateRuleBasedScore(structured);

    // 1. Found Skills with Categorization and Evidence
    const foundSkills = (structured.skills || []).map((skill) => ({
        skill,
        category: categorizeSkill(skill),
        evidence: `Listed in technical skills section or document content`
    }));

    // Deterministic Skill Gaps based on discovered profile
    const skillGaps = [];
    const skillSet = new Set((structured.skills || []).map((s) => s.toLowerCase().trim()));
    const isWebDev = skillSet.has("react") || skillSet.has("react.js") || skillSet.has("javascript") || skillSet.has("node.js");

    if (isWebDev) {
        if (!skillSet.has("docker") && !skillSet.has("kubernetes")) {
            skillGaps.push({ skill: "Docker / Containerization", reason: "Standard in modern web development and microservice architectures." });
        }
        if (!skillSet.has("jest") && !skillSet.has("cypress") && !skillSet.has("testing")) {
            skillGaps.push({ skill: "Automated Testing (Jest / Vitest / Cypress)", reason: "Demonstrates production code reliability and software craftsmanship." });
        }
        if (!skillSet.has("typescript")) {
            skillGaps.push({ skill: "TypeScript", reason: "Widely expected in professional React/Node.js enterprise ecosystems." });
        }
    } else {
        if (!skillSet.has("git") && !skillSet.has("github")) {
            skillGaps.push({ skill: "Version Control (Git/GitHub)", reason: "Crucial for team collaboration and code management." });
        }
    }

    // 2. Inferred Target Roles
    const targetRoles = [];
    if (isWebDev) {
        targetRoles.push("Full Stack Developer", "Software Engineer", "Frontend Developer", "Backend Developer");
    } else if (skillSet.has("python") || skillSet.has("machine learning") || skillSet.has("data analysis")) {
        targetRoles.push("Data Analyst", "Python Developer", "Data Scientist");
    } else {
        targetRoles.push("Software Engineer", "Technical Specialist");
    }

    // 3. Resume Overview
    const summaryText = structured.professionalSummary && structured.professionalSummary.trim().length > 15
        ? structured.professionalSummary.trim()
        : `Candidate profile identified with ${foundSkills.length} verified technical skills and ${structured.projects?.length || 0} projects.`;

    const resumeOverview = {
        summary: summaryText,
        professionalProfile: isWebDev ? "Full Stack Software Developer" : "Technical Professional",
        detectedCareerLevel: careerLevel,
        targetRoles
    };

    // 4. Skills Analysis
    const skillsAnalysis = {
        foundSkills,
        skillGaps,
        skillsSummary: `Identified ${foundSkills.length} key technical skills across multiple categories including ${Array.from(new Set(foundSkills.map((s) => s.category))).slice(0, 3).join(", ") || "Technical"}.`
    };

    // 5. Experience Analysis
    const expStrengths = [];
    const expImprovements = [];
    if (structured.experience?.length > 0) {
        expStrengths.push(`Documented ${structured.experience.length} professional work experience role(s).`);
        const hasBullets = structured.experience.some((e) => (e.description?.length || 0) > 40);
        if (hasBullets) expStrengths.push("Job descriptions provide details on technologies and development responsibilities.");
        expImprovements.push("Quantify achievements by including measurable metrics (e.g., performance improvements, users served, or scale).");
    } else {
        expStrengths.push("Profile transparently reflects academic and project-oriented focus.");
        expImprovements.push("Consider adding relevant internships, open-source contributions, or freelance projects under experience.");
    }

    const experienceAnalysis = {
        summary: structured.experience?.length > 0
            ? `Candidate has documented ${structured.experience.length} professional work experience position(s).`
            : "No formal employment history listed. Candidate is evaluated under fair entry-level / fresher guidelines.",
        strengths: expStrengths,
        improvements: expImprovements
    };

    // 6. Education Analysis
    const eduObservations = [];
    if (structured.education?.length > 0) {
        const edu = structured.education[0];
        eduObservations.push(`Degree: ${edu.degree || "Degree specified"} from ${edu.institution || "Institution specified"}.`);
        if (edu.startDate || edu.endDate) {
            eduObservations.push(`Timeline: ${edu.startDate || ""} - ${edu.endDate || ""}`);
        }
        if (edu.grade) {
            eduObservations.push(`Academic Performance: ${edu.grade}`);
        }
    } else {
        eduObservations.push("No explicit education records detected in parsed document.");
    }

    const educationAnalysis = {
        summary: structured.education?.length > 0
            ? `Education credentials verified from ${structured.education.length} academic institution record(s).`
            : "Education section is missing or could not be classified.",
        observations: eduObservations
    };

    // 7. Projects Analysis
    const projStrengths = [];
    const projImprovements = [];
    if (structured.projects?.length > 0) {
        projStrengths.push(`Portfolio features ${structured.projects.length} technical project(s).`);
        const hasTech = structured.projects.some((p) => p.technologies?.length > 0);
        if (hasTech) {
            projStrengths.push("Projects explicitly list the underlying tech stack and frameworks used.");
        }
        projImprovements.push("Include live demo links or repository links for each project to facilitate code review.");
    } else {
        projImprovements.push("Add at least 2 distinct technical projects to demonstrate practical software engineering capability.");
    }

    const projectsAnalysis = {
        summary: structured.projects?.length > 0
            ? `Identified ${structured.projects.length} structured project item(s) showcasing technical application.`
            : "No distinct projects section identified in resume content.",
        strengths: projStrengths,
        improvements: projImprovements
    };

    // 8. Strengths
    const strengths = [];
    if (foundSkills.length >= 7) {
        strengths.push({
            title: "Diverse Technical Skillset",
            description: `Demonstrated breadth across ${foundSkills.length} technologies in modern development.`,
            evidence: foundSkills.slice(0, 5).map((s) => s.skill).join(", ")
        });
    }
    if (structured.projects?.length >= 2) {
        strengths.push({
            title: "Demonstrated Practical Projects",
            description: "Multiple projects highlight the ability to design and build complete applications.",
            evidence: structured.projects.map((p) => p.projectName).filter(Boolean).slice(0, 2).join(", ")
        });
    }
    if (structured.personalInfo?.email && structured.personalInfo?.phone) {
        strengths.push({
            title: "Complete Contact Information",
            description: "Recruiters can easily reach out via verified contact channels.",
            evidence: `${structured.personalInfo.email} | ${structured.personalInfo.phone}`
        });
    }
    if (strengths.length === 0) {
        strengths.push({
            title: "Clear Document Structure",
            description: "Resume sections are distinct and parseable.",
            evidence: "Document contains recognized section headers"
        });
    }

    // 9. Weaknesses
    const weaknesses = [];
    if (!structured.professionalSummary || structured.professionalSummary.trim().length < 20) {
        weaknesses.push({
            title: "Missing or Brief Professional Summary",
            description: "The resume lacks a 2-3 sentence introductory hook summarizing core capabilities.",
            suggestion: "Add a compelling 3-sentence summary at the top outlining your target role and key technical strengths.",
            evidence: "Professional summary is empty or minimal"
        });
    }
    if (!structured.personalInfo?.linkedin) {
        weaknesses.push({
            title: "Missing LinkedIn Profile Link",
            description: "Recruiters frequently check LinkedIn for professional credibility and connections.",
            suggestion: "Include your customized LinkedIn profile URL in the contact header.",
            evidence: "No LinkedIn link found in header"
        });
    }
    if (!structured.personalInfo?.github && !structured.personalInfo?.portfolio) {
        weaknesses.push({
            title: "Missing Code Repository or Portfolio Link",
            description: "Technical hiring managers value reviewing publicly accessible source code.",
            suggestion: "Add a GitHub profile or live portfolio link to showcase your coding style.",
            evidence: "No GitHub or portfolio URL detected"
        });
    }
    if (weaknesses.length === 0) {
        weaknesses.push({
            title: "Quantifiable Metrics Opportunity",
            description: "Bullet points can be strengthened with more business impact numbers.",
            suggestion: "Include metrics such as percent improvement, query optimization, or user volume.",
            evidence: "Experience/projects focus primarily on responsibilities rather than quantitative impact"
        });
    }

    // 10. Missing Information
    const missingInformation = [];
    if (!structured.personalInfo?.linkedin) {
        missingInformation.push({ field: "LinkedIn URL", reason: "Standard for recruiter outreach and identity verification." });
    }
    if (!structured.personalInfo?.github) {
        missingInformation.push({ field: "GitHub URL", reason: "Enables review of actual coding practices and commits." });
    }
    if (!structured.professionalSummary) {
        missingInformation.push({ field: "Professional Summary", reason: "Provides quick context on candidate career goals and strengths." });
    }
    if (!structured.certifications?.length) {
        missingInformation.push({ field: "Certifications", reason: "Industry-standard certifications validate technical competency." });
    }

    // 11. Improvement Suggestions
    const improvementSuggestions = [
        {
            area: "Summary Statement",
            suggestion: "Add a crisp, high-impact Professional Summary highlighting your technical stack and target career position.",
            priority: "high"
        },
        {
            area: "Measurable Impact",
            suggestion: "Enhance project and work bullet points with quantifiable results (e.g. 'Optimized query latency by 25%', 'Engineered 12 REST API endpoints').",
            priority: "high"
        },
        {
            area: "Profile Links",
            suggestion: "Include clickable links to your GitHub and LinkedIn profiles in the header.",
            priority: "medium"
        },
        {
            area: "Continuous Learning",
            suggestion: "Pursue recognized certifications in cloud or software engineering to demonstrate ongoing professional growth.",
            priority: "low"
        }
    ];

    // 12. Analysis Limitations
    const analysisLimitations = [
        "Analysis performed using deterministic heuristic rule-based engine (zero AI API calls).",
        "Qualitative aspects such as writing tone and creative depth are not evaluated by rules.",
        "For deep conversational resume critiques and semantic analysis, consider Advanced AI Analysis."
    ];

    const draft = {
        resumeOverview,
        skillsAnalysis,
        experienceAnalysis,
        educationAnalysis,
        projectsAnalysis,
        strengths,
        weaknesses,
        missingInformation,
        improvementSuggestions,
        analysisLimitations
    };

    // Validate draft against master schema
    const validated = completeResumeAnalysisZodSchema.parse(draft);

    return {
        ...validated,
        analysisType: "rule_based",
        isRuleBased: true,
        engine: "Deterministic Rule-Based Analyzer v1.0 (No AI / Zero API Cost)",
        scoringDetails: scoreResult
    };
};

/**
 * Run the complete Free Rule-Based Resume Analysis workflow
 * 
 * @param {object} params
 * @param {string|number} params.resumeId
 * @param {number} params.userId
 * @returns {Promise<object>} Complete analysis record
 */
export const runFreeResumeAnalysis = async ({ resumeId, userId }) => {
    const parsedResumeId = parseInt(resumeId, 10);
    if (!parsedResumeId || isNaN(parsedResumeId) || parsedResumeId <= 0) {
        throw new AnalysisWorkflowError("Invalid resume ID", 400, "INVALID_RESUME_ID");
    }

    // Step 1: Verify tenant ownership and retrieve resume
    const fileInfo = await getResumeFileForPreviewOrDownload({
        resumeId: parsedResumeId,
        userId
    });

    // Step 2: Extract text if not yet cached in database
    let rawText = fileInfo.extractedText;
    const sourceType = (fileInfo.fileType === "docx" || fileInfo.originalFilename?.toLowerCase().endsWith(".docx")) ? "docx" : "pdf";
    const diskPath = fileInfo.filePath || fileInfo.absolutePath;

    if (!rawText || rawText.trim().length === 0) {
        if (sourceType === "docx") {
            const extractionResult = await extractTextFromDocx(diskPath);
            rawText = extractionResult.extractedText;
        } else {
            const extractionResult = await extractTextFromPdf(diskPath);
            rawText = extractionResult.extractedText;
        }

        if (rawText && rawText.trim().length > 0) {
            await updateResumeExtractedText({
                resumeId: fileInfo.resumeId,
                userId,
                extractedText: rawText
            });
        }
    }

    if (!rawText || rawText.trim().length === 0) {
        throw new AnalysisWorkflowError(
            "Cannot analyze resume: document contains no readable text.",
            422,
            "EMPTY_DOCUMENT_TEXT"
        );
    }

    // Step 3: Deterministically structure sections using Lesson 5.3 engine
    const structuredResume = structureResumeContent(rawText, { sourceType });

    // Step 4: Run rule-based analysis (NO OpenAI calls)
    const ruleBasedResult = generateRuleBasedAnalysis(structuredResume);
    const overallScore = ruleBasedResult.scoringDetails?.overallScore || 70;

    // Step 5: Save record into resume_analyses with analysis_type = 'rule_based'
    const [insertResult] = await db.execute(
        `INSERT INTO resume_analyses 
         (user_id, resume_id, analysis_status, analysis_type, ai_model, overall_score, analysis_result, analyzed_at)
         VALUES (?, ?, 'completed', 'rule_based', 'rule-based-engine', ?, ?, NOW())`,
        [userId, parsedResumeId, overallScore, JSON.stringify(ruleBasedResult)]
    );

    const analysisId = insertResult.insertId;

    // Step 6: Sync score into resume_scores table
    try {
        const cat = ruleBasedResult.scoringDetails?.categories || {};
        await db.execute(
            `INSERT INTO resume_scores 
             (analysis_id, overall_score, ats_score, skills_score, experience_score, education_score, projects_score, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
                 overall_score = VALUES(overall_score),
                 ats_score = VALUES(ats_score),
                 skills_score = VALUES(skills_score),
                 experience_score = VALUES(experience_score),
                 education_score = VALUES(education_score),
                 projects_score = VALUES(projects_score)`,
            [
                analysisId,
                overallScore,
                overallScore,
                cat.skills?.earned || 15,
                cat.experience?.earned || 15,
                cat.education?.earned || 8,
                cat.projects?.earned || 12
            ]
        );
    } catch {
        // Non-fatal secondary sync
    }

    return {
        analysisId,
        resumeId: parsedResumeId,
        status: "completed",
        analysisType: "rule_based",
        overallScore,
        analysis: ruleBasedResult,
        metadata: {
            aiModel: "rule-based-engine",
            scoringDetails: ruleBasedResult.scoringDetails,
            analyzedAt: new Date().toISOString()
        }
    };
};

export default {
    runFreeResumeAnalysis,
    generateRuleBasedAnalysis,
    calculateRuleBasedScore,
    detectCareerLevel,
    categorizeSkill
};
