import db from "../config/db.js";
import {
    skillsScoreSchema,
    educationScoreSchema,
    experienceScoreSchema,
    detailedResumeScoreResponseSchema
} from "../validators/detailedScoreSchema.js";
import { getResumeFileForPreviewOrDownload, updateResumeExtractedText } from "./resumeStorageService.js";
import { extractTextFromPdf } from "./pdfExtractionService.js";
import { extractTextFromDocx } from "./docxExtractionService.js";
import { structureResumeContent } from "./resumeStructuringService.js";
import { AnalysisWorkflowError } from "./resumeAnalysisService.js";

/**
 * Standard technical skill dictionary with normalization mappings
 */
const SKILL_NORMALIZATION_MAP = {
    // Languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "golang": "Go",
    "go": "Go",
    "rb": "Ruby",
    "ruby": "Ruby",
    "php": "PHP",
    "java": "Java",
    "rust": "Rust",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "bash": "Bash",
    "shell": "Shell Scripting",

    // Frontend
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "svelte": "Svelte",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "redux": "Redux",
    "sass": "Sass",

    // Backend
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "asp.net": "ASP.NET",
    "dotnet": ".NET",
    ".net": ".NET",
    "graphql": "GraphQL",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "restful api": "REST APIs",

    // Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "oracle": "Oracle DB",
    "firebase": "Firebase",
    "supabase": "Supabase",

    // Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud Platform",
    "google cloud": "Google Cloud Platform",
    "azure": "Microsoft Azure",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "jenkins": "Jenkins",
    "github actions": "GitHub Actions",
    "linux": "Linux",

    // Tools
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "postman": "Postman",
    "jira": "Jira",
    "vs code": "VS Code",
    "vscode": "VS Code",
    "figma": "Figma"
};

/**
 * Standard skill categorization dictionary
 */
const SKILL_CATEGORIES_MAP = {
    "Programming Languages": [
        "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Ruby",
        "PHP", "Rust", "Swift", "Kotlin", "Bash", "Shell Scripting", "Scala", "Dart", "R"
    ],
    "Frontend Technologies": [
        "React", "Next.js", "Vue.js", "Angular", "Svelte", "HTML5", "CSS3",
        "Tailwind CSS", "Bootstrap", "Redux", "Sass", "jQuery", "Vite", "Webpack"
    ],
    "Backend Technologies": [
        "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot",
        ".NET", "ASP.NET", "GraphQL", "REST APIs", "Socket.io", "gRPC", "NestJS", "Laravel"
    ],
    "Databases & Storage": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle DB",
        "Firebase", "Supabase", "Cassandra", "DynamoDB", "Elasticsearch"
    ],
    "Cloud & DevOps": [
        "AWS", "Google Cloud Platform", "Microsoft Azure", "Docker", "Kubernetes",
        "CI/CD", "GitHub Actions", "Jenkins", "Terraform", "Linux", "Nginx"
    ],
    "Developer Tools & Platforms": [
        "Git", "GitHub", "GitLab", "Postman", "Jira", "VS Code", "Figma", "npm", "yarn"
    ],
    "Soft Skills & Collaboration": [
        "Problem Solving", "Agile", "Scrum", "Communication", "Leadership",
        "Teamwork", "Code Review", "Mentoring", "Critical Thinking"
    ]
};

/**
 * Normalize skill name to standardized form
 * @param {string} rawSkill
 * @returns {string} Normalized skill name
 */
export const normalizeSkillName = (rawSkill) => {
    if (!rawSkill || typeof rawSkill !== "string") return "";
    const clean = rawSkill.trim();
    const lower = clean.toLowerCase();

    if (SKILL_NORMALIZATION_MAP[lower]) {
        return SKILL_NORMALIZATION_MAP[lower];
    }

    // Capitalize first letter of each word if not in map
    return clean
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
};

/**
 * Assign a skill to a standard category
 * @param {string} normalizedSkill
 * @returns {string} Category name
 */
export const categorizeSkill = (normalizedSkill) => {
    if (!normalizedSkill || typeof normalizedSkill !== "string") return "Specialized & Domain Skills";
    const lower = normalizedSkill.toLowerCase().trim();

    // 1. Exact match first across dictionaries
    for (const [category, skillsList] of Object.entries(SKILL_CATEGORIES_MAP)) {
        if (skillsList.some(s => s.toLowerCase() === lower)) {
            return category;
        }
    }

    // 2. Substring match only for substantial tokens (min length 3 to prevent 'c', 'r', 'go' false positives)
    for (const [category, skillsList] of Object.entries(SKILL_CATEGORIES_MAP)) {
        if (skillsList.some(s => {
            const sLower = s.toLowerCase();
            return sLower.length >= 3 && (lower.includes(sLower) || sLower.includes(lower));
        })) {
            return category;
        }
    }

    // Soft skill heuristic check
    if (/communication|leadership|teamwork|agile|scrum|problem solving|mentoring|collaboration/i.test(lower)) {
        return "Soft Skills & Collaboration";
    }

    return "Specialized & Domain Skills";
};

/**
 * PHASE 2: Detailed Skills Scoring (Weight: 20 points, Internal Rating: 0-100)
 * 
 * Internal parameters:
 * 1. Skills Identification: 25%
 * 2. Skills Organization: 15%
 * 3. Evidence in Projects and Experience: 30%
 * 4. Skills Description and Clarity: 15%
 * 5. Relevant Skills Coverage: 15%
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {string} [params.rawText]
 * @returns {object} Validated skills score breakdown
 */
