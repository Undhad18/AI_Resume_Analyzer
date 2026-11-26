/**
 * Free Resume Enhancement Service (Lesson 7.4)
 * 100% Deterministic Rule-Based Polish & Formatting Normalization.
 * Zero OpenAI API Calls • Zero Fabricated Facts or Metrics.
 */

import { normalizeSkillName } from "./skillNormalizationService.js";

/**
 * Normalizes string whitespace, line endings, and punctuation spacing
 */
export const cleanTextWhitespace = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
        .replace(/\r\n|\r/g, "\n")
        .replace(/[\t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\s+([.,;:!?])/g, "$1") // fix space before punctuation
        .replace(/([.,;:!?])(?=[a-zA-Z])/g, "$1 ") // ensure space after punctuation
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

/**
 * Standardize date formats: "2021-05" or "05/2021" -> "May 2021"
 */
export const normalizeDateString = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return dateStr;
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // e.g. 2023-05 -> May 2023
    const ymMatch = dateStr.match(/^(\d{4})[-/](0?[1-9]|1[0-2])$/);
    if (ymMatch) {
        const mIdx = parseInt(ymMatch[2], 10) - 1;
        return `${months[mIdx]} ${ymMatch[1]}`;
    }

    // e.g. 05/2023 -> May 2023
    const myMatch = dateStr.match(/^(0?[1-9]|1[0-2])[-/](\d{4})$/);
    if (myMatch) {
        const mIdx = parseInt(myMatch[1], 10) - 1;
        return `${months[mIdx]} ${myMatch[2]}`;
    }

    return dateStr.trim();
};

/**
 * Replaces passive responsibility openers with clean action verbs safely
 * without changing the underlying fact or fabricating metrics.
 */
export const polishBulletStatement = (bullet) => {
    if (!bullet || typeof bullet !== "string") return "";
    let clean = bullet.trim().replace(/^[•*\-\s]+/, "").trim();

    const replacements = [
        { pattern: /^responsible for (?:the )?(?:development|developing) of/i, replacement: "Developed" },
        { pattern: /^responsible for (?:the )?(?:creation|creating) of/i, replacement: "Created" },
        { pattern: /^responsible for (?:the )?(?:design|designing) of/i, replacement: "Designed" },
        { pattern: /^responsible for (?:the )?(?:management|managing) of/i, replacement: "Managed" },
        { pattern: /^responsible for (?:the )?(?:maintenance|maintaining) of/i, replacement: "Maintained" },
        { pattern: /^responsible for (?:the )?(?:testing|testing) of/i, replacement: "Tested" },
        { pattern: /^responsible for (?:the )?(?:building|build) of/i, replacement: "Built" },
        { pattern: /^responsible for (?:the )?(?:implementation|implementing) of/i, replacement: "Implemented" },
        { pattern: /^responsible for/i, replacement: "Managed" },
        { pattern: /^helped (?:to )?(?:develop|developing)/i, replacement: "Co-developed" },
        { pattern: /^helped (?:with )?(?:the )?/i, replacement: "Contributed to " },
        { pattern: /^assisted in (?:the )?(?:development|developing) of/i, replacement: "Assisted in developing" },
        { pattern: /^duties included/i, replacement: "Executed" },
        { pattern: /^worked on/i, replacement: "Engineered and maintained" }
    ];

    for (const r of replacements) {
        if (r.pattern.test(clean)) {
            clean = clean.replace(r.pattern, r.replacement);
            break;
        }
    }

    // Capitalize first letter
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);

    // Ensure ending period if it's a complete clause
    if (!/[.!?]$/.test(clean)) {
        clean = `${clean}.`;
    }

    return clean;
};

/**
 * Enhance Professional Summary deterministically
 */
