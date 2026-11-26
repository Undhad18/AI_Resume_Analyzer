/**
 * Keyword Detection and Job Description Matching Service (Lesson 7.2)
 * Extracts skills and domain keywords from job descriptions and performs safe,
 * normalized comparison against resume contents.
 */

import {
    SKILL_DICTIONARY,
    normalizeSkillName,
    getSkillCategory,
    buildSkillRegex
} from "./skillNormalizationService.js";

/**
 * Key technical phrases and architectural keywords
 */
const DOMAIN_KEYWORD_PATTERNS = [
    { term: "REST API", category: "backend", regex: /\b(rest|restful|restful apis?|rest apis?)\b/i },
    { term: "Microservices", category: "domain_skills", regex: /\bmicroservices?(?:\s+architecture)?\b/i },
    { term: "CI/CD", category: "devops", regex: /\b(ci\/cd|continuous integration|continuous deployment)\b/i },
    { term: "Unit Testing", category: "testing", regex: /\b(unit testing|unit tests?|tdd)\b/i },
    { term: "Integration Testing", category: "testing", regex: /\bintegration testing|integration tests?\b/i },
    { term: "Responsive Design", category: "frontend", regex: /\b(responsive design|mobile-first)\b/i },
    { term: "Agile / Scrum", category: "soft_skills", regex: /\b(agile|scrum|sprint planning)\b/i },
    { term: "Code Review", category: "soft_skills", regex: /\b(code reviews?|peer reviews?)\b/i },
    { term: "System Design", category: "domain_skills", regex: /\b(system design|distributed systems?)\b/i },
    { term: "Containerization", category: "devops", regex: /\b(containers?|containerization|docker)\b/i },
    { term: "Cloud Architecture", category: "cloud", regex: /\b(cloud architecture|cloud native|aws|azure|gcp)\b/i },
    { term: "Performance Optimization", category: "domain_skills", regex: /\b(performance optimization|caching|latency reduction)\b/i }
];

/**
 * Parses job description text to extract required and preferred skills & keywords
 * 
 * @param {string} jobDescriptionText
 * @returns {object} Extracted terms with importance
 */
export const extractJobKeywords = (jobDescriptionText = "") => {
    if (!jobDescriptionText || typeof jobDescriptionText !== "string") {
        return { required: [], preferred: [], allTerms: [] };
    }

    const lines = jobDescriptionText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const required = new Set();
    const preferred = new Set();
    const allTerms = new Set();

    let currentSection = "general"; // 'required' | 'preferred' | 'general'

    for (const line of lines) {
        const lLower = line.toLowerCase();
        const isHeaderLine = line.length < 45 && /^(?:required|requirements|minimum qualifications|preferred|nice to have|bonus|desired|responsibilities|what you will do)[:\s]*$/i.test(line);
        if (/required|must have|minimum qualifications|requirements|what you need/i.test(lLower)) {
            currentSection = "required";
            if (isHeaderLine) continue;
        } else if (/preferred|nice to have|bonus|desired|plus|good to have/i.test(lLower)) {
            currentSection = "preferred";
            if (isHeaderLine) continue;
        } else if (/responsibilities|what you will do|about us|company overview/i.test(lLower)) {
            currentSection = "general";
            if (isHeaderLine) continue;
        }

        // Match against standard skill dictionary (including aliases)
        for (const [key, entry] of Object.entries(SKILL_DICTIONARY)) {
            const rx = buildSkillRegex(key);
            let matched = rx.test(line);
            if (!matched && entry.aliases.length > 0) {
                for (const alias of entry.aliases) {
                    if (buildSkillRegex(alias).test(line)) {
                        matched = true;
                        break;
                    }
                }
            }

            if (matched) {
                allTerms.add(entry.normalized);
                if (currentSection === "required") {
                    required.add(entry.normalized);
                } else if (currentSection === "preferred") {
                    preferred.add(entry.normalized);
                }
            }
        }
    }

    // If no explicit required section was labeled, treat found skills as required
    if (required.size === 0 && allTerms.size > 0) {
        for (const t of allTerms) {
            required.add(t);
        }
    }

    return {
        required: [...required],
        preferred: [...preferred],
        allTerms: [...allTerms]
    };
};

/**
 * Compare resume content and detected skills against job description requirements
 * 
 * @param {object} params
 * @param {Array<object>} params.detectedResumeSkills
 * @param {string} params.rawResumeText
 * @param {string} params.jobDescriptionText
 * @returns {object} Comparison findings
 */