export const evaluateSkills = ({ structuredResume = {}, rawText = "" }) => {
    const findings = [];
    const evidence = [];
    const limitations = [];

    // 1. Gather raw skills from structured resume
    const rawSkillsList = Array.isArray(structuredResume.skills) ? structuredResume.skills : [];

    // Normalize and deduplicate skills
    const normalizedSet = new Set();
    const normalizedSkills = [];

    for (const item of rawSkillsList) {
        if (!item || typeof item !== "string") continue;
        const norm = normalizeSkillName(item);
        if (norm && !normalizedSet.has(norm.toLowerCase())) {
            normalizedSet.add(norm.toLowerCase());
            normalizedSkills.push(norm);
        }
    }

    // Categorize skills
    const categorizedSkills = {};
    for (const skill of normalizedSkills) {
        const cat = categorizeSkill(skill);
        if (!categorizedSkills[cat]) {
            categorizedSkills[cat] = [];
        }
        categorizedSkills[cat].push(skill);
    }

    // 2. Search for evidence in Projects and Experience
    const projects = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];
    const experience = Array.isArray(structuredResume.experience) ? structuredResume.experience : [];

    const projectCorpus = projects.map(p => `
        ${p.title || ""} ${p.description || ""} ${(p.technologies || []).join(" ")}
    `).join(" ").toLowerCase();

    const experienceCorpus = experience.map(e => `
        ${e.role || ""} ${e.company || ""} ${e.description || ""} ${(e.technologies || []).join(" ")}
    `).join(" ").toLowerCase();

    const combinedEvidenceCorpus = `${projectCorpus} ${experienceCorpus}`;

    const evidenceSupportedSkills = [];
    const listedOnlySkills = [];

    for (const skill of normalizedSkills) {
        const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");

        if (regex.test(combinedEvidenceCorpus)) {
            evidenceSupportedSkills.push(skill);
        } else {
            listedOnlySkills.push(skill);
        }
    }

    // ----------------------------------------------------
    // Parameter 1: Skills Identification (Weight: 25%)
    // ----------------------------------------------------
    let idRating = 0;
    const skillCount = normalizedSkills.length;
    if (skillCount >= 10) idRating = 100;
    else if (skillCount >= 7) idRating = 85;
    else if (skillCount >= 4) idRating = 70;
    else if (skillCount >= 2) idRating = 50;
    else if (skillCount === 1) idRating = 30;
    else idRating = 0;

    const idEarned = (idRating / 100) * 25;
    const idExplanation = skillCount > 0
        ? `Identified and normalized ${skillCount} unique skills without duplicates.`
        : "No technical or functional skills detected in the resume.";

    if (skillCount > 0) {
        evidence.push(`Detected ${skillCount} unique normalized skills`);
    } else {
        limitations.push("No skills section or distinct skill keywords found.");
    }

    // ----------------------------------------------------
    // Parameter 2: Skills Organization (Weight: 15%)
    // ----------------------------------------------------
    const categoriesCount = Object.keys(categorizedSkills).length;
    let orgRating = 0;
    if (categoriesCount >= 4) orgRating = 100;
    else if (categoriesCount === 3) orgRating = 80;
    else if (categoriesCount === 2) orgRating = 60;
    else if (categoriesCount === 1) orgRating = 40;
    else orgRating = 0;

    const orgEarned = (orgRating / 100) * 15;
    const orgExplanation = categoriesCount > 0
        ? `Skills span across ${categoriesCount} distinct domains: ${Object.keys(categorizedSkills).join(", ")}.`
        : "Skills are not organized into distinct technological or functional domains.";

    if (categoriesCount >= 2) {
        findings.push(`Well-structured skill taxonomy across ${categoriesCount} categories.`);
    } else if (skillCount > 0) {
        findings.push("Skills are present but clustered in a single area.");
    }

    // ----------------------------------------------------
    // Parameter 3: Evidence in Projects & Experience (Weight: 30%)
    // ----------------------------------------------------
    let evidenceRating = 0;
    const evidenceRatio = skillCount > 0 ? (evidenceSupportedSkills.length / skillCount) : 0;

    if (skillCount === 0) {
        evidenceRating = 0;
    } else if (evidenceRatio >= 0.6) {
        evidenceRating = 100;
    } else if (evidenceRatio >= 0.4) {
        evidenceRating = 80;
    } else if (evidenceRatio >= 0.25) {
        evidenceRating = 65;
    } else if (evidenceSupportedSkills.length > 0) {
        evidenceRating = 45;
    } else {
        evidenceRating = 20; // Listed skills with zero project/work proof
    }

    const evidenceEarned = (evidenceRating / 100) * 30;
    const evidenceExplanation = evidenceSupportedSkills.length > 0
        ? `${evidenceSupportedSkills.length} of ${skillCount} skills (${Math.round(evidenceRatio * 100)}%) are reinforced with practical project or experience evidence.`
        : "Skills appear solely as a keyword list without hands-on verification in projects or work history.";

    if (evidenceSupportedSkills.length > 0) {
        evidence.push(`Hands-on evidence detected for: ${evidenceSupportedSkills.slice(0, 6).join(", ")}${evidenceSupportedSkills.length > 6 ? "..." : ""}`);
    }
    if (listedOnlySkills.length > 0 && skillCount > 3) {
        limitations.push(`${listedOnlySkills.length} skills lack demonstrable project or experience backing.`);
    }

    // ----------------------------------------------------
    // Parameter 4: Skills Description & Clarity (Weight: 15%)
    // ----------------------------------------------------
    let clarityRating = 0;
    if (skillCount > 0) {
        // Check for concise tokens without paragraph noise
        const hasCleanTokens = rawSkillsList.every(s => typeof s === "string" && s.trim().length < 50);
        clarityRating = hasCleanTokens ? 100 : 70;
    } else {
        clarityRating = 0;
    }

    const clarityEarned = (clarityRating / 100) * 15;
    const clarityExplanation = skillCount > 0
        ? "Skills are listed as concise, recognizable professional competencies without noisy text."
        : "No clear skill descriptors available.";

    // ----------------------------------------------------
    // Parameter 5: Relevant Skills Coverage (Weight: 15%)
    // ----------------------------------------------------
    let coverageRating = 0;
    const hasLang = (categorizedSkills["Programming Languages"]?.length || 0) > 0;
    const hasFrameworkOrBackend = (categorizedSkills["Frontend Technologies"]?.length || 0) > 0 || (categorizedSkills["Backend Technologies"]?.length || 0) > 0;
    const hasDbOrDevops = (categorizedSkills["Databases & Storage"]?.length || 0) > 0 || (categorizedSkills["Cloud & DevOps"]?.length || 0) > 0 || (categorizedSkills["Developer Tools & Platforms"]?.length || 0) > 0;

    if (hasLang && hasFrameworkOrBackend && hasDbOrDevops) {
        coverageRating = 100;
    } else if ((hasLang && hasFrameworkOrBackend) || (hasLang && hasDbOrDevops) || (hasFrameworkOrBackend && hasDbOrDevops)) {
        coverageRating = 80;
    } else if (skillCount >= 3) {
        coverageRating = 60;
    } else if (skillCount > 0) {
        coverageRating = 40;
    } else {
        coverageRating = 0;
    }

    const coverageEarned = (coverageRating / 100) * 15;
    const coverageExplanation = coverageRating >= 80
        ? "Demonstrates well-rounded technical coverage across languages, frameworks, and tools."
        : "Skill coverage is concentrated in a narrow slice of the software development lifecycle.";

    // ----------------------------------------------------
    // Overall Skills Calculation
    // ----------------------------------------------------
    const skillsRating = Math.round(idEarned + orgEarned + evidenceEarned + clarityEarned + coverageEarned);
    const skillsWeight = 20;
    const skillsEarnedPoints = Math.round(((skillsRating / 100) * skillsWeight) * 10) / 10;

    const status = skillCount === 0 ? "not_evaluable" : skillsRating < 50 ? "needs_attention" : "evaluated";

    return {
        category: "Skills",
        rating: Math.max(0, Math.min(100, skillsRating)),
        weight: skillsWeight,
        earnedPoints: skillsEarnedPoints,
        status,
        parameters: {
            identification: {
                name: "Skills Identification",
                weight: 25,
                rating: idRating,
                earnedPoints: Math.round(idEarned * 10) / 10,
                explanation: idExplanation,
                evidence: normalizedSkills.slice(0, 10)
            },
            organization: {
                name: "Skills Organization",
                weight: 15,
                rating: orgRating,
                earnedPoints: Math.round(orgEarned * 10) / 10,
                explanation: orgExplanation,
                evidence: Object.keys(categorizedSkills)
            },
            evidence: {
                name: "Evidence in Projects and Experience",
                weight: 30,
                rating: evidenceRating,
                earnedPoints: Math.round(evidenceEarned * 10) / 10,
                explanation: evidenceExplanation,
                evidence: evidenceSupportedSkills
            },
            clarity: {
                name: "Skills Description and Clarity",
                weight: 15,
                rating: clarityRating,
                earnedPoints: Math.round(clarityEarned * 10) / 10,
                explanation: clarityExplanation,
                evidence: []
            },
            coverage: {
                name: "Relevant Skills Coverage",
                weight: 15,
                rating: coverageRating,
                earnedPoints: Math.round(coverageEarned * 10) / 10,
                explanation: coverageExplanation,
                evidence: []
            }
        },
        detectedSkills: rawSkillsList,
        normalizedSkills,
        categorizedSkills,
        evidenceSupportedSkills,
        listedOnlySkills,
        findings,
        evidence,
        limitations
    };
};