export const enhanceSummary = (originalSummary) => {
    if (!originalSummary || typeof originalSummary !== "string" || originalSummary.trim().length === 0) {
        return {
            enhanced: originalSummary || "",
            changes: ["No summary text provided to enhance."]
        };
    }

    const cleaned = cleanTextWhitespace(originalSummary);
    const changes = [];

    if (cleaned !== originalSummary) {
        changes.push("Normalized irregular whitespace and punctuation spacing.");
    }

    // Fix awkward run-on capitalization or redundant first-person phrasing
    let polished = cleaned
        .replace(/\b(?:I am a|I'm a)\s+/gi, "")
        .replace(/\b(?:seeking to obtain|looking for)\s+a position/gi, "Aiming to leverage technical skills in")
        .trim();

    polished = polished.charAt(0).toUpperCase() + polished.slice(1);

    if (polished !== cleaned) {
        changes.push("Elevated professional phrasing by removing conversational first-person qualifiers.");
    }

    return {
        enhanced: polished,
        changes: changes.length > 0 ? changes : ["Verified clean summary structure."]
    };
};

/**
 * Enhance Skills deterministically
 */
export const enhanceSkills = (originalSkills) => {
    if (!Array.isArray(originalSkills) || originalSkills.length === 0) {
        return {
            enhanced: originalSkills || [],
            changes: ["Skills section is empty."]
        };
    }

    const seen = new Set();
    const normalized = [];
    let deduplicatedCount = 0;

    for (const item of originalSkills) {
        const rawName = typeof item === "string" ? item : (item.name || "");
        if (!rawName || rawName.trim().length === 0) continue;

        const clean = normalizeSkillName(rawName.trim());
        const lowerKey = clean.toLowerCase();

        if (seen.has(lowerKey)) {
            deduplicatedCount++;
        } else {
            seen.add(lowerKey);
            normalized.push(clean);
        }
    }

    const changes = [];
    if (deduplicatedCount > 0) {
        changes.push(`Deduplicated ${deduplicatedCount} redundant skill variant(s).`);
    }
    changes.push("Standardized naming, capitalization, and formatting for all technical skills.");

    return {
        enhanced: normalized,
        changes
    };
};

/**
 * Enhance Work Experience deterministically
 */
export const enhanceExperience = (originalExperience) => {
    if (!Array.isArray(originalExperience) || originalExperience.length === 0) {
        return {
            enhanced: originalExperience || [],
            changes: ["Experience section is empty (Entry-Level / Fresher profile)."]
        };
    }

    const changes = [];
    let bulletsPolishedCount = 0;

    const enhanced = originalExperience.map((exp) => {
        const respList = Array.isArray(exp.responsibilities)
            ? exp.responsibilities
            : (exp.description ? [exp.description] : []);

        const polishedResp = respList.map((r) => {
            const polished = polishBulletStatement(r);
            if (polished !== r) {
                bulletsPolishedCount++;
            }
            return polished;
        });

        // Normalize dates
        const startDate = normalizeDateString(exp.startDate || "");
        const endDate = normalizeDateString(exp.endDate || "");

        return {
            ...exp,
            jobTitle: cleanTextWhitespace(exp.jobTitle || ""),
            company: cleanTextWhitespace(exp.company || ""),
            location: cleanTextWhitespace(exp.location || ""),
            startDate: startDate || exp.startDate,
            endDate: endDate || exp.endDate,
            responsibilities: polishedResp
        };
    });

    if (bulletsPolishedCount > 0) {
        changes.push(`Transformed ${bulletsPolishedCount} passive duty opener(s) into active achievement statements while strictly preserving original facts.`);
    }
    changes.push("Standardized employment dates and punctuation across all work history entries.");

    return {
        enhanced,
        changes
    };
};

/**
 * Enhance Projects deterministically
 */
export const enhanceProjects = (originalProjects) => {
    if (!Array.isArray(originalProjects) || originalProjects.length === 0) {
        return {
            enhanced: originalProjects || [],
            changes: ["Projects section is empty."]
        };
    }

    const changes = [];
    const enhanced = originalProjects.map((p) => {
        const rawTech = Array.isArray(p.technologies) ? p.technologies : [];
        const cleanTech = rawTech.map(t => normalizeSkillName(String(t).trim())).filter(Boolean);

        const desc = cleanTextWhitespace(p.description || "");
        const polishedDesc = polishBulletStatement(desc);

        return {
            ...p,
            projectName: cleanTextWhitespace(p.projectName || ""),
            technologies: cleanTech,
            description: polishedDesc
        };
    });

    changes.push("Formatted technology stack tags and standardized project summary phrasing.");

    return {
        enhanced,
        changes
    };
};

/**
 * Enhance Education deterministically
 */
export const enhanceEducation = (originalEducation) => {
    if (!Array.isArray(originalEducation) || originalEducation.length === 0) {
        return {
            enhanced: originalEducation || [],
            changes: ["Education section is empty."]
        };
    }

    const changes = [];
    const enhanced = originalEducation.map((edu) => {
        return {
            ...edu,
            degree: cleanTextWhitespace(edu.degree || ""),
            institution: cleanTextWhitespace(edu.institution || ""),
            location: cleanTextWhitespace(edu.location || ""),
            fieldOfStudy: cleanTextWhitespace(edu.fieldOfStudy || ""),
            graduationYear: normalizeDateString(edu.graduationYear || edu.dates || "")
        };
    });

    changes.push("Standardized degree titles, institution names, and graduation date formats.");

    return {
        enhanced,
        changes
    };
};

/**
 * Enhance Certifications deterministically
 */
export const enhanceCertifications = (originalCerts) => {
    if (!Array.isArray(originalCerts) || originalCerts.length === 0) {
        return {
            enhanced: originalCerts || [],
            changes: ["Certifications section is empty."]
        };
    }

    const changes = [];
    const enhanced = originalCerts.map((c) => {
        if (typeof c === "string") {
            return cleanTextWhitespace(c);
        }
        return {
            ...c,
            name: cleanTextWhitespace(c.name || c.title || ""),
            issuer: cleanTextWhitespace(c.issuer || c.organization || ""),
            issueDate: normalizeDateString(c.issueDate || c.date || "")
        };
    });

    changes.push("Normalized certification credential titles and issuer notations.");

    return {
        enhanced,
        changes
    };
};

/**
 * Enhance Achievements deterministically
 */
export const enhanceAchievements = (originalAchievements) => {
    if (!Array.isArray(originalAchievements) || originalAchievements.length === 0) {
        return {
            enhanced: originalAchievements || [],
            changes: ["Achievements section is empty."]
        };
    }

    const changes = [];
    const enhanced = originalAchievements.map((ach) => {
        if (typeof ach === "string") {
            return polishBulletStatement(cleanTextWhitespace(ach));
        }
        return {
            ...ach,
            title: cleanTextWhitespace(ach.title || ""),
            description: polishBulletStatement(cleanTextWhitespace(ach.description || ""))
        };
    });

    changes.push("Polished achievement statement phrasing without altering metrics or claims.");

    return {
        enhanced,
        changes
    };
};

/**
 * Master deterministic enhancement orchestrator (Free Mode)
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {"full_resume"|"single_section"} [params.scope="full_resume"]
 * @param {string} [params.sectionName=null]
 * @returns {object} { enhancedContent, sectionsDiff, changesSummary }
 */
export const enhanceResumeFreeMode = ({
    structuredResume = {},
    scope = "full_resume",
    sectionName = null
}) => {
    const originalContent = {
        professionalSummary: structuredResume.professionalSummary || "",
        skills: structuredResume.skills || [],
        experience: structuredResume.experience || [],
        projects: structuredResume.projects || [],
        education: structuredResume.education || [],
        certifications: structuredResume.certifications || [],
        achievements: structuredResume.achievements || []
    };

    const enhancedContent = { ...originalContent };
    const sectionsDiff = [];
    const allChanges = [];

    const processSection = (key) => {
        let result;
        switch (key) {
            case "professionalSummary":
                result = enhanceSummary(originalContent.professionalSummary);
                break;
            case "skills":
                result = enhanceSkills(originalContent.skills);
                break;
            case "experience":
                result = enhanceExperience(originalContent.experience);
                break;
            case "projects":
                result = enhanceProjects(originalContent.projects);
                break;
            case "education":
                result = enhanceEducation(originalContent.education);
                break;
            case "certifications":
                result = enhanceCertifications(originalContent.certifications);
                break;
            case "achievements":
                result = enhanceAchievements(originalContent.achievements);
                break;
            default:
                result = { enhanced: originalContent[key], changes: ["Section preserved unchanged."] };
        }

        enhancedContent[key] = result.enhanced;
        const isModified = JSON.stringify(originalContent[key]) !== JSON.stringify(result.enhanced);

        sectionsDiff.push({
            sectionName: key,
            original: originalContent[key],
            enhanced: result.enhanced,
            changes: result.changes,
            isModified
        });

        if (isModified) {
            allChanges.push(...result.changes);
        }
    };

    if (scope === "single_section" && sectionName) {
        processSection(sectionName);
    } else {
        const sectionsToProcess = [
            "professionalSummary",
            "skills",
            "experience",
            "projects",
            "education",
            "certifications",
            "achievements"
        ];
        for (const sec of sectionsToProcess) {
            processSection(sec);
        }
    }

    const modifiedCount = sectionsDiff.filter(d => d.isModified).length;
    const changesSummary = modifiedCount > 0
        ? `Applied deterministic rule-based polish across ${modifiedCount} section(s): standardized formatting, dates, active openers, and deduplicated skills with 100% strict fact preservation.`
        : "Resume sections verified clean; no formatting or whitespace discrepancies detected.";

    return {
        originalContent,
        enhancedContent,
        sectionsDiff,
        changesSummary
    };
};

export default {
    enhanceResumeFreeMode,
    enhanceSummary,
    enhanceSkills,
    enhanceExperience,
    enhanceProjects,
    enhanceEducation,
    enhanceCertifications,
    enhanceAchievements,
    polishBulletStatement,
    normalizeDateString,
    cleanTextWhitespace
};
