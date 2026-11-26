/**
 * Resume Weaknesses Detection Service
 * Evaluates constructive improvement areas across 12 core dimensions.
 * Strictly evidence-based, constructive, and respectful.
 * Special fresher handling: freshers/students without corporate experience are NOT penalized.
 */

import { CATEGORY_ENUM, IMPACT_ENUM, CONFIDENCE_ENUM } from "../validators/strengthsWeaknessesSchema.js";

/**
 * Common passive and vague phrases in job descriptions
 */
const PASSIVE_PHRASES = [
    "responsible for", "duties included", "worked on", "assisted with",
    "helped with", "handled various", "tasked with", "participated in"
];

/**
 * Strong technical action verbs
 */
const ACTION_VERBS = [
    "developed", "built", "engineered", "designed", "architected", "implemented",
    "led", "orchestrated", "automated", "optimized", "created", "spearheaded",
    "deployed", "refactored", "integrated", "streamlined", "configured"
];

/**
 * Detects constructive weaknesses and improvement opportunities
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {string} [params.rawText=""]
 * @returns {{ weaknesses: Array<object>, missingInformation: Array<object> }}
 */
export const detectResumeWeaknesses = ({ structuredResume = {}, rawText = "" }) => {
    const weaknesses = [];
    const missingInformation = [];
    let idCounter = 1;

    const addWeakness = ({ title, description, category, evidence, impact = "medium", confidence = "high", suggestion }) => {
        if (!Array.isArray(evidence) || evidence.length === 0) return;
        // Avoid duplicate titles
        if (weaknesses.some(w => w.title.toLowerCase() === title.toLowerCase())) return;

        weaknesses.push({
            id: `weakness_${idCounter++}`,
            title,
            description,
            category,
            evidence,
            impact,
            confidence,
            suggestion
        });
    };

    const addMissingInfo = ({ field, reason, importance = "medium" }) => {
        if (missingInformation.some(m => m.field === field)) return;
        missingInformation.push({ field, reason, importance });
    };

    const rawLower = (rawText || "").toLowerCase();
    const projects = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];
    const experiences = Array.isArray(structuredResume.experience) ? structuredResume.experience : [];
    const education = Array.isArray(structuredResume.education) ? structuredResume.education : [];
    const personalInfo = structuredResume.personalInfo || {};

    // Check if candidate is a fresher / entry-level / student
    const isFresher = experiences.length === 0 || 
        /student|fresher|undergraduate|bachelor|b\.tech|intern\b/i.test(
            `${structuredResume.professionalSummary || ""} ${education.map(e => e.degree).join(" ")}`
        );

    // 1. MISSING OR UNCLEAR PROFESSIONAL SUMMARY
    const summary = (structuredResume.professionalSummary || "").trim();
    if (!summary || summary.length < 25) {
        addWeakness({
            title: "Missing or Incomplete Professional Summary",
            description: "The resume does not include an introductory career summary to immediately orient recruiters on your technical expertise and primary domain.",
            category: "summary",
            evidence: [
                summary.length === 0
                    ? "No professional summary section was detected in the resume."
                    : `Summary is overly brief (${summary.length} characters): "${summary}".`
            ],
            impact: "medium",
            confidence: "high",
            suggestion: "Add a concise 2-3 sentence summary summarizing your primary tech stack, years of experience (or academic training), and career goals."
        });
        addMissingInfo({
            field: "professional_summary",
            reason: "No comprehensive professional summary section was found.",
            importance: "medium"
        });
    }

    // 2. SKILLS WITHOUT SUPPORTING EVIDENCE
    const rawSkills = Array.isArray(structuredResume.skills) ? structuredResume.skills : [];
    const validSkills = rawSkills
        .map(s => typeof s === "string" ? s.trim() : (s?.name || "").trim())
        .filter(s => s.length >= 2);

    const projectAndExpText = [
        ...projects.map(p => `${p.projectName || ""} ${p.description || ""} ${(p.technologies || []).join(" ")}`),
        ...experiences.map(e => `${e.jobTitle || ""} ${e.company || ""} ${(e.responsibilities || []).join(" ")}`)
    ].join(" ").toLowerCase();

    const unsupportedSkills = validSkills.filter(skill => {
        const sLower = skill.toLowerCase();
        return sLower.length >= 2 && !projectAndExpText.includes(sLower);
    });

    if (unsupportedSkills.length >= 2 && validSkills.length > 0) {
        const sampleUnsupported = unsupportedSkills.slice(0, 4);
        addWeakness({
            title: "Skills Without Supporting Evidence",
            description: `Declared skills (${sampleUnsupported.join(", ")}) are listed in the skills section but lack demonstration in work history or project descriptions.`,
            category: "skills",
            evidence: [
                `Skills not referenced in projects or experience descriptions: ${sampleUnsupported.join(", ")}.`
            ],
            impact: "medium",
            confidence: "high",
            suggestion: "Incorporate these skills into practical project descriptions or work bullet points demonstrating how and where you applied them."
        });
    }

    // 3. GENERAL OR UNCLEAR WORK DESCRIPTIONS (Only for non-freshers with experience entries)
    if (experiences.length > 0) {
        const passiveBullets = [];
        for (const exp of experiences) {
            const bullets = Array.isArray(exp.responsibilities) ? exp.responsibilities : [exp.description].filter(Boolean);
            for (const b of bullets) {
                const bLower = String(b).toLowerCase().trim();
                if (bLower.length < 25) {
                    passiveBullets.push(`Overly brief responsibility: "${b}"`);
                } else if (PASSIVE_PHRASES.some(phrase => bLower.startsWith(phrase))) {
                    passiveBullets.push(`Passive wording: "${b.slice(0, 70)}..."`);
                }
                if (passiveBullets.length >= 2) break;
            }
            if (passiveBullets.length >= 2) break;
        }

        if (passiveBullets.length > 0) {
            addWeakness({
                title: "General or Passive Work Descriptions",
                description: "Work experience descriptions rely on passive task listings or brief duty descriptions rather than strong, active individual contributions.",
                category: "experience",
                evidence: passiveBullets,
                impact: "medium",
                confidence: "high",
                suggestion: "Start each bullet point with a strong action verb (e.g. Developed, Architected, Automated) and describe your specific contributions."
            });
        }
    } else if (!isFresher) {
        // Only if candidate explicitly claims experienced level but has 0 experience entries
        addWeakness({
            title: "Absence of Documented Work Experience",
            description: "No formal employment or professional history was detected on the resume.",
            category: "experience",
            evidence: ["No work experience entries found in the resume."],
            impact: "high",
            confidence: "high",
            suggestion: "Add your previous employment, freelance engagements, or contract projects."
        });
    }

    // 4. MISSING PROJECT OUTCOMES & IMPACT
    if (projects.length > 0) {
        const projectsWithoutOutcome = projects.filter(p => {
            const desc = (p.description || "").toLowerCase();
            const hasMetricOrOutcome = /\b\d+(\.\d+)?%\b|\b(improved|reduced|increased|resulted|achieved|deployed|active users|starred|downloads)\b/i.test(desc);
            return desc.length > 0 && !hasMetricOrOutcome;
        });

        if (projectsWithoutOutcome.length > 0) {
            const projectNames = projectsWithoutOutcome.map(p => p.projectName || "Technical Project").slice(0, 2);
            addWeakness({
                title: "Missing Project Outcomes & Impact",
                description: "Project descriptions explain the technical implementation and features but do not explain the tangible result, performance gain, or user outcome.",
                category: "projects",
                evidence: [
                    `Projects detailing technical stack without measurable results: ${projectNames.join(", ")}.`
                ],
                impact: "medium",
                confidence: "high",
                suggestion: "Add an accurate explanation of each project's result, such as performance improvement, user adoption, problem solved, or business outcome."
            });
        }
    } else if (isFresher) {
        // If candidate is a fresher and ALSO has NO projects
        addWeakness({
            title: "Limited Practical Project Demonstrations",
            description: "For early-career and fresher candidates, practical projects serve as the primary proof of technical competence. No projects were detected.",
            category: "projects",
            evidence: ["No project portfolio entries detected in the resume."],
            impact: "high",
            confidence: "high",
            suggestion: "Build and document 2-3 comprehensive personal or academic projects showcasing full-stack or specialized engineering workflows."
        });
        addMissingInfo({
            field: "projects",
            reason: "No technical projects were documented.",
            importance: "high"
        });
    }

    // 5. LIMITED ACHIEVEMENT DESCRIPTIONS & METRICS
    const fullContent = `${rawText} ${JSON.stringify(structuredResume)}`;
    const hasAnyMetric = /\b\d+(\.\d+)?%\b|\b\$\d+|\b\d+\s*(users|clients|req\/s|rps)\b|\b(award|scholarship|hackathon|first place|winner|patent)\b/i.test(fullContent);

    if (!hasAnyMetric) {
        addWeakness({
            title: "Sparse Quantifiable Achievements",
            description: "The resume describes duties and technical builds without quantitative metrics or measurable evidence of success.",
            category: "achievements",
            evidence: [
                "No quantifiable metrics, percentages, speedups, or numerical outcomes were identified across experience and project descriptions."
            ],
            impact: "medium",
            confidence: "high",
            suggestion: "Quantify your achievements using metrics such as percentage gains, performance speedups, user counts, or code test coverage."
        });
    }

    // 6. MISSING OR UNCLEAR EDUCATION DETAILS
    if (education.length === 0) {
        addWeakness({
            title: "Missing Educational Background",
            description: "No formal degree, certification program, or academic institution was detected in the resume.",
            category: "education",
            evidence: ["Education section is entirely absent or empty."],
            impact: "high",
            confidence: "high",
            suggestion: "Add your formal degree, university or college name, graduation date, and field of study."
        });
        addMissingInfo({
            field: "education",
            reason: "Education credentials are missing.",
            importance: "high"
        });
    } else {
        const incompleteEdu = education.filter(e => !(e.degree || "").trim() || !(e.institution || "").trim());
        if (incompleteEdu.length > 0) {
            addWeakness({
                title: "Incomplete Education Details",
                description: "One or more education records lack essential information such as full degree title, major, or institution name.",
                category: "education",
                evidence: [
                    "Detected education entries with missing degree title or institution name."
                ],
                impact: "medium",
                confidence: "high",
                suggestion: "Include complete degree names (e.g. Bachelor of Technology in Computer Science), institution names, and graduation years."
            });
        }
    }

    // 7. UNCLEAR EMPLOYMENT DATES
    if (experiences.length > 0) {
        const undatedExp = experiences.filter(e => !(e.startDate || "").trim() && !(e.endDate || "").trim());
        if (undatedExp.length > 0) {
            const roleNames = undatedExp.map(e => e.jobTitle || "Role").slice(0, 2);
            addWeakness({
                title: "Unclear Employment Dates",
                description: "Work experience entries are missing explicit start and end dates, creating potential ambiguity in your career timeline.",
                category: "experience",
                evidence: [
                    `Roles without clear date ranges: ${roleNames.join(", ")}.`
                ],
                impact: "medium",
                confidence: "high",
                suggestion: "Include clear month and year date ranges (e.g., 'June 2022 – August 2023') for each position."
            });
        }
    }

    // 8. INCONSISTENT SECTION HEADINGS
    const rawLines = (rawText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const unusualHeadings = rawLines.filter(line => {
        return line.length < 35 && line === line.toUpperCase() && 
            /MISCELLANEOUS|THINGS I KNOW|RANDOM|STUFF|OTHER WORK/i.test(line);
    });

    if (unusualHeadings.length > 0) {
        addWeakness({
            title: "Inconsistent Section Headings",
            description: "Section headings deviate from standard industry conventions, which may reduce automated ATS parsing accuracy.",
            category: "structure",
            evidence: [
                `Non-standard heading format detected: "${unusualHeadings[0]}".`
            ],
            impact: "low",
            confidence: "medium",
            suggestion: "Adopt standard industry headings such as 'Work Experience', 'Technical Skills', 'Projects', and 'Education'."
        });
    }

    // 9. REPEATED CONTENT & REDUNDANCY
    const sentenceSet = new Set();
    const duplicateSentences = [];
    for (const line of rawLines) {
        if (line.length >= 30) {
            const normalized = line.toLowerCase().replace(/[^a-z0-9]/g, " ");
            if (sentenceSet.has(normalized)) {
                duplicateSentences.push(line);
            } else {
                sentenceSet.add(normalized);
            }
        }
    }

    if (duplicateSentences.length > 0) {
        addWeakness({
            title: "Repeated Content & Redundancy",
            description: "Identified identical or highly repetitive phrasing across multiple bullet points, creating unnecessary duplication.",
            category: "readability",
            evidence: [
                `Duplicate statement identified: "${duplicateSentences[0].slice(0, 80)}...".`
            ],
            impact: "low",
            confidence: "high",
            suggestion: "Remove duplicate statements and diversify your bullet points to showcase different responsibilities and technical skills."
        });
    }

    // 10. LONG OR UNCLEAR SENTENCES
    const longSentences = rawLines.filter(line => {
        const words = line.split(/\s+/).filter(Boolean);
        return words.length > 35 && !line.includes(";") && !line.includes("•");
    });

    if (longSentences.length > 0) {
        addWeakness({
            title: "Excessively Long Sentences",
            description: "Several bullet points or sentences contain over 35 words without clear breaks, impairing quick recruiter readability.",
            category: "readability",
            evidence: [
                `Long sentence detected (${longSentences[0].split(/\s+/).length} words): "${longSentences[0].slice(0, 90)}...".`
            ],
            impact: "low",
            confidence: "medium",
            suggestion: "Break long, run-on sentences into concise bullet points of 15 to 25 words focusing on action, context, and outcome."
        });
    }

    // 11. MISSING OPTIONAL PORTFOLIO OR PROFILE LINKS
    const hasPortfolio = Boolean(
        personalInfo.website ||
        personalInfo.linkedin ||
        personalInfo.github ||
        /github\.com|linkedin\.com|gitlab\.com|\.dev|\.io|\.com\b/i.test(
            `${personalInfo.links?.join(" ") || ""} ${rawLower}`
        )
    );

    if (!hasPortfolio) {
        addWeakness({
            title: "Missing Portfolio or Professional Profile Links",
            description: "The resume does not include links to an online portfolio, GitHub profile, or LinkedIn page.",
            category: "contact_information",
            evidence: [
                "No external portfolio, GitHub repository, or LinkedIn profile links were detected in contact details."
            ],
            impact: "low",
            confidence: "high",
            suggestion: "Add direct links to your GitHub profile, LinkedIn account, or live portfolio to allow recruiters to review your work."
        });
        addMissingInfo({
            field: "portfolio",
            reason: "No portfolio website, GitHub repository, or LinkedIn profile URL was detected.",
            importance: "low"
        });
    }

    // 12. INCOMPLETE CONTACT INFORMATION
    const hasEmail = Boolean(personalInfo.email || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(rawLower));
    const hasPhone = Boolean(personalInfo.phone || /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(rawLower));

    if (!hasEmail || !hasPhone) {
        const missingFields = [];
        if (!hasEmail) missingFields.push("Email");
        if (!hasPhone) missingFields.push("Phone Number");

        addWeakness({
            title: "Missing Essential Contact Information",
            description: `Vital contact information (${missingFields.join(" and ")}) was not detected in the header, hindering direct recruiter outreach.`,
            category: "contact_information",
            evidence: [
                `Missing essential contact fields: ${missingFields.join(", ")}.`
            ],
            impact: "high",
            confidence: "high",
            suggestion: "Ensure your email address and primary phone number are clearly visible at the top of your resume."
        });

        if (!hasEmail) {
            addMissingInfo({
                field: "email",
                reason: "No valid email address was detected in the contact information.",
                importance: "high"
            });
        }
        if (!hasPhone) {
            addMissingInfo({
                field: "phone",
                reason: "No contact phone number was detected in the contact information.",
                importance: "high"
            });
        }
    }

    return { weaknesses, missingInformation };
};

export default {
    detectResumeWeaknesses
};