/**
 * PHASE 3: Detailed Education Scoring (Weight: 10 points, Internal Rating: 0-100)
 * 
 * Internal parameters:
 * 1. Qualification Details: 30%
 * 2. Institution Information: 20%
 * 3. Field or Specialization: 20%
 * 4. Graduation Year or Dates: 15%
 * 5. Education Section Clarity: 15%
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {string} [params.rawText]
 * @returns {object} Validated education score breakdown
 */
export const evaluateEducation = ({ structuredResume = {}, rawText = "" }) => {
    const findings = [];
    const evidence = [];
    const limitations = [];

    const rawEducation = Array.isArray(structuredResume.education) ? structuredResume.education : [];
    const eduCount = rawEducation.length;

    if (eduCount === 0) {
        return {
            category: "Education",
            rating: 0,
            weight: 10,
            earnedPoints: 0,
            status: "not_evaluable",
            parameters: {
                qualificationDetails: {
                    name: "Qualification Details",
                    weight: 30,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No formal degree or qualification details detected.",
                    evidence: []
                },
                institutionInformation: {
                    name: "Institution Information",
                    weight: 20,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No college, university, or educational institution detected.",
                    evidence: []
                },
                fieldOrSpecialization: {
                    name: "Field or Specialization",
                    weight: 20,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No academic major or specialization detected.",
                    evidence: []
                },
                graduationDates: {
                    name: "Graduation Year or Dates",
                    weight: 15,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No graduation dates or educational timeline detected.",
                    evidence: []
                },
                sectionClarity: {
                    name: "Education Section Clarity",
                    weight: 15,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "Education section is entirely absent.",
                    evidence: []
                }
            },
            qualifications: [],
            findings: ["Education credentials are completely missing from the resume."],
            evidence: [],
            limitations: ["No degree or academic institution found. Add your formal education credentials."]
        };
    }

    const qualifications = rawEducation.map(e => ({
        degree: e.degree || null,
        institution: e.institution || null,
        fieldOfStudy: e.fieldOfStudy || null,
        startDate: e.startDate || null,
        endDate: e.endDate || null,
        grade: e.grade || null,
        isComplete: Boolean(e.degree && e.institution)
    }));

    // Primary education entry
    const primary = qualifications[0];

    // ----------------------------------------------------
    // Parameter 1: Qualification Details (Weight: 30%)
    // ----------------------------------------------------
    let qualRating = 0;
    const hasDegree = Boolean(primary.degree && primary.degree.trim().length > 1);
    if (hasDegree) {
        qualRating = 100;
        evidence.push(`Qualification identified: ${primary.degree}`);
    } else {
        qualRating = 0;
        limitations.push("Degree or diploma title is missing or unstated.");
    }
    const qualEarned = (qualRating / 100) * 30;
    const qualExplanation = hasDegree
        ? `Identified formal qualification: "${primary.degree}".`
        : "Degree or qualification title is missing from the education entry.";

    // ----------------------------------------------------
    // Parameter 2: Institution Information (Weight: 20%)
    // ----------------------------------------------------
    let instRating = 0;
    const hasInst = Boolean(primary.institution && primary.institution.trim().length > 1);
    if (hasInst) {
        instRating = 100;
        evidence.push(`Institution verified: ${primary.institution}`);
    } else {
        instRating = 0;
        limitations.push("College or university name is missing.");
    }
    const instEarned = (instRating / 100) * 20;
    const instExplanation = hasInst
        ? `Institution clearly stated: "${primary.institution}" (evaluated objectively without prestige bias).`
        : "Educational institution or university name is missing.";

    // ----------------------------------------------------
    // Parameter 3: Field or Specialization (Weight: 20%)
    // ----------------------------------------------------
    let fieldRating = 0;
    const hasField = Boolean(primary.fieldOfStudy && primary.fieldOfStudy.trim().length > 1);
    // If degree string itself includes "Computer Science" or "Information Technology"
    const degreeMentionsField = /computer\s+science|information\s+technology|software|engineering|data\s+science|economics|business/i.test(primary.degree || "");

    if (hasField) {
        fieldRating = 100;
        evidence.push(`Field of study specified: ${primary.fieldOfStudy}`);
    } else if (degreeMentionsField) {
        fieldRating = 80;
        evidence.push("Field of study is specified within the qualification title.");
    } else {
        fieldRating = 30;
        limitations.push("Academic major or specialization could be made more explicit.");
    }
    const fieldEarned = (fieldRating / 100) * 20;
    const fieldExplanation = hasField || degreeMentionsField
        ? `Academic major/specialization clearly identified: "${primary.fieldOfStudy || primary.degree}".`
        : "Field of study or major is not explicitly stated.";

    // ----------------------------------------------------
    // Parameter 4: Graduation Year or Dates (Weight: 15%)
    // ----------------------------------------------------
    let datesRating = 0;
    const hasDates = Boolean(primary.endDate || primary.startDate);
    if (hasDates) {
        datesRating = 100;
        evidence.push(`Graduation dates/timeline: ${primary.startDate || ""} - ${primary.endDate || "Present"}`);
    } else {
        // Missing graduation dates must NOT automatically imply an incomplete qualification.
        datesRating = 60;
        findings.push("Graduation year/dates not specified; evaluated neutrally without assuming non-completion.");
    }
    const datesEarned = (datesRating / 100) * 15;
    const datesExplanation = hasDates
        ? `Graduation timeline provided: ${primary.endDate || primary.startDate}.`
        : "Graduation dates were omitted; per fair scoring policy, this is not penalized as an incomplete qualification.";

    // ----------------------------------------------------
    // Parameter 5: Education Section Clarity (Weight: 15%)
    // ----------------------------------------------------
    let clarityRating = 0;
    if (primary.isComplete) {
        clarityRating = 100;
        if (eduCount > 1) {
            clarityRating = 100;
            findings.push(`Multiple education records supported (${eduCount} entries documented).`);
        }
    } else if (hasDegree || hasInst) {
        clarityRating = 60;
    } else {
        clarityRating = 20;
    }
    const clarityEarned = (clarityRating / 100) * 15;
    const clarityExplanation = primary.isComplete
        ? `Clean education profile with complete core attributes.${eduCount > 1 ? ` Includes ${eduCount} academic records.` : ""}`
        : "Education entry is partially incomplete or lacks standard formatting.";

    // ----------------------------------------------------
    // Overall Education Calculation
    // ----------------------------------------------------
    const educationRating = Math.round(qualEarned + instEarned + fieldEarned + datesEarned + clarityEarned);
    const educationWeight = 10;
    const educationEarnedPoints = Math.round(((educationRating / 100) * educationWeight) * 10) / 10;

    const status = educationRating < 50 ? "needs_attention" : "evaluated";

    return {
        category: "Education",
        rating: Math.max(0, Math.min(100, educationRating)),
        weight: educationWeight,
        earnedPoints: educationEarnedPoints,
        status,
        parameters: {
            qualificationDetails: {
                name: "Qualification Details",
                weight: 30,
                rating: qualRating,
                earnedPoints: Math.round(qualEarned * 10) / 10,
                explanation: qualExplanation,
                evidence: primary.degree ? [primary.degree] : []
            },
            institutionInformation: {
                name: "Institution Information",
                weight: 20,
                rating: instRating,
                earnedPoints: Math.round(instEarned * 10) / 10,
                explanation: instExplanation,
                evidence: primary.institution ? [primary.institution] : []
            },
            fieldOrSpecialization: {
                name: "Field or Specialization",
                weight: 20,
                rating: fieldRating,
                earnedPoints: Math.round(fieldEarned * 10) / 10,
                explanation: fieldExplanation,
                evidence: primary.fieldOfStudy ? [primary.fieldOfStudy] : []
            },
            graduationDates: {
                name: "Graduation Year or Dates",
                weight: 15,
                rating: datesRating,
                earnedPoints: Math.round(datesEarned * 10) / 10,
                explanation: datesExplanation,
                evidence: primary.endDate ? [primary.endDate] : []
            },
            sectionClarity: {
                name: "Education Section Clarity",
                weight: 15,
                rating: clarityRating,
                earnedPoints: Math.round(clarityEarned * 10) / 10,
                explanation: clarityExplanation,
                evidence: []
            }
        },
        qualifications,
        findings,
        evidence,
        limitations
    };
};