export const compareSkillsWithJobDescription = ({
    detectedResumeSkills = [],
    rawResumeText = "",
    jobDescriptionText = ""
}) => {
    if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
        return {
            missingSkills: [],
            matchedKeywords: [],
            missingKeywords: [],
            partialMatches: [],
            matchSummary: "No job description provided; operating in general skills detection mode."
        };
    }

    const { required, preferred, allTerms } = extractJobKeywords(jobDescriptionText);
    const detectedSkillNames = new Set(
        detectedResumeSkills.map(s => s.normalizedName.toLowerCase())
    );

    const fullResumeLower = rawResumeText.toLowerCase();

    const matchedKeywords = [];
    const missingKeywords = [];
    const missingSkills = [];
    const partialMatches = [];

    // 1. Process all detected technical skills from JD
    for (const term of allTerms) {
        const normLower = term.toLowerCase();
        const isReq = required.includes(term);
        const importance = isReq ? "required" : (preferred.includes(term) ? "preferred" : "optional");
        const category = getSkillCategory(term);
        const skillRx = buildSkillRegex(term);

        // Check if detected in structured resume skills or raw text
        const isSkillDetected = detectedSkillNames.has(normLower) || skillRx.test(rawResumeText);

        if (isSkillDetected) {
            // Find evidence from detectedResumeSkills or text snippet
            const existingSkill = detectedResumeSkills.find(s => s.normalizedName.toLowerCase() === normLower);
            const evidence = existingSkill?.evidence || [
                `Detected in resume text matching requirement: "${term}".`
            ];

            matchedKeywords.push({
                term,
                normalizedTerm: term,
                category,
                source: existingSkill?.sourceSection || "resume",
                evidence,
                matchStatus: "matched",
                importance
            });
        } else {
            // Not detected in resume
            missingSkills.push({
                skill: term,
                normalizedName: term,
                category,
                importance,
                reason: "Not detected in the provided resume",
                suggestion: `Consider highlighting practical experience with ${term} if you possess this competency.`
            });

            missingKeywords.push({
                term,
                normalizedTerm: term,
                category,
                source: "job_description",
                evidence: [],
                matchStatus: "not_detected",
                importance
            });
        }
    }

    // 2. Process domain and architectural keywords (e.g. CI/CD, Microservices, REST API)
    for (const kw of DOMAIN_KEYWORD_PATTERNS) {
        const inJd = kw.regex.test(jobDescriptionText);
        if (inJd) {
            const inResume = kw.regex.test(rawResumeText);
            const importance = /must|require/i.test(jobDescriptionText) ? "required" : "preferred";

            if (inResume) {
                // Extract sentence containing keyword as evidence
                const matchSentence = rawResumeText
                    .split(/\r?\n|[.]/)
                    .find(s => kw.regex.test(s))
                    ?.trim() || `Mentioned in resume: ${kw.term}`;

                if (!matchedKeywords.some(m => m.normalizedTerm === kw.term)) {
                    matchedKeywords.push({
                        term: kw.term,
                        normalizedTerm: kw.term,
                        category: kw.category,
                        source: "resume",
                        evidence: [matchSentence],
                        matchStatus: "matched",
                        importance
                    });
                }
            } else {
                if (!missingKeywords.some(m => m.normalizedTerm === kw.term)) {
                    missingKeywords.push({
                        term: kw.term,
                        normalizedTerm: kw.term,
                        category: kw.category,
                        source: "job_description",
                        evidence: [],
                        matchStatus: "not_detected",
                        importance
                    });
                }
            }
        }
    }

    // 3. Detect partial matches (e.g., candidate has JavaScript/React when JD asks for Next.js or TypeScript)
    for (const miss of missingSkills) {
        if (miss.normalizedName === "Next.js" && detectedSkillNames.has("react")) {
            partialMatches.push({
                term: "Next.js",
                normalizedTerm: "Next.js",
                category: "frontend",
                partialEvidence: ["Resume demonstrates proficiency in core React, the foundation of Next.js."],
                gapReason: "Next.js is specifically requested, but only React is currently documented.",
                suggestion: "If you have used Next.js for server-side rendering or API routes, state it explicitly.",
                importance: miss.importance
            });
        } else if (miss.normalizedName === "TypeScript" && detectedSkillNames.has("javascript")) {
            partialMatches.push({
                term: "TypeScript",
                normalizedTerm: "TypeScript",
                category: "programming_languages",
                partialEvidence: ["Candidate has proven experience in JavaScript."],
                gapReason: "TypeScript requested; strong JavaScript background provides a direct transition.",
                suggestion: "Highlight TypeScript projects or static type migration experience if applicable.",
                importance: miss.importance
            });
        }
    }

    const matchSummary = `Job comparison completed: ${matchedKeywords.length} requirement(s) matched, ${missingSkills.length} not detected in the provided resume, and ${partialMatches.length} partial match(es) identified.`;

    return {
        missingSkills,
        matchedKeywords,
        missingKeywords,
        partialMatches,
        matchSummary
    };
};

export default {
    extractJobKeywords,
    compareSkillsWithJobDescription
};
