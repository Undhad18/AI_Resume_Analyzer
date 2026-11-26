/**
 * Resume Strengths Detection Service
 * Evaluates positive evidence across 10 core resume dimensions.
 * Strictly evidence-based: every strength requires direct citations from the resume content.
 * Never invents achievements, credentials, or experience.
 */

import { CATEGORY_ENUM, IMPORTANCE_ENUM, CONFIDENCE_ENUM } from "../validators/strengthsWeaknessesSchema.js";

/**
 * Standard action and achievement metric regex patterns
 */
const METRIC_PATTERNS = [
    /\b\d+(\.\d+)?%\b/, // Percentages (e.g., 25%, 99.9%)
    /\b\$\d+([kmb])?\b/i, // Currency (e.g., $50k, $1.2M)
    /\b\d+\s*(users|clients|customers|students|downloads|stars|requests|req\/s|rps)\b/i,
    /\b(reduced|improved|increased|boosted|accelerated|optimized|saved|scaled)\b[^\n,.]*\b\d+/i,
    /\b(award|scholarship|hackathon|first place|winner|published|patent|dean's list|honor)\b/i
];

/**
 * Common soft skill and collaboration keywords
 */
const SOFT_SKILLS_KEYWORDS = [
    "agile", "scrum", "kanban", "leadership", "collaboration", "mentoring",
    "problem solving", "cross-functional", "communication", "teamwork",
    "code review", "system design", "stakeholder management"
];

/**
 * Detects strengths across 10 dimensions with rigorous evidence validation
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {string} [params.rawText=""]
 * @returns {Array<object>} Validated strengths list
 */
export const detectResumeStrengths = ({ structuredResume = {}, rawText = "" }) => {
    const strengths = [];
    let idCounter = 1;

    const addStrength = ({ title, description, category, evidence, importance = "medium", confidence = "high" }) => {
        if (!Array.isArray(evidence) || evidence.length === 0) return;
        strengths.push({
            id: `strength_${idCounter++}`,
            title,
            description,
            category,
            evidence,
            importance,
            confidence
        });
    };

    const textLower = (rawText || "").toLowerCase();

    // 1. PROFESSIONAL SUMMARY STRENGTH
    const summary = (structuredResume.professionalSummary || "").trim();
    if (summary.length >= 35) {
        const words = summary.split(/\s+/).filter(Boolean);
        if (words.length >= 8) {
            const hasRoleOrFocus = /developer|engineer|specialist|analyst|architect|scientist|lead|full.?stack|front.?end|back.?end|student|graduate/i.test(summary);
            addStrength({
                title: "Clear Professional Summary",
                description: "The resume features a well-defined professional summary articulating career focus, core competencies, and professional direction.",
                category: "summary",
                evidence: [
                    `Professional summary excerpt: "${summary.length > 120 ? summary.slice(0, 120) + "..." : summary}"`
                ],
                importance: hasRoleOrFocus ? "high" : "medium",
                confidence: "high"
            });
        }
    }

    // 2. TECHNICAL SKILLS STRENGTH
    const rawSkills = Array.isArray(structuredResume.skills) ? structuredResume.skills : [];
    const validSkills = rawSkills
        .map(s => typeof s === "string" ? s.trim() : (s?.name || "").trim())
        .filter(s => s.length >= 2);

    if (validSkills.length >= 4) {
        addStrength({
            title: "Clearly Defined Technical Skillset",
            description: `The candidate explicitly highlights a comprehensive palette of ${validSkills.length} technical skills across development and engineering domains.`,
            category: "skills",
            evidence: [
                `Identified skills include: ${validSkills.slice(0, 6).join(", ")}${validSkills.length > 6 ? ` (+${validSkills.length - 6} more)` : ""}.`
            ],
            importance: "high",
            confidence: "high"
        });
    }

    // 3. SKILLS SUPPORTED BY PROJECTS & EXPERIENCE EVIDENCE
    const projects = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];
    const experiences = Array.isArray(structuredResume.experience) ? structuredResume.experience : [];

    const projectAndExpText = [
        ...projects.map(p => `${p.projectName || ""} ${p.description || ""} ${(p.technologies || []).join(" ")}`),
        ...experiences.map(e => `${e.jobTitle || ""} ${e.company || ""} ${(e.responsibilities || []).join(" ")}`)
    ].join(" ").toLowerCase();

    const supportedSkills = validSkills.filter(skill => {
        const sLower = skill.toLowerCase();
        return sLower.length >= 2 && projectAndExpText.includes(sLower);
    });

    if (supportedSkills.length >= 2) {
        const citations = [];
        // Extract up to 2 specific evidence statements from projects
        for (const proj of projects) {
            const projTech = (proj.technologies || []).map(t => String(t).toLowerCase());
            const matched = supportedSkills.filter(s => projTech.includes(s.toLowerCase()));
            if (matched.length > 0) {
                citations.push(`Project "${proj.projectName || "Practical Project"}" implements ${matched.slice(0, 3).join(", ")}.`);
                if (citations.length >= 2) break;
            }
        }

        if (citations.length === 0) {
            citations.push(`Technical skills (${supportedSkills.slice(0, 4).join(", ")}) are directly cited within project implementation details and work descriptions.`);
        }

        addStrength({
            title: "Hands-on Practical Skill Application",
            description: `Key technical skills (${supportedSkills.slice(0, 4).join(", ")}) are supported by practical project and experience evidence, demonstrating hands-on proficiency rather than standalone claims.`,
            category: "projects",
            evidence: citations,
            importance: "high",
            confidence: "high"
        });
    }

    // 4. SOFT SKILLS & COLLABORATION STRENGTH
    const detectedSoftSkills = SOFT_SKILLS_KEYWORDS.filter(kw => textLower.includes(kw));
    if (detectedSoftSkills.length >= 2) {
        addStrength({
            title: "Demonstrated Professional & Collaborative Competencies",
            description: "The resume incorporates vital interpersonal, agile, and collaboration capabilities necessary for effective cross-functional team delivery.",
            category: "skills",
            evidence: [
                `Detected collaborative competencies: ${detectedSoftSkills.slice(0, 4).join(", ")}.`
            ],
            importance: "medium",
            confidence: "high"
        });
    }

    // 5. WORK EXPERIENCE / INTERNSHIP STRENGTH
    if (experiences.length > 0) {
        const hasDetailedBullets = experiences.some(e => Array.isArray(e.responsibilities) && e.responsibilities.length >= 2);
        const roles = experiences.map(e => `${e.jobTitle || "Role"} at ${e.company || "Organization"}`);
        const isInternship = experiences.every(e => /intern|internship|trainee/i.test(`${e.jobTitle} ${e.company}`));

        addStrength({
            title: isInternship ? "Relevant Internship Experience" : "Structured Work Experience",
            description: isInternship
                ? `Features ${experiences.length} practical internship position(s) demonstrating professional exposure to organizational engineering workflows.`
                : `Demonstrates a verifiable career track record across ${experiences.length} professional role(s) with structured responsibilities.`,
            category: "experience",
            evidence: [
                `Documented positions: ${roles.slice(0, 2).join("; ")}.`,
                ...(hasDetailedBullets ? ["Positions include defined responsibility descriptions and deliverables."] : [])
            ],
            importance: "high",
            confidence: "high"
        });
    }

    // 6. PROJECTS STRENGTH
    if (projects.length > 0) {
        const wellDefinedProjects = projects.filter(p => (p.description || "").trim().length >= 20 || (p.technologies || []).length > 0);
        if (wellDefinedProjects.length > 0) {
            const projectNames = wellDefinedProjects.map(p => p.projectName || "Technical Project").slice(0, 3);
            const projectEvidence = wellDefinedProjects.slice(0, 2).map(p => {
                const techStr = (p.technologies && p.technologies.length > 0) ? ` utilizing ${p.technologies.slice(0, 3).join(", ")}` : "";
                return `Project "${p.projectName || "Featured Project"}": ${p.description ? p.description.slice(0, 90) + "..." : "Structured technical build"}${techStr}.`;
            });

            addStrength({
                title: "Practical Technical Projects Portfolio",
                description: `Showcases ${wellDefinedProjects.length} practical project(s) detailing modern technical architecture, implementation, and problem-solving.`,
                category: "projects",
                evidence: projectEvidence.length > 0 ? projectEvidence : [`Includes detailed projects: ${projectNames.join(", ")}.`],
                importance: "high",
                confidence: "high"
            });
        }
    }

    // 7. EDUCATION STRENGTH
    const education = Array.isArray(structuredResume.education) ? structuredResume.education : [];
    if (education.length > 0) {
        const completeEdu = education.filter(e => (e.degree || "").trim() && (e.institution || "").trim());
        if (completeEdu.length > 0) {
            const eduCitations = completeEdu.map(e => 
                `${e.degree} from ${e.institution}${e.endDate ? ` (${e.endDate})` : ""}`
            );

            addStrength({
                title: "Solid Academic Qualifications",
                description: "The resume provides verified educational credentials confirming formal academic background in a structured format.",
                category: "education",
                evidence: [
                    `Academic credentials: ${eduCitations.slice(0, 2).join("; ")}.`
                ],
                importance: "high",
                confidence: "high"
            });
        }
    }

    // 8. CERTIFICATIONS STRENGTH
    const certs = Array.isArray(structuredResume.certifications) ? structuredResume.certifications : [];
    if (certs.length > 0) {
        const certNames = certs.map(c => typeof c === "string" ? c : `${c.name || "Certification"}${c.issuingOrganization ? ` (${c.issuingOrganization})` : ""}`);
        addStrength({
            title: "Industry-Recognized Certifications",
            description: `Features ${certs.length} formal certification(s) validating specialized domain expertise and commitment to continuous learning.`,
            category: "certifications",
            evidence: [
                `Documented certifications: ${certNames.slice(0, 3).join(", ")}.`
            ],
            importance: "medium",
            confidence: "high"
        });
    }

    // 9. ACHIEVEMENTS & QUANTIFIABLE METRICS STRENGTH
    const detectedMetricMatches = [];
    const fullContent = `${rawText} ${JSON.stringify(structuredResume)}`;
    for (const pat of METRIC_PATTERNS) {
        const match = fullContent.match(pat);
        if (match && match[0]) {
            detectedMetricMatches.push(match[0].trim());
            if (detectedMetricMatches.length >= 3) break;
        }
    }

    if (detectedMetricMatches.length > 0) {
        addStrength({
            title: "Quantifiable Impact & Measurable Outcomes",
            description: "The resume backs up accomplishments with specific metrics, quantitative indicators, or recognized achievements, providing concrete proof of business impact.",
            category: "achievements",
            evidence: [
                `Identified measurable outcomes: "${detectedMetricMatches.join('", "')}".`
            ],
            importance: "high",
            confidence: "high"
        });
    }

    // 10. RESUME STRUCTURE & READABILITY STRENGTH
    const sectionsCount = [
        Boolean(structuredResume.personalInfo?.name || structuredResume.personalInfo?.email),
        Boolean(structuredResume.professionalSummary),
        validSkills.length > 0,
        experiences.length > 0 || projects.length > 0,
        education.length > 0
    ].filter(Boolean).length;

    if (sectionsCount >= 4) {
        addStrength({
            title: "Standard Logical Section Organization",
            description: "Information is systematically organized into standard resume sections, enabling rapid visual review and seamless automated parsing.",
            category: "structure",
            evidence: [
                `Confirmed presence of ${sectionsCount} core resume sections: Personal Info, ${structuredResume.professionalSummary ? "Summary, " : ""}Skills, ${experiences.length > 0 ? "Experience, " : ""}${projects.length > 0 ? "Projects, " : ""}Education.`
            ],
            importance: "medium",
            confidence: "high"
        });
    }

    return strengths;
};

export default {
    detectResumeStrengths
};