/**
 * PHASE 4 & 5: Detailed Experience Scoring & Fair Fresher Policy
 * (Weight: 20 points, Internal Rating: 0-100)
 * 
 * Internal parameters:
 * 1. Role and Responsibility Clarity: 25%
 * 2. Achievement and Impact Evidence: 25%
 * 3. Experience Description Quality: 20%
 * 4. Relevant Technologies and Skills: 15%
 * 5. Employment Timeline Clarity: 15%
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {string} [params.rawText]
 * @returns {object} Validated experience score breakdown
 */
export const evaluateExperience = ({ structuredResume = {}, rawText = "" }) => {
    const findings = [];
    const evidence = [];
    const limitations = [];

    const rawExperience = Array.isArray(structuredResume.experience) ? structuredResume.experience : [];
    const rawProjects = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];

    const hasWorkHistory = rawExperience.length > 0;
    const hasProjects = rawProjects.length > 0;

    // Detect internships
    const isInternshipEntry = (exp) => {
        const title = (exp.role || exp.title || "").toLowerCase();
        const company = (exp.company || "").toLowerCase();
        const desc = (exp.description || "").toLowerCase();
        return /intern|internship|trainee|apprentice/i.test(`${title} ${company} ${desc}`);
    };

    const hasInternships = rawExperience.some(isInternshipEntry);
    const allInternships = hasWorkHistory && rawExperience.every(isInternshipEntry);

    // Fresher determination: No experience OR only student/intern status
    const summary = (structuredResume.professionalSummary || "").toLowerCase();
    const indicatesStudentOrFresher = /fresher|graduate|student|undergraduate|seeking\s+(an\s+entry|my\s+first)/i.test(summary);
    const isFresher = (!hasWorkHistory || (allInternships && rawExperience.length <= 1)) && (indicatesStudentOrFresher || rawExperience.length === 0);

    // ----------------------------------------------------
    // SCENARIO A: Genuine Fresher with NO formal employment, but HAS PROJECTS
    // Fresher-Friendly Policy: Evaluate project engineering evidence!
    // ----------------------------------------------------
    if (!hasWorkHistory && isFresher && hasProjects) {
        findings.push("Fresher Experience Policy applied: Candidate has no formal employment history; evaluating hands-on engineering projects as practical evidence.");

        // Evaluate projects as practical experience
        let projTechCount = 0;
        let projImpactCount = 0;
        let projDescLength = 0;

        for (const proj of rawProjects) {
            const techs = Array.isArray(proj.technologies) ? proj.technologies : [];
            projTechCount += techs.length;
            const desc = proj.description || "";
            projDescLength += desc.length;

            if (/\b(?:reduced|increased|improved|optimized|achieved|built|deployed|scaled|\d+%\b|\$\d+)/i.test(desc)) {
                projImpactCount++;
            }
        }

        const roleRating = rawProjects.length >= 2 ? 85 : 70;
        const impactRating = projImpactCount > 0 ? 80 : 60;
        const descRating = projDescLength > 150 ? 85 : 65;
        const techRating = projTechCount >= 4 ? 90 : 70;
        const timelineRating = 75; // Academic/practical project timeline

        const roleEarned = (roleRating / 100) * 25;
        const impactEarned = (impactRating / 100) * 25;
        const descEarned = (descRating / 100) * 20;
        const techEarned = (techRating / 100) * 15;
        const timelineEarned = (timelineRating / 100) * 15;

        const experienceRating = Math.round(roleEarned + impactEarned + descEarned + techEarned + timelineEarned);
        const experienceEarnedPoints = Math.round(((experienceRating / 100) * 20) * 10) / 10;

        evidence.push(`Practical experience demonstrated across ${rawProjects.length} engineering projects.`);
        if (projImpactCount > 0) {
            evidence.push(`Measurable engineering impact identified in ${projImpactCount} project descriptions.`);
        }
        limitations.push("Fresher profile: Practical engineering projects evaluated in lieu of full-time corporate employment.");

        return {
            category: "Experience",
            rating: experienceRating,
            weight: 20,
            earnedPoints: experienceEarnedPoints,
            status: "evaluated",
            fresherPolicyApplied: true,
            fresherPolicyDetails: {
                isFresher: true,
                hasInternships: false,
                hasProjects: true,
                policyNote: "Candidate is an entry-level professional/fresher with demonstrated project engineering experience."
            },
            parameters: {
                roleResponsibilityClarity: {
                    name: "Role and Responsibility Clarity",
                    weight: 25,
                    rating: roleRating,
                    earnedPoints: Math.round(roleEarned * 10) / 10,
                    explanation: `Project engineering leadership demonstrated across ${rawProjects.length} distinct initiatives.`,
                    evidence: rawProjects.map(p => p.title || "Project").filter(Boolean)
                },
                achievementImpactEvidence: {
                    name: "Achievement and Impact Evidence",
                    weight: 25,
                    rating: impactRating,
                    earnedPoints: Math.round(impactEarned * 10) / 10,
                    explanation: projImpactCount > 0
                        ? `Identified ${projImpactCount} outcome-driven project deliverables.`
                        : "Project deliverables outlined functional features without quantified business metrics.",
                    evidence: []
                },
                descriptionQuality: {
                    name: "Experience Description Quality",
                    weight: 20,
                    rating: descRating,
                    earnedPoints: Math.round(descEarned * 10) / 10,
                    explanation: "Project implementation descriptions articulate architecture and development decisions.",
                    evidence: []
                },
                relevantTechnologies: {
                    name: "Relevant Technologies and Skills",
                    weight: 15,
                    rating: techRating,
                    earnedPoints: Math.round(techEarned * 10) / 10,
                    explanation: `Applied ${projTechCount} tools and technologies in project implementations.`,
                    evidence: []
                },
                timelineClarity: {
                    name: "Employment Timeline Clarity",
                    weight: 15,
                    rating: timelineRating,
                    earnedPoints: Math.round(timelineEarned * 10) / 10,
                    explanation: "Project milestones indicate sequential technical development.",
                    evidence: []
                }
            },
            roles: rawProjects.map(p => ({
                title: p.title || "Project Engineer",
                company: "Academic / Personal Project",
                duration: "Project Scope",
                isCurrent: false,
                isInternship: false,
                technologies: p.technologies || [],
                responsibilitiesCount: 1,
                achievementsCount: projImpactCount
            })),
            findings,
            evidence,
            limitations
        };
    }

    // ----------------------------------------------------
    // SCENARIO B: Fresher with NO formal employment AND NO projects
    // Policy: Mark as not_applicable_fresher with transparent normalization note
    // ----------------------------------------------------
    if (!hasWorkHistory && !hasProjects) {
        findings.push("Candidate has no recorded employment or technical project history.");
        limitations.push("Experience section is not applicable. Category weight of 20 can be normalized across skills and education.");

        return {
            category: "Experience",
            rating: 0,
            weight: 20,
            earnedPoints: 0,
            status: "not_applicable_fresher",
            fresherPolicyApplied: true,
            fresherPolicyDetails: {
                isFresher: true,
                hasInternships: false,
                hasProjects: false,
                policyNote: "Fresher with no formal employment or technical projects. Transparent weight normalization applies per Lesson 6.1."
            },
            parameters: {
                roleResponsibilityClarity: {
                    name: "Role and Responsibility Clarity",
                    weight: 25,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No professional employment roles recorded.",
                    evidence: []
                },
                achievementImpactEvidence: {
                    name: "Achievement and Impact Evidence",
                    weight: 25,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No workplace achievements recorded.",
                    evidence: []
                },
                descriptionQuality: {
                    name: "Experience Description Quality",
                    weight: 20,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No professional experience descriptions available.",
                    evidence: []
                },
                relevantTechnologies: {
                    name: "Relevant Technologies and Skills",
                    weight: 15,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No workplace technology stack recorded.",
                    evidence: []
                },
                timelineClarity: {
                    name: "Employment Timeline Clarity",
                    weight: 15,
                    rating: 0,
                    earnedPoints: 0,
                    explanation: "No employment timeline available.",
                    evidence: []
                }
            },
            roles: [],
            findings,
            evidence: [],
            limitations
        };
    }

    // ----------------------------------------------------
    // SCENARIO C: Standard Work Experience / Internships
    // ----------------------------------------------------
    const roles = rawExperience.map(exp => {
        const title = exp.role || exp.title || null;
        const company = exp.company || null;
        const isIntern = isInternshipEntry(exp);
        const duration = `${exp.startDate || ""} - ${exp.endDate || (exp.isCurrent ? "Present" : "")}`.trim();
        const desc = exp.description || "";
        const technologies = Array.isArray(exp.technologies) ? exp.technologies : [];

        // Check for achievements with numbers/percentages
        const hasMetric = /\b(?:\d+%\b|\$\d+|\d+\s*users|\d+\s*x\b|reduced|increased|improved|optimized|achieved)/i.test(desc);

        return {
            title,
            company,
            duration: duration !== "-" ? duration : null,
            isCurrent: Boolean(exp.isCurrent || (exp.endDate && /present|current/i.test(exp.endDate))),
            isInternship: isIntern,
            technologies,
            responsibilitiesCount: desc.split(/[.\n•;]+/).filter(s => s.trim().length > 10).length,
            achievementsCount: hasMetric ? 1 : 0
        };
    });

    // 1. Role and Responsibility Clarity (Weight: 25%)
    let roleRating = 0;
    const allHaveTitles = roles.every(r => r.title && r.company);
    const totalResponsibilities = roles.reduce((sum, r) => sum + r.responsibilitiesCount, 0);

    if (allHaveTitles && totalResponsibilities >= 4) {
        roleRating = 100;
        evidence.push(`Documented ${roles.length} roles with clear titles and responsibilities.`);
    } else if (allHaveTitles && totalResponsibilities >= 2) {
        roleRating = 80;
        evidence.push(`Documented ${roles.length} roles with defined responsibilities.`);
    } else if (roles.some(r => r.title)) {
        roleRating = 60;
    } else {
        roleRating = 30;
        limitations.push("Role titles or company names are partially missing.");
    }
    const roleEarned = (roleRating / 100) * 25;
    const roleExplanation = allHaveTitles
        ? `Identified ${roles.length} professional positions with defined job titles and organizational context.`
        : "Some work experience entries lack clear job titles or employer information.";

    // 2. Achievement and Impact Evidence (Weight: 25%)
    let impactRating = 0;
    const rolesWithImpact = roles.filter(r => r.achievementsCount > 0);
    if (rolesWithImpact.length >= 2) {
        impactRating = 100;
        evidence.push(`Quantified impact and metrics found across ${rolesWithImpact.length} roles.`);
    } else if (rolesWithImpact.length === 1) {
        impactRating = 75;
        evidence.push("Quantified outcomes and measurable impact identified in at least one position.");
    } else {
        impactRating = 45;
        limitations.push("Experience bullets describe tasks and responsibilities, but lack measurable metrics (e.g., %, scale, latency improvements).");
    }
    const impactEarned = (impactRating / 100) * 25;
    const impactExplanation = rolesWithImpact.length > 0
        ? `Contains outcome-driven evidence of accomplishment in ${rolesWithImpact.length} positions.`
        : "Responsibilities are listed, but measurable business impact or quantified metrics are missing.";

    // 3. Experience Description Quality (Weight: 20%)
    let descRating = 0;
    const hasSubstantiveDescriptions = rawExperience.every(e => (e.description || "").trim().length >= 40);
    if (hasSubstantiveDescriptions) {
        descRating = 100;
    } else if (rawExperience.some(e => (e.description || "").trim().length >= 30)) {
        descRating = 75;
    } else {
        descRating = 40;
    }
    const descEarned = (descRating / 100) * 20;
    const descExplanation = hasSubstantiveDescriptions
        ? "Work experience contains comprehensive, active descriptions of daily execution and systems."
        : "Some experience descriptions are brief or lack depth.";

    // 4. Relevant Technologies and Skills (Weight: 15%)
    let techRating = 0;
    const totalExpTech = roles.reduce((sum, r) => sum + r.technologies.length, 0);
    const mentionsTechInText = rawExperience.some(e => /(?:react|node|python|java|sql|aws|docker|git|api)/i.test(e.description || ""));

    if (totalExpTech >= 5 || (totalExpTech >= 2 && mentionsTechInText)) {
        techRating = 100;
        evidence.push("Technical stacks and tools are directly linked to employment roles.");
    } else if (mentionsTechInText || totalExpTech > 0) {
        techRating = 75;
    } else {
        techRating = 40;
        limitations.push("Technologies used in each role are not explicitly tagged.");
    }
    const techEarned = (techRating / 100) * 15;
    const techExplanation = techRating >= 75
        ? "Employment records clearly associate relevant technologies and tools with delivered responsibilities."
        : "Technologies utilized in each position could be more clearly articulated.";

    // 5. Employment Timeline Clarity (Weight: 15%)
    let timelineRating = 0;
    const allHaveDates = roles.every(r => r.duration && r.duration.length > 3);
    const hasCurrentJob = roles.some(r => r.isCurrent);

    if (allHaveDates && hasCurrentJob) {
        timelineRating = 100;
        evidence.push("Chronological employment timeline with active current position.");
    } else if (allHaveDates) {
        timelineRating = 90;
        evidence.push("Employment dates provided for all recorded positions.");
    } else {
        timelineRating = 55;
        limitations.push("Employment start or end dates are missing for one or more roles.");
    }
    const timelineEarned = (timelineRating / 100) * 15;
    const timelineExplanation = allHaveDates
        ? `Timeline is consistent across all ${roles.length} positions.${hasCurrentJob ? " Active employment noted." : ""}`
        : "Some employment dates are incomplete or unstated.";

    // Calculate composite experience rating
    const experienceRating = Math.round(roleEarned + impactEarned + descEarned + techEarned + timelineEarned);
    const experienceEarnedPoints = Math.round(((experienceRating / 100) * 20) * 10) / 10;

    if (hasInternships) {
        findings.push(`Includes practical internship experience (${roles.filter(r => r.isInternship).length} internships).`);
    }

    return {
        category: "Experience",
        rating: Math.max(0, Math.min(100, experienceRating)),
        weight: 20,
        earnedPoints: experienceEarnedPoints,
        status: experienceRating < 50 ? "needs_attention" : "evaluated",
        fresherPolicyApplied: isFresher || allInternships,
        fresherPolicyDetails: {
            isFresher: isFresher || allInternships,
            hasInternships,
            hasProjects,
            policyNote: allInternships
                ? "Internship experience evaluated constructively towards overall professional capability."
                : "Standard professional employment evaluation applied."
        },
        parameters: {
            roleResponsibilityClarity: {
                name: "Role and Responsibility Clarity",
                weight: 25,
                rating: roleRating,
                earnedPoints: Math.round(roleEarned * 10) / 10,
                explanation: roleExplanation,
                evidence: roles.map(r => r.title).filter(Boolean)
            },
            achievementImpactEvidence: {
                name: "Achievement and Impact Evidence",
                weight: 25,
                rating: impactRating,
                earnedPoints: Math.round(impactEarned * 10) / 10,
                explanation: impactExplanation,
                evidence: []
            },
            descriptionQuality: {
                name: "Experience Description Quality",
                weight: 20,
                rating: descRating,
                earnedPoints: Math.round(descEarned * 10) / 10,
                explanation: descExplanation,
                evidence: []
            },
            relevantTechnologies: {
                name: "Relevant Technologies and Skills",
                weight: 15,
                rating: techRating,
                earnedPoints: Math.round(techEarned * 10) / 10,
                explanation: techExplanation,
                evidence: []
            },
            timelineClarity: {
                name: "Employment Timeline Clarity",
                weight: 15,
                rating: timelineRating,
                earnedPoints: Math.round(timelineEarned * 10) / 10,
                explanation: timelineExplanation,
                evidence: []
            }
        },
        roles,
        findings,
        evidence,
        limitations
    };
};

