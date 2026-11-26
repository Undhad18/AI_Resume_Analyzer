/**
 * Resume Improvement Suggestions Service (Lesson 7.3)
 * Generates grounded, prioritized, actionable suggestions across 10 standard categories.
 * 100% Deterministic Rule-Based Engine (Zero OpenAI API calls in Free Mode).
 */

import {
    SUGGESTION_CATEGORIES_ENUM
} from "../validators/improvementSuggestionsSchema.js";
import { extractJobKeywords } from "./keywordDetectionService.js";

/**
 * Deduplicate suggestions by normalized title and category
 */
const deduplicateSuggestions = (suggestions) => {
    const seen = new Set();
    const unique = [];

    for (const sug of suggestions) {
        const key = `${sug.category}:${sug.title.toLowerCase().trim()}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(sug);
        }
    }

    return unique;
};

/**
 * Counts suggestions by category and priority
 */
export const calculateSuggestionMetrics = (suggestions) => {
    const categoryCounts = {};
    for (const cat of SUGGESTION_CATEGORIES_ENUM) {
        categoryCounts[cat] = 0;
    }

    let highPriorityCount = 0;
    let mediumPriorityCount = 0;
    let lowPriorityCount = 0;

    for (const sug of suggestions) {
        if (categoryCounts[sug.category] !== undefined) {
            categoryCounts[sug.category] += 1;
        } else {
            categoryCounts[sug.category] = 1;
        }

        if (sug.priority === "high") highPriorityCount++;
        else if (sug.priority === "medium") mediumPriorityCount++;
        else if (sug.priority === "low") lowPriorityCount++;
    }

    return {
        totalSuggestions: suggestions.length,
        highPriorityCount,
        mediumPriorityCount,
        lowPriorityCount,
        categoryCounts,
        priorityCounts: {
            high: highPriorityCount,
            medium: mediumPriorityCount,
            low: lowPriorityCount
        }
    };
};

/**
 * Generate deterministic rule-based improvement suggestions (Free Mode)
 * 
 * @param {object} params
 * @param {object} params.structuredResume - Validated structured resume object
 * @param {string} [params.rawText=""] - Raw resume document text
 * @param {object} [params.formattingGrammarData=null] - Formatting & Grammar findings from Lesson 6.4
 * @param {object} [params.strengthsWeaknessesData=null] - Strengths & Weaknesses findings from Lesson 7.1
 * @param {object} [params.skillsKeywordsData=null] - Missing skills & keywords from Lesson 7.2
 * @param {string} [params.jobDescription=""] - Optional target job description
 * @returns {Array<object>} List of validated suggestions
 */
export const generateRuleBasedSuggestions = ({
    structuredResume = {},
    rawText = "",
    formattingGrammarData = null,
    strengthsWeaknessesData = null,
    skillsKeywordsData = null,
    jobDescription = ""
}) => {
    const suggestions = [];
    let counter = 1;

    const createId = (prefix) => `sug_${prefix}_${counter++}`;

    const summary = (structuredResume.professionalSummary || "").trim();
    const experiences = Array.isArray(structuredResume.experience) ? structuredResume.experience : [];
    const education = Array.isArray(structuredResume.education) ? structuredResume.education : [];
    const skills = Array.isArray(structuredResume.skills) ? structuredResume.skills : [];
    const projects = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];
    const certs = Array.isArray(structuredResume.certifications) ? structuredResume.certifications : [];
    const personalInfo = structuredResume.personalInfo || {};

    // Determine candidate profile
    const isFresher = experiences.length === 0;

    // ----------------------------------------------------
    // 1. PROFESSIONAL SUMMARY
    // ----------------------------------------------------
    if (!summary || summary.length < 25) {
        suggestions.push({
            id: createId("summary"),
            title: "Add a Targeted Professional Summary",
            category: "professional_summary",
            priority: "high",
            problem: "The resume does not include an introductory career summary or profile statement.",
            whyItMatters: "Recruiters and ATS parsers scan the top 20% of your resume first. A strong summary defines your core technical stack, specialization, and career goals in 5 seconds.",
            recommendedAction: "Add a concise 3-4 sentence summary at the top of your resume highlighting your primary role, core technologies, and key strengths.",
            evidence: summary ? [`Current summary is too brief (${summary.length} characters): "${summary}"`] : ["Professional summary section is absent or empty."],
            example: {
                before: null,
                after: "Results-driven Full Stack Developer with experience in React, Node.js, and SQL databases. Proven track record building responsive web applications and scalable REST APIs with a focus on code quality and performance."
            },
            source: "rule_based",
            confidence: 0.95,
            status: "pending"
        });
    } else {
        // Check for generic buzzwords without substance
        const genericBuzzwords = ["hardworking", "self-starter", "team player", "passionate individual", "go-getter", "detail-oriented"];
        const foundBuzzwords = genericBuzzwords.filter(b => summary.toLowerCase().includes(b));
        if (foundBuzzwords.length >= 2) {
            suggestions.push({
                id: createId("summary"),
                title: "Replace Subjective Buzzwords with Concrete Capabilities",
                category: "professional_summary",
                priority: "medium",
                problem: `Summary relies on subjective buzzwords (${foundBuzzwords.map(b => `"${b}"`).join(", ")}) rather than demonstrated competencies.`,
                whyItMatters: "Hiring managers look for verifiable technical skills and domain strengths rather than self-proclaimed soft qualities.",
                recommendedAction: "Replace vague adjectives with specific technical specializations, years of experience, or flagship tools you build with.",
                evidence: [`Found subjective terms in summary: ${foundBuzzwords.join(", ")}`],
                example: {
                    before: `I am a hardworking and passionate team player looking for opportunities.`,
                    after: `Full Stack Engineer specializing in React frontend development, RESTful API design, and automated testing.`
                },
                source: "rule_based",
                confidence: 0.85,
                status: "pending"
            });
        }
    }

    // ----------------------------------------------------
    // 2. SKILLS
    // ----------------------------------------------------
    if (skills.length === 0) {
        suggestions.push({
            id: createId("skills"),
            title: "Add a Dedicated Technical Skills Section",
            category: "skills",
            priority: "high",
            problem: "No dedicated skills section was detected in the structured resume.",
            whyItMatters: "ATS systems index technical skills directly for recruiter keyword matching. Without a clear skills taxonomy, candidate resumes often fail initial automated screening filters.",
            recommendedAction: "Create a prominent 'Technical Skills' section organized by clear categories (Languages, Frameworks, Databases, Tools).",
            evidence: ["Skills list is empty in structured resume."],
            example: {
                before: null,
                after: "Languages: JavaScript, TypeScript, Python | Frameworks: React, Express, Node.js | Databases: PostgreSQL, MongoDB | Tools: Git, Docker, Jest"
            },
            source: "rule_based",
            confidence: 0.95,
            status: "pending"
        });
    } else {
        // Check unverified skills from Lesson 7.2 or structured comparison
        const skillNames = skills.map(s => typeof s === "string" ? s : s.name).filter(Boolean);
        const lowerRaw = rawText.toLowerCase();

        // Check if skills list is just a flat unstructured blob (> 10 items without categorization)
        if (skillNames.length >= 10 && !rawText.includes("Languages:") && !rawText.includes("Frameworks:") && !rawText.includes("Databases:")) {
            suggestions.push({
                id: createId("skills"),
                title: "Group Technical Skills into Logical Categories",
                category: "skills",
                priority: "low",
                problem: "Skills appear as an unformatted or flat list without categorized groupings.",
                whyItMatters: "Categorized skills are significantly easier for engineering managers to scan during 15-second visual reviews.",
                recommendedAction: "Organize skills into standard categories such as 'Languages', 'Frontend', 'Backend & Databases', and 'DevOps & Tools'.",
                evidence: [`Detected ${skillNames.length} flat skill items in resume.`],
                example: {
                    before: "JavaScript, React, Node.js, Docker, MongoDB, Jest, Git, CSS, HTML, Express, PostgreSQL",
                    after: "Languages: JavaScript, HTML5, CSS3 | Frameworks: React, Node.js, Express | Databases: PostgreSQL, MongoDB | Tools: Docker, Git, Jest"
                },
                source: "rule_based",
                confidence: 0.85,
                status: "pending"
            });
        }
    }

    // ----------------------------------------------------
    // 3. WORK EXPERIENCE
    // ----------------------------------------------------
    if (isFresher) {
        // Fresher Policy: Do NOT fabricate or penalize for missing corporate experience!
        suggestions.push({
            id: createId("experience"),
            title: "Elevate Practical Projects & Academic Experience",
            category: "work_experience",
            priority: "medium",
            problem: "No formal employment history detected (Entry-Level / Fresher profile).",
            whyItMatters: "For entry-level candidates, recruiters evaluate technical capability through hands-on project work, open-source contributions, and technical coursework.",
            recommendedAction: "Ensure your project work highlights real-world workflows (version control, automated testing, API consumption, deployment) to demonstrate workplace readiness without inventing employment.",
            evidence: ["No formal employment entries found in structured resume (Fresher profile detected)."],
            example: null,
            source: "rule_based",
            confidence: 0.9,
            status: "pending"
        });
    } else {
        // Experienced candidate: Check for passive responsibility language
        const passiveKeywords = ["responsible for", "helped with", "assisted in", "duties included", "worked on"];
        let passiveFoundCount = 0;
        const passiveEvidence = [];

        for (const exp of experiences) {
            const respList = Array.isArray(exp.responsibilities) ? exp.responsibilities : [exp.description].filter(Boolean);
            for (const r of respList) {
                const lowerR = r.toLowerCase();
                for (const pk of passiveKeywords) {
                    if (lowerR.includes(pk)) {
                        passiveFoundCount++;
                        passiveEvidence.push(`"${r.slice(0, 80)}..."`);
                        break;
                    }
                }
            }
        }

        if (passiveFoundCount > 0) {
            suggestions.push({
                id: createId("experience"),
                title: "Transform Passive Responsibilities into Impact Statements",
                category: "work_experience",
                priority: "high",
                problem: `Detected ${passiveFoundCount} experience statement(s) phrased as passive job duties rather than active achievements.`,
                whyItMatters: "Top employers look for what you accomplished and improved, not just what was on your job description.",
                recommendedAction: "Begin bullet points with strong action verbs (Engineered, Architected, Automated, Reduced, Spearheaded) and include measurable business or technical outcomes where possible.",
                evidence: passiveEvidence.slice(0, 2),
                example: {
                    before: "Responsible for developing backend REST APIs.",
                    after: "Engineered 14 RESTful microservice endpoints in Node.js, reducing server response latency by 28% and handling 50k+ daily queries."
                },
                source: "rule_based",
                confidence: 0.9,
                status: "pending"
            });
        }

        // Check if bullets lack quantitative metrics (numbers, %, $)
        let bulletsWithMetrics = 0;
        let totalBullets = 0;

        for (const exp of experiences) {
            const respList = Array.isArray(exp.responsibilities) ? exp.responsibilities : [exp.description].filter(Boolean);
            for (const r of respList) {
                totalBullets++;
                if (/\d+%|\d+\+?|\$\d+/i.test(r)) {
                    bulletsWithMetrics++;
                }
            }
        }

        if (totalBullets >= 3 && bulletsWithMetrics / totalBullets < 0.25) {
            suggestions.push({
                id: createId("experience"),
                title: "Quantify Achievements with Data & Scale",
                category: "work_experience",
                priority: "medium",
                problem: `Only ${bulletsWithMetrics} of ${totalBullets} experience bullet point(s) incorporate measurable metrics or scale indicators.`,
                whyItMatters: "Quantified bullets provide objective proof of your scope, speed, and real-world impact.",
                recommendedAction: "Incorporate genuine metrics such as user counts, load times, percentage improvements, test coverage numbers, or database records processed where you legitimately contributed to them. (Never fabricate figures).",
                evidence: [`${bulletsWithMetrics} of ${totalBullets} experience statements contain quantifiable metrics.`],
                example: {
                    before: "Improved database query speeds for user searches.",
                    after: "Optimized PostgreSQL indexes and query plans, cutting median search query latency from 450ms to 120ms."
                },
                source: "rule_based",
                confidence: 0.88,
                status: "pending"
            });
        }
    }

    // ----------------------------------------------------
    // 4. EDUCATION
    // ----------------------------------------------------
    if (education.length === 0) {
        suggestions.push({
            id: createId("education"),
            title: "Add Academic Background & Credentials",
            category: "education",
            priority: isFresher ? "high" : "medium",
            problem: "No education records detected in the structured resume.",
            whyItMatters: "Many automated filters check for completed or in-progress degrees, diploma programs, or verified technical coursework.",
            recommendedAction: "Add your degree, university or college name, field of study, and graduation year (or anticipated completion date).",
            evidence: ["Education section is empty in structured resume."],
            example: {
                before: null,
                after: "B.S. in Computer Science • State University, Graduated May 2024"
            },
            source: "rule_based",
            confidence: 0.95,
            status: "pending"
        });
    } else {
        // Check for missing degree or graduation date in existing education
        for (const edu of education) {
            const missingFields = [];
            if (!edu.degree || edu.degree.toLowerCase().includes("unknown")) missingFields.push("Degree / Qualification");
            if (!edu.institution || edu.institution.toLowerCase().includes("unknown")) missingFields.push("Institution Name");
            if (!edu.graduationYear && !edu.dates) missingFields.push("Graduation Year / Date");

            if (missingFields.length > 0) {
                suggestions.push({
                    id: createId("education"),
                    title: `Clarify Education Details (${missingFields.join(", ")})`,
                    category: "education",
                    priority: "medium",
                    problem: `Education entry is missing key academic metadata: ${missingFields.join(", ")}.`,
                    whyItMatters: "Incomplete academic entries can cause ATS parsers to misclassify your degree level.",
                    recommendedAction: `Explicitly state your ${missingFields.join(" and ")} in your education section.`,
                    evidence: [`Incomplete entry found: ${JSON.stringify(edu)}`],
                    example: null,
                    source: "rule_based",
                    confidence: 0.9,
                    status: "pending"
                });
                break;
            }
        }
    }

    // ----------------------------------------------------
    // 5. PROJECTS
    // ----------------------------------------------------
    if (projects.length === 0) {
        suggestions.push({
            id: createId("projects"),
            title: "Showcase Flagship Technical Projects",
            category: "projects",
            priority: isFresher ? "high" : "medium",
            problem: "No independent, academic, or professional projects found.",
            whyItMatters: "Projects provide concrete proof of applied engineering competence and tool fluency, especially when switching stacks or starting out.",
            recommendedAction: "Add 2 to 3 substantive projects detailing the problem solved, your architectural role, technologies used, and GitHub or live demo links.",
            evidence: ["Projects list is empty in structured resume."],
            example: {
                before: null,
                after: "AI Resume Analyzer: Architected full-stack MERN application with OpenAI API, Zod validation, and Tailwind CSS. Hosted on AWS with CI/CD pipeline."
            },
            source: "rule_based",
            confidence: 0.95,
            status: "pending"
        });
    } else {
        // Check for brief or vague project descriptions
        const weakProjects = projects.filter(p => !p.description || p.description.trim().length < 40);
        if (weakProjects.length > 0) {
            suggestions.push({
                id: createId("projects"),
                title: "Elaborate Project Contributions & Technologies",
                category: "projects",
                priority: "medium",
                problem: `${weakProjects.length} project description(s) lack sufficient technical depth or individual contribution details.`,
                whyItMatters: "Brief descriptions make it impossible for recruiters to evaluate what you actually built versus what was a template.",
                recommendedAction: "Expand project entries to detail: 1) What the app does, 2) Your specific contribution, and 3) The exact tools/libraries utilized.",
                evidence: weakProjects.map(p => `Project "${p.projectName || 'Untitled'}": description has only ${p.description ? p.description.length : 0} characters.`),
                example: {
                    before: "Built an e-commerce website with React.",
                    after: "Engineered single-page e-commerce app in React with Redux Toolkit for state management, Node.js REST API for order processing, and Stripe API integration."
                },
                source: "rule_based",
                confidence: 0.9,
                status: "pending"
            });
        }
    }

    // ----------------------------------------------------
    // 6. CERTIFICATIONS
    // ----------------------------------------------------
    if (certs.length === 0) {
        suggestions.push({
            id: createId("certifications"),
            title: "Consider Adding Relevant Accredited Certifications",
            category: "certifications",
            priority: "low",
            problem: "No professional certifications or specialized credentials detected.",
            whyItMatters: "Recognized industry certifications (e.g. AWS Certified Developer, CompTIA, Meta Professional Certificates) validate specialized competencies beyond degrees.",
            recommendedAction: "If you have completed recognized training or cloud certifications, add a dedicated Certifications section with credential names and issuing organizations. (Do not invent certifications).",
            evidence: ["No certifications found in structured resume."],
            example: null,
            source: "rule_based",
            confidence: 0.8,
            status: "pending"
        });
    }

    // ----------------------------------------------------
    // 7. KEYWORDS
    // ----------------------------------------------------
    if (jobDescription && jobDescription.trim().length > 0) {
        let missingTerms = [];
        if (skillsKeywordsData?.missingSkills && skillsKeywordsData.missingSkills.length > 0) {
            missingTerms = skillsKeywordsData.missingSkills.map(m => m.skill || m.normalizedName);
        } else {
            // Extract from job description directly
            try {
                const jdKeywords = extractJobKeywords(jobDescription);
                const lowerRaw = rawText.toLowerCase();
                const reqTerms = Array.isArray(jdKeywords.required) ? jdKeywords.required : [];
                const prefTerms = Array.isArray(jdKeywords.preferred) ? jdKeywords.preferred : [];
                const missingRequired = reqTerms.filter(k => {
                    const str = typeof k === "string" ? k : (k.normalizedTerm || k.term || "");
                    return str && !lowerRaw.includes(str.toLowerCase());
                });
                const missingPreferred = prefTerms.filter(k => {
                    const str = typeof k === "string" ? k : (k.normalizedTerm || k.term || "");
                    return str && !lowerRaw.includes(str.toLowerCase());
                });
                missingTerms = [...missingRequired, ...missingPreferred].map(k => typeof k === "string" ? k : (k.normalizedTerm || k.term));
            } catch {
                missingTerms = [];
            }
        }

        if (missingTerms.length > 0) {
            const topMissing = missingTerms.slice(0, 3);
            suggestions.push({
                id: createId("keywords"),
                title: `Incorporate Missing Job-Targeted Keywords (${topMissing.join(", ")})`,
                category: "keywords",
                priority: "high",
                problem: `Target job description emphasizes required competencies not detected in your resume: ${topMissing.join(", ")}.`,
                whyItMatters: "Applicant Tracking Systems score resumes based on keyword overlap with specific job specifications.",
                recommendedAction: `If you have legitimate experience with ${topMissing.join(", ")}, incorporate them into your skills, project descriptions, or experience bullets where applicable. (Never add skills you do not have).`,
                evidence: [`Target job requirements not detected in resume text: ${topMissing.join(", ")}`],
                example: null,
                source: "rule_based",
                confidence: 0.92,
                status: "pending"
            });
        }
    } else {
        // General profile keyword check: essential industry tools
        const essentialDevKeywords = ["git", "rest api", "testing", "ci/cd"];
        const lowerRawText = rawText.toLowerCase();
        const missingDevKeywords = essentialDevKeywords.filter(k => !lowerRawText.includes(k));

        if (missingDevKeywords.length > 0) {
            suggestions.push({
                id: createId("keywords"),
                title: `Highlight Essential Engineering Keywords (${missingDevKeywords.map(k => k.toUpperCase()).join(", ")})`,
                category: "keywords",
                priority: "medium",
                problem: `Standard modern development keywords (${missingDevKeywords.join(", ")}) are omitted from your resume text.`,
                whyItMatters: "Most technical screening algorithms filter candidates based on baseline version control, testing, and API integration capabilities.",
                recommendedAction: `If you have worked with ${missingDevKeywords.join(", ")}, explicitly mention them in your tools or project workflows.`,
                evidence: [`Baseline software keywords not detected in text: ${missingDevKeywords.join(", ")}`],
                example: null,
                source: "rule_based",
                confidence: 0.86,
                status: "pending"
            });
        }
    }

    // ----------------------------------------------------
    // 8. FORMATTING
    // ----------------------------------------------------
    if (formattingGrammarData?.formatting?.issues?.length > 0) {
        const issues = formattingGrammarData.formatting.issues;
        suggestions.push({
            id: createId("formatting"),
            title: "Standardize Layout & Document Formatting",
            category: "formatting",
            priority: "medium",
            problem: `Formatting analysis flagged ${issues.length} potential layout inconsistency: ${issues[0].message || issues[0]}.`,
            whyItMatters: "Consistent margins, uniform bullet styles, and standard chronological date formats ensure clean automated parsing by ATS engines.",
            recommendedAction: "Review font styles, ensure date formats use consistent standard notation (e.g. 'MMM YYYY' throughout), and maintain uniform bullet indentations.",
            evidence: issues.slice(0, 2).map(i => i.message || String(i)),
            example: null,
            source: "rule_based",
            confidence: 0.9,
            status: "pending"
        });
    } else {
        // General formatting heuristic: check document length
        const wordCount = rawText.trim().split(/\s+/).length;
        if (wordCount < 180) {
            suggestions.push({
                id: createId("formatting"),
                title: "Expand Resume Content & Structure",
                category: "formatting",
                priority: "medium",
                problem: `Resume content is sparse (approximately ${wordCount} words total).`,
                whyItMatters: "Resumes under 200 words typically lack sufficient detail for ATS parsers to assess skill depth and breadth.",
                recommendedAction: "Expand on project responsibilities, technical coursework, or technical skills to reach standard 1-page density (350-500 words).",
                evidence: [`Total word count is ${wordCount} words (ideal 1-page baseline is 350-550 words).`],
                example: null,
                source: "rule_based",
                confidence: 0.9,
                status: "pending"
            });
        }
    }

    // ----------------------------------------------------
    // 9. GRAMMAR
    // ----------------------------------------------------
    if (formattingGrammarData?.grammar?.issues?.length > 0) {
        const gIssues = formattingGrammarData.grammar.issues;
        suggestions.push({
            id: createId("grammar"),
            title: "Review Sentence Structure & Action Verbs",
            category: "grammar",
            priority: "medium",
            problem: `Grammar analysis identified potential phrasing or sentence structure improvements: ${gIssues[0].message || gIssues[0]}.`,
            whyItMatters: "Grammatical polish and consistent tense usage reflect professional communication capability and attention to detail.",
            recommendedAction: "Use past tense for completed prior roles, present tense for current active roles, and eliminate fragmented or run-on sentences.",
            evidence: gIssues.slice(0, 2).map(g => g.message || String(g)),
            example: null,
            source: "rule_based",
            confidence: 0.88,
            status: "pending"
        });
    }

    // ----------------------------------------------------
    // 10. COMPLETENESS
    // ----------------------------------------------------
    const missingContact = [];
    if (!personalInfo.email && !rawText.includes("@")) missingContact.push("Professional Email");
    if (!personalInfo.phone && !/\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b/.test(rawText)) missingContact.push("Phone Number");
    if (!personalInfo.linkedin && !rawText.toLowerCase().includes("linkedin.com")) missingContact.push("LinkedIn Profile");
    if (!personalInfo.github && !rawText.toLowerCase().includes("github.com")) missingContact.push("GitHub Profile");

    if (missingContact.length > 0) {
        suggestions.push({
            id: createId("completeness"),
            title: `Add Missing Contact Links (${missingContact.join(", ")})`,
            category: "completeness",
            priority: missingContact.includes("Professional Email") || missingContact.includes("Phone Number") ? "high" : "medium",
            problem: `Resume header is missing essential professional contact channels: ${missingContact.join(", ")}.`,
            whyItMatters: "Recruiters require direct contact channels, and technical screeners frequently inspect GitHub profiles and portfolio repositories to verify code quality.",
            recommendedAction: `Add your active ${missingContact.join(" and ")} prominently in the header section.`,
            evidence: [`Missing contact channels in header: ${missingContact.join(", ")}`],
            example: {
                before: null,
                after: "San Francisco, CA • (555) 123-4567 • alex@example.com • linkedin.com/in/alex • github.com/alex"
            },
            source: "rule_based",
            confidence: 0.95,
            status: "pending"
        });
    }

    // Deduplicate suggestions
    const uniqueSuggestions = deduplicateSuggestions(suggestions);

    return uniqueSuggestions;
};

export default {
    generateRuleBasedSuggestions,
    calculateSuggestionMetrics
};
