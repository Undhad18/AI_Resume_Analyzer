/**
 * Resume Skills Extraction Service (Lesson 7.2)
 * Discovers and validates technical and soft skills across structured resume sections:
 * Skills list, Professional Summary, Work Experience, Projects, and Certifications.
 */

import {
    SKILL_DICTIONARY,
    normalizeSkillName,
    getSkillCategory,
    buildSkillRegex
} from "./skillNormalizationService.js";

/**
 * Extract skills from all structured resume sections
 * 
 * @param {object} params
 * @param {object} params.structuredResume
 * @param {string} [params.rawText=""]
 * @returns {object} Extracted skills with evidence and categorization
 */
export const extractResumeSkills = ({ structuredResume = {}, rawText = "" }) => {
    const rawSkills = Array.isArray(structuredResume.skills) ? structuredResume.skills : [];
    const experiences = Array.isArray(structuredResume.experience) ? structuredResume.experience : [];
    const projects = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];
    const certs = Array.isArray(structuredResume.certifications) ? structuredResume.certifications : [];
    const summary = (structuredResume.professionalSummary || "").trim();

    // Map of normalized skill name -> skill object
    const skillsMap = new Map();

    const registerSkill = ({ rawSkill, sourceSection, evidenceSnippet = "" }) => {
        if (!rawSkill || typeof rawSkill !== "string") return;
        const cleanRaw = rawSkill.trim();
        if (cleanRaw.length < 2) return;

        const normalized = normalizeSkillName(cleanRaw);
        const category = getSkillCategory(normalized);

        if (!skillsMap.has(normalized)) {
            skillsMap.set(normalized, {
                skill: cleanRaw,
                normalizedName: normalized,
                category,
                sourceSection,
                evidence: evidenceSnippet ? [evidenceSnippet] : [],
                foundInSkillsSection: sourceSection === "skills",
                foundInProjects: sourceSection === "projects",
                foundInExperience: sourceSection === "experience",
                foundInSummary: sourceSection === "summary",
                foundInCerts: sourceSection === "certifications"
            });
        } else {
            const existing = skillsMap.get(normalized);
            if (evidenceSnippet && !existing.evidence.includes(evidenceSnippet)) {
                existing.evidence.push(evidenceSnippet);
            }
            if (sourceSection === "skills") existing.foundInSkillsSection = true;
            if (sourceSection === "projects") existing.foundInProjects = true;
            if (sourceSection === "experience") existing.foundInExperience = true;
            if (sourceSection === "summary") existing.foundInSummary = true;
            if (sourceSection === "certifications") existing.foundInCerts = true;
        }
    };

    // 1. Explicit skills section
    for (const item of rawSkills) {
        const skillName = typeof item === "string" ? item : (item?.name || "");
        if (skillName) {
            registerSkill({
                rawSkill: skillName,
                sourceSection: "skills",
                evidenceSnippet: `Explicitly listed in Skills section: "${skillName}"`
            });
        }
    }

    // 2. Scan Projects for technology tags and descriptions
    for (const proj of projects) {
        const projName = proj.projectName || "Project";
        const projTech = Array.isArray(proj.technologies) ? proj.technologies : [];
        const projDesc = proj.description || "";

        // Explicit technology tags in projects
        for (const tech of projTech) {
            registerSkill({
                rawSkill: String(tech),
                sourceSection: "projects",
                evidenceSnippet: `Used in project "${projName}" (technology stack: ${tech})`
            });
        }

        // Scan project description against standard dictionary (including aliases)
        for (const [key, entry] of Object.entries(SKILL_DICTIONARY)) {
            const rx = buildSkillRegex(key);
            let matched = rx.test(projDesc);
            if (!matched && entry.aliases.length > 0) {
                for (const alias of entry.aliases) {
                    if (buildSkillRegex(alias).test(projDesc)) {
                        matched = true;
                        break;
                    }
                }
            }

            if (matched) {
                registerSkill({
                    rawSkill: entry.normalized,
                    sourceSection: "projects",
                    evidenceSnippet: `Applied in project "${projName}": "${projDesc.slice(0, 90)}..."`
                });
            }
        }
    }

    // 3. Scan Work Experience responsibilities
    for (const exp of experiences) {
        const role = `${exp.jobTitle || "Role"} at ${exp.company || "Company"}`;
        const responsibilities = Array.isArray(exp.responsibilities) ? exp.responsibilities : [exp.description].filter(Boolean);
        const expText = responsibilities.join(" ");

        for (const [key, entry] of Object.entries(SKILL_DICTIONARY)) {
            const rx = buildSkillRegex(key);
            let matched = rx.test(expText);
            if (!matched && entry.aliases.length > 0) {
                for (const alias of entry.aliases) {
                    if (buildSkillRegex(alias).test(expText)) {
                        matched = true;
                        break;
                    }
                }
            }

            if (matched) {
                // Find matching bullet
                const matchedBullet = responsibilities.find(b => rx.test(b) || (entry.aliases.some(a => buildSkillRegex(a).test(b)))) || expText;
                registerSkill({
                    rawSkill: entry.normalized,
                    sourceSection: "experience",
                    evidenceSnippet: `Utilized as ${role}: "${matchedBullet.slice(0, 90)}..."`
                });
            }
        }
    }

    // 4. Scan Summary
    if (summary) {
        for (const [key, entry] of Object.entries(SKILL_DICTIONARY)) {
            const rx = buildSkillRegex(key);
            if (rx.test(summary)) {
                registerSkill({
                    rawSkill: entry.normalized,
                    sourceSection: "summary",
                    evidenceSnippet: `Cited in career summary: "${summary.slice(0, 100)}..."`
                });
            }
        }
    }

    // 5. Scan Certifications
    for (const cert of certs) {
        const certName = typeof cert === "string" ? cert : (cert?.name || "");
        for (const [key, entry] of Object.entries(SKILL_DICTIONARY)) {
            const rx = buildSkillRegex(key);
            if (rx.test(certName)) {
                registerSkill({
                    rawSkill: entry.normalized,
                    sourceSection: "certifications",
                    evidenceSnippet: `Verified via certification: "${certName}"`
                });
            }
        }
    }

    // 6. Direct document text scan fallback (when structured sections are empty or unparsed)
    if (skillsMap.size === 0 && rawText && typeof rawText === "string") {
        for (const [key, entry] of Object.entries(SKILL_DICTIONARY)) {
            const rx = buildSkillRegex(key);
            let matched = rx.test(rawText);
            if (!matched && entry.aliases.length > 0) {
                for (const alias of entry.aliases) {
                    if (buildSkillRegex(alias).test(rawText)) {
                        matched = true;
                        break;
                    }
                }
            }

            if (matched) {
                const normalized = normalizeSkillName(entry.normalized);
                if (!skillsMap.has(normalized)) {
                    registerSkill({
                        rawSkill: entry.normalized,
                        sourceSection: "experience",
                        evidenceSnippet: `Identified in document text: "${entry.normalized}"`
                    });
                }
            }
        }
    }

    // Finalize evidenceStatus for each detected skill
    const detectedSkills = [];
    const skillCategories = {
        programming_languages: [],
        frontend: [],
        backend: [],
        database: [],
        tools: [],
        cloud: [],
        devops: [],
        testing: [],
        soft_skills: [],
        domain_skills: []
    };

    const skillsWithProjectEvidence = [];
    const skillsWithExperienceEvidence = [];
    const skillsListedWithoutEvidence = [];

    for (const skillItem of skillsMap.values()) {
        let status = "explicit_only";
        let primarySection = "skills";

        if (skillItem.foundInSkillsSection && (skillItem.foundInProjects || skillItem.foundInExperience)) {
            status = "explicit_and_applied";
            primarySection = "skills";
        } else if (skillItem.foundInSkillsSection) {
            status = "explicit_only";
            primarySection = "skills";
        } else if (skillItem.foundInProjects || skillItem.foundInExperience) {
            status = "applied_only";
            primarySection = skillItem.foundInProjects ? "projects" : "experience";
        } else if (skillItem.foundInSummary) {
            status = "inferred";
            primarySection = "summary";
        } else if (skillItem.foundInCerts) {
            status = "inferred";
            primarySection = "certifications";
        }

        const formatted = {
            skill: skillItem.skill,
            normalizedName: skillItem.normalizedName,
            category: skillItem.category,
            sourceSection: primarySection,
            evidence: skillItem.evidence.length > 0 ? skillItem.evidence : [`Detected in ${primarySection} section.`],
            evidenceStatus: status
        };

        detectedSkills.push(formatted);

        // Group into category dictionary
        if (!skillCategories[skillItem.category]) {
            skillCategories[skillItem.category] = [];
        }
        skillCategories[skillItem.category].push(skillItem.normalizedName);

        // Subcategory tracking
        if (skillItem.foundInProjects) {
            skillsWithProjectEvidence.push(skillItem.normalizedName);
        }
        if (skillItem.foundInExperience) {
            skillsWithExperienceEvidence.push(skillItem.normalizedName);
        }
        if (skillItem.foundInSkillsSection && !skillItem.foundInProjects && !skillItem.foundInExperience) {
            skillsListedWithoutEvidence.push(skillItem.normalizedName);
        }
    }

    return {
        detectedSkills,
        skillCategories,
        skillsWithProjectEvidence: [...new Set(skillsWithProjectEvidence)],
        skillsWithExperienceEvidence: [...new Set(skillsWithExperienceEvidence)],
        skillsListedWithoutEvidence: [...new Set(skillsListedWithoutEvidence)]
    };
};

export default {
    extractResumeSkills
};