/**
 * PHASE 7: Complete Detailed Resume Scoring & Overall Score Integration
 * 
 * Category Weights:
 * - Content Quality: 25
 * - Skills: 20 (evaluated in detail)
 * - Experience: 20 (evaluated in detail with fresher policy)
 * - Projects: 15
 * - Education: 10 (evaluated in detail)
 * - Clarity: 10
 * Total = 100
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {string} [params.rawText]
 * @param {number} params.resumeId
 * @param {number} params.userId
 * @returns {object} Validated response matching detailedResumeScoreResponseSchema
 */
export const calculateDetailedResumeScore = ({ structuredResume = {}, rawText = "", resumeId, userId }) => {
    // 1. Evaluate detailed categories
    const skills = evaluateSkills({ structuredResume, rawText });
    const education = evaluateEducation({ structuredResume, rawText });
    const experience = evaluateExperience({ structuredResume, rawText });

    // 2. Evaluate remaining Lesson 6.1 categories: Content Quality (25), Projects (15), Clarity (10)
    // A. Content Quality (Weight: 25)
    let contentQualityEarned = 0;
    const summaryLen = (structuredResume.professionalSummary || "").trim().split(/\s+/).filter(Boolean).length;
    if (summaryLen >= 15) contentQualityEarned += 10;
    else if (summaryLen > 0) contentQualityEarned += 5;

    if (structuredResume.personalInfo?.email) contentQualityEarned += 4;
    if (structuredResume.personalInfo?.phone) contentQualityEarned += 4;
    if (structuredResume.personalInfo?.location) contentQualityEarned += 2;
    if (structuredResume.personalInfo?.linkedin) contentQualityEarned += 3;
    if (structuredResume.personalInfo?.github || structuredResume.personalInfo?.portfolio) contentQualityEarned += 2;
    contentQualityEarned = Math.min(25, contentQualityEarned);

    // B. Projects Quality (Weight: 15)
    let projectsEarned = 0;
    const projectsList = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];
    if (projectsList.length >= 2) projectsEarned += 10;
    else if (projectsList.length === 1) projectsEarned += 7;

    const hasTechList = projectsList.some(p => (p.technologies || []).length > 0);
    if (hasTechList) projectsEarned += 3;

    const hasProjectDesc = projectsList.some(p => (p.description || "").trim().length > 30);
    if (hasProjectDesc) projectsEarned += 2;
    projectsEarned = Math.min(15, projectsEarned);

    // C. Clarity & Completeness (Weight: 10)
    let clarityEarned = 0;
    const wordCount = structuredResume.metadata?.wordCount || (rawText || "").split(/\s+/).filter(Boolean).length;
    if (wordCount >= 200 && wordCount <= 1200) clarityEarned += 4;
    else if (wordCount > 50) clarityEarned += 2;

    const coreSectionsCount = [
        Boolean(structuredResume.personalInfo?.email || structuredResume.personalInfo?.phone),
        skills.normalizedSkills.length > 0,
        education.qualifications.length > 0,
        projectsList.length > 0 || (structuredResume.experience || []).length > 0
    ].filter(Boolean).length;

    if (coreSectionsCount === 4) clarityEarned += 4;
    else if (coreSectionsCount >= 3) clarityEarned += 2;

    if ((structuredResume.certifications || []).length > 0 || (structuredResume.achievements || []).length > 0) {
        clarityEarned += 2;
    }
    clarityEarned = Math.min(10, clarityEarned);

    // 3. Composite Calculation with Transparent Fresher Normalization if Applicable
    const isExperienceNotApplicable = experience.status === "not_applicable_fresher";
    let totalScore = 0;
    let isNormalized = false;

    const rawEarnedSum =
        contentQualityEarned +
        skills.earnedPoints +
        experience.earnedPoints +
        projectsEarned +
        education.earnedPoints +
        clarityEarned;

    if (isExperienceNotApplicable) {
        // Experience is 0 because candidate is fresher with 0 experience and 0 projects
        // Normalize over the remaining 80 applicable points
        isNormalized = true;
        totalScore = Math.min(100, Math.round((rawEarnedSum / 80) * 100));
    } else {
        totalScore = Math.min(100, Math.round(rawEarnedSum));
    }

    const summaryNotes = [
        `Skills: ${skills.rating}/100 (${skills.earnedPoints} pts)`,
        `Education: ${education.rating}/100 (${education.earnedPoints} pts)`,
        `Experience: ${experience.rating}/100 (${experience.earnedPoints} pts)`
    ];

    if (experience.fresherPolicyApplied) {
        summaryNotes.push(experience.fresherPolicyDetails.policyNote);
    }

    const payload = {
        resumeId: Number(resumeId),
        userId: Number(userId),
        overallScore: totalScore,
        scoringVersion: "1.1.0",
        scoredAt: new Date().toISOString(),
        fresherPolicyApplied: experience.fresherPolicyApplied,
        categories: {
            skills,
            education,
            experience
        },
        integratedOverallBreakdown: {
            contentQuality: contentQualityEarned,
            skills: skills.earnedPoints,
            experience: experience.earnedPoints,
            projects: projectsEarned,
            education: education.earnedPoints,
            clarity: clarityEarned,
            totalScore,
            isNormalized
        },
        summaryNotes
    };

    // Strict validation against master Zod schema
    return detailedResumeScoreResponseSchema.parse(payload);
};

/**
 * PHASE 9: Persist Detailed Scoring Record into MySQL
 * 
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.resumeId
 * @param {number} [params.analysisId]
 * @param {object} params.detailedResult
 * @returns {Promise<object>} Persistence confirmation
 */
export const saveDetailedScoreRecord = async ({ userId, resumeId, analysisId, detailedResult }) => {
    let resolvedAnalysisId = analysisId;

    // 1. If analysisId is not provided, locate latest completed analysis or create an anchor record
    if (!resolvedAnalysisId) {
        const [existing] = await db.execute(
            `SELECT analysis_id 
             FROM resume_analyses 
             WHERE resume_id = ? AND user_id = ? 
             ORDER BY analysis_id DESC 
             LIMIT 1`,
            [resumeId, userId]
        );

        if (existing.length > 0) {
            resolvedAnalysisId = existing[0].analysis_id;
        } else {
            const [insert] = await db.execute(
                `INSERT INTO resume_analyses 
                 (user_id, resume_id, analysis_status, analysis_type, ai_model, overall_score, analyzed_at)
                 VALUES (?, ?, 'completed', 'rule_based', 'detailed-scoring-engine', ?, NOW())`,
                [userId, resumeId, detailedResult.overallScore]
            );
            resolvedAnalysisId = insert.insertId;
        }
    }

    const serializedDetailedResult = JSON.stringify(detailedResult);

    // 2. Upsert into resume_scores table
    await db.execute(
        `INSERT INTO resume_scores 
         (analysis_id, user_id, resume_id, overall_score, skills_score, experience_score, education_score, detailed_result, scoring_version, scored_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1.1.0', NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
             user_id = VALUES(user_id),
             resume_id = VALUES(resume_id),
             overall_score = VALUES(overall_score),
             skills_score = VALUES(skills_score),
             experience_score = VALUES(experience_score),
             education_score = VALUES(education_score),
             detailed_result = VALUES(detailed_result),
             scoring_version = '1.1.0',
             scored_at = NOW()`,
        [
            resolvedAnalysisId,
            userId,
            resumeId,
            detailedResult.overallScore,
            detailedResult.categories.skills.rating,
            detailedResult.categories.experience.rating,
            detailedResult.categories.education.rating,
            serializedDetailedResult
        ]
    );

    return {
        analysisId: resolvedAnalysisId,
        resumeId,
        userId,
        overallScore: detailedResult.overallScore,
        skillsScore: detailedResult.categories.skills.rating,
        educationScore: detailedResult.categories.education.rating,
        experienceScore: detailedResult.categories.experience.rating,
        scoringVersion: "1.1.0"
    };
};

/**
 * PHASE 10: Run complete Detailed Scoring Workflow
 * 
 * @param {object} params
 * @param {string|number} params.resumeId
 * @param {number} params.userId
 * @returns {Promise<object>}
 */
export const runDetailedScoringWorkflow = async ({ resumeId, userId }) => {
    const parsedResumeId = parseInt(resumeId, 10);
    if (!parsedResumeId || isNaN(parsedResumeId) || parsedResumeId <= 0) {
        throw new AnalysisWorkflowError("Invalid resume ID", 400, "INVALID_RESUME_ID");
    }

    // 1. Resolve storage file strictly verifying tenant ownership
    const fileInfo = await getResumeFileForPreviewOrDownload({ resumeId: parsedResumeId, userId });

    const isDocx =
        fileInfo.fileType === "docx" ||
        fileInfo.originalFilename?.toLowerCase().endsWith(".docx") ||
        fileInfo.mimeType?.includes("wordprocessingml");

    const sourceType = isDocx ? "docx" : "pdf";

    // 2. Extract plain text
    let rawText = "";
    if (isDocx) {
        const extraction = await extractTextFromDocx(fileInfo.filePath);
        rawText = extraction.extractedText;
    } else {
        const extraction = await extractTextFromPdf(fileInfo.filePath);
        rawText = extraction.extractedText;
    }

    // 3. Update extracted_text in DB if not set
    await updateResumeExtractedText({
        resumeId: fileInfo.resumeId,
        userId,
        extractedText: rawText
    });

    // 4. Structure content deterministically
    const structuredResume = structureResumeContent(rawText, {
        sourceType,
        resumeId: fileInfo.resumeId
    });

    // 5. Calculate detailed score
    const detailedResult = calculateDetailedResumeScore({
        structuredResume,
        rawText,
        resumeId: fileInfo.resumeId,
        userId
    });

    // 6. Persist to MySQL
    const saved = await saveDetailedScoreRecord({
        userId,
        resumeId: fileInfo.resumeId,
        detailedResult
    });

    return {
        ...detailedResult,
        analysisId: saved.analysisId
    };
};

/**
 * Fetch latest detailed scoring record from MySQL
 * 
 * @param {object} params
 * @param {string|number} params.resumeId
 * @param {number} params.userId
 * @returns {Promise<object|null>}
 */
export const getLatestDetailedScoreForResume = async ({ resumeId, userId }) => {
    const parsedResumeId = parseInt(resumeId, 10);
    if (!parsedResumeId || isNaN(parsedResumeId) || parsedResumeId <= 0) {
        throw new AnalysisWorkflowError("Invalid resume ID", 400, "INVALID_RESUME_ID");
    }

    // 1. Verify resume existence and verify strict tenant ownership
    const [resumeRows] = await db.execute(
        `SELECT resume_id, user_id FROM resumes WHERE resume_id = ? AND deleted_at IS NULL`,
        [parsedResumeId]
    );

    if (!resumeRows.length) {
        return null;
    }

    if (resumeRows[0].user_id !== userId) {
        throw new AnalysisWorkflowError("Access denied: you do not own this resource", 403, "FORBIDDEN_RESOURCE");
    }

    // 2. Query resume_scores
    const [rows] = await db.execute(
        `SELECT 
            score_id,
            analysis_id,
            user_id,
            resume_id,
            overall_score,
            skills_score,
            experience_score,
            education_score,
            detailed_result,
            scoring_version,
            scored_at
         FROM resume_scores
         WHERE resume_id = ?
         ORDER BY score_id DESC
         LIMIT 1`,
        [parsedResumeId]
    );

    if (!rows.length || !rows[0].detailed_result) {
        return null;
    }

    const row = rows[0];
    let parsedDetailed = null;
    try {
        parsedDetailed = typeof row.detailed_result === "string" ? JSON.parse(row.detailed_result) : row.detailed_result;
    } catch {
        parsedDetailed = row.detailed_result;
    }

    return {
        scoreId: row.score_id,
        analysisId: row.analysis_id,
        resumeId: row.resume_id,
        userId: row.user_id,
        overallScore: Number(row.overall_score),
        skillsScore: Number(row.skills_score),
        experienceScore: Number(row.experience_score),
        educationScore: Number(row.education_score),
        scoringVersion: row.scoring_version,
        scoredAt: row.scored_at,
        detailedResult: parsedDetailed
    };
};

export default {
    normalizeSkillName,
    categorizeSkill,
    evaluateSkills,
    evaluateEducation,
    evaluateExperience,
    calculateDetailedResumeScore,
    saveDetailedScoreRecord,
    runDetailedScoringWorkflow,
    getLatestDetailedScoreForResume
};
