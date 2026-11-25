import { structuredResumeSchema } from "../validators/structuredResumeSchema.js";

/**
 * Normalizes resume text:
 * - Unifies line breaks (\r\n -> \n)
 * - Collapses excessive horizontal spaces and non-breaking spaces
 * - Trims each line individually while preserving newlines
 * - Collapses 3+ newlines to 2 newlines (preserves paragraph boundaries)
 * 
 * @param {string} rawText 
 * @returns {string} Clean, normalized text
 */
export const normalizeResumeText = (rawText) => {
    if (!rawText || typeof rawText !== "string") return "";

    return rawText
        .replace(/\r\n|\r|\u2028|\u2029/g, "\n")
        .replace(/[\t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

/**
 * Standard section heading regex patterns
 */
const SECTION_PATTERNS = {
    SUMMARY: /^(?:professional\s+summary|executive\s+summary|career\s+summary|summary\s+of\s+qualifications|summary|career\s+objective|objective|profile|about\s+me)$/i,
    SKILLS: /^(?:technical\s+skills|core\s+skills|key\s+skills|skills\s+(&|and)\s+technologies|skills\s+(&|and)\s+tools|core\s+competencies|key\s+competencies|skills|technologies|technical\s+proficiencies|tools|areas\s+of\s+expertise)$/i,
    EXPERIENCE: /^(?:work\s+experience|professional\s+experience|employment\s+history|work\s+history|relevant\s+experience|experience|internships|internship\s+experience|career\s+history)$/i,
    EDUCATION: /^(?:educational\s+background|academic\s+background|educational\s+qualifications|academic\s+qualifications|academics|education)$/i,
    PROJECTS: /^(?:personal\s+projects|academic\s+projects|key\s+projects|technical\s+projects|notable\s+projects|projects)$/i,
    CERTIFICATIONS: /^(?:licenses\s+(&|and)\s+certifications|certifications\s+(&|and)\s+licenses|certifications|certificates|licenses)$/i,
    LANGUAGES: /^(?:language\s+proficiency|spoken\s+languages|languages)$/i,
    ACHIEVEMENTS: /^(?:awards\s+(&|and)\s+honors|honors\s+(&|and)\s+awards|awards|honors|achievements|accomplishments)$/i,
    CONTACT: /^(?:contact\s+information|contact\s+details|personal\s+details|personal\s+information|contact)$/i
};

/**
 * Tests if a line is a section heading
 * @param {string} line 
 * @returns {{ isHeading: boolean, sectionKey: string|null, headingText: string }}
 */
const detectSectionHeading = (line) => {
    if (!line || typeof line !== "string") {
        return { isHeading: false, sectionKey: null, headingText: "" };
    }

    const trimmed = line.trim();
    // Headings are typically 1-6 words, <= 50 characters, and don't end in sentence punctuation
    if (trimmed.length > 50 || trimmed.length < 2) {
        return { isHeading: false, sectionKey: null, headingText: "" };
    }

    if (/[.,;!?]$/.test(trimmed)) {
        return { isHeading: false, sectionKey: null, headingText: "" };
    }

    // Strip leading markdown (#, *), bullets, or trailing colons
    const cleanHeading = trimmed
        .replace(/^[#*•\-~>\s]+/, "")
        .replace(/[:\s]+$/, "")
        .trim();

    for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(cleanHeading)) {
            return { isHeading: true, sectionKey: key, headingText: cleanHeading };
        }
    }

    // Check if line is all-uppercase and looks like a custom heading
    if (/^[A-Z\s&,/\\-]{3,40}$/.test(cleanHeading) && !/[a-z]/.test(cleanHeading)) {
        return { isHeading: true, sectionKey: "ADDITIONAL", headingText: cleanHeading };
    }

    return { isHeading: false, sectionKey: null, headingText: "" };
};

/**
 * Splits normalized resume text into classified sections
 * @param {string} text 
 * @returns {Record<string, string[]> & { ADDITIONAL: Array<{ heading: string, lines: string[] }> }}
 */
export const segmentResumeSections = (text) => {
    const lines = text.split("\n").map((l) => l.trim());
    const sections = {
        HEADER: [],
        SUMMARY: [],
        SKILLS: [],
        EXPERIENCE: [],
        EDUCATION: [],
        PROJECTS: [],
        CERTIFICATIONS: [],
        LANGUAGES: [],
        ACHIEVEMENTS: [],
        CONTACT: [],
        ADDITIONAL: []
    };

    let currentSection = "HEADER";
    let currentAdditionalHeading = "";
    let currentAdditionalLines = [];

    for (const line of lines) {
        if (!line) continue;

        const headingDetection = detectSectionHeading(line);

        if (headingDetection.isHeading) {
            // If finishing an ADDITIONAL section, save it
            if (currentSection === "ADDITIONAL" && currentAdditionalHeading) {
                sections.ADDITIONAL.push({
                    heading: currentAdditionalHeading,
                    lines: [...currentAdditionalLines]
                });
                currentAdditionalHeading = "";
                currentAdditionalLines = [];
            }

            if (headingDetection.sectionKey === "ADDITIONAL") {
                currentSection = "ADDITIONAL";
                currentAdditionalHeading = headingDetection.headingText;
                currentAdditionalLines = [];
            } else {
                currentSection = headingDetection.sectionKey;
            }
        } else {
            if (currentSection === "ADDITIONAL") {
                currentAdditionalLines.push(line);
            } else if (sections[currentSection]) {
                sections[currentSection].push(line);
            } else {
                sections.HEADER.push(line);
            }
        }
    }

    if (currentSection === "ADDITIONAL" && currentAdditionalHeading) {
        sections.ADDITIONAL.push({
            heading: currentAdditionalHeading,
            lines: [...currentAdditionalLines]
        });
    }

    return sections;
};

/**
 * Extracts personal information from resume header / contact lines
 * @param {string[]} headerLines 
 * @param {string[]} contactLines 
 * @param {string} fullText 
 * @returns {object} PersonalInfo object
 */
export const extractPersonalInfo = (headerLines = [], contactLines = [], fullText = "") => {
    const combinedLines = [...headerLines, ...contactLines];
    const textPool = combinedLines.join("\n") + "\n" + fullText;

    // 1. Email extraction (validated)
    const emailMatch = textPool.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i);
    const email = emailMatch ? emailMatch[1].toLowerCase().trim() : null;

    // 2. Phone extraction (10-15 digits, handles intl codes, parens, hyphens)
    let phone = null;
    const phoneCandidates = textPool.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g) || [];
    for (const cand of phoneCandidates) {
        const digits = cand.replace(/\D/g, "");
        // Avoid dates (e.g. 2020-2024 -> 8 digits) and ensure reasonable phone length
        if (digits.length >= 10 && digits.length <= 15) {
            phone = cand.trim();
            break;
        }
    }

    // 3. LinkedIn URL extraction
    let linkedin = null;
    const linkedinMatch = textPool.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_\-\.]+)/i);
    if (linkedinMatch) {
        linkedin = `https://www.linkedin.com/in/${linkedinMatch[1].replace(/[/]$/, "")}`;
    }

    // 4. GitHub URL extraction
    let github = null;
    const githubMatch = textPool.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i);
    if (githubMatch) {
        github = `https://github.com/${githubMatch[1].replace(/[/]$/, "")}`;
    }

    // 5. Portfolio / website URL extraction
    let portfolio = null;
    const urlMatches = textPool.match(/https?:\/\/[^\s,"'>)]+/gi) || [];
    for (const url of urlMatches) {
        const lower = url.toLowerCase();
        if (!lower.includes("linkedin.com") && !lower.includes("github.com")) {
            portfolio = url.trim();
            break;
        }
    }

    // 6. Location extraction (City, State / Country)
    let location = null;
    for (const line of combinedLines) {
        const locMatch = line.match(/\b([A-Z][a-zA-Z\s.]+,\s*[A-Z]{2,}(?:\s+\d{5})?|[A-Z][a-zA-Z\s.]+\s*,\s*[A-Z][a-zA-Z\s]+)\b/);
        if (locMatch && !locMatch[0].includes("@") && !locMatch[0].includes("http")) {
            location = locMatch[0].trim();
            break;
        }
    }

    // 7. Full Name extraction (First non-empty line of header that looks like a person's name)
    let fullName = null;
    const blacklistWords = ["resume", "curriculum", "vitae", "cv", "profile", "contact", "email", "phone", "engineer", "developer", "architect"];
    for (const line of headerLines) {
        const trimmed = line.replace(/^[#*•\s]+/, "").trim();
        const words = trimmed.split(/\s+/);
        // Name is typically 2-4 words, contains only letters, dots, hyphens
        if (words.length >= 2 && words.length <= 4 && /^[A-Za-z.\s\-']+$/.test(trimmed)) {
            const hasBlacklist = words.some((w) => blacklistWords.includes(w.toLowerCase()));
            if (!hasBlacklist) {
                fullName = trimmed;
                break;
            }
        }
    }

    return {
        fullName: fullName || null,
        email: email || null,
        phone: phone || null,
        location: location || null,
        linkedin: linkedin || null,
        github: github || null,
        portfolio: portfolio || null
    };
};

/**
 * Extracts skills list from skill section lines
 * @param {string[]} skillLines 
 * @returns {string[]} Deduplicated, trimmed skills array
 */
export const extractSkills = (skillLines = []) => {
    if (!skillLines || skillLines.length === 0) return [];

    const rawSkills = [];

    for (const line of skillLines) {
        // Strip common category prefixes like "Languages:", "Frontend:", "Technologies:"
        const cleaned = line.replace(/^[A-Za-z\s&/\\-]+:\s*/, "").trim();

        // Split by commas, bullets, pipes, slashes, or middle dots
        const tokens = cleaned
            .split(/[,•|·/]/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0 && t.length < 50);

        rawSkills.push(...tokens);
    }

    // Deduplicate case-insensitively while preserving original string casing
    const seen = new Set();
    const uniqueSkills = [];

    for (const skill of rawSkills) {
        const lower = skill.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            uniqueSkills.push(skill);
        }
    }

    return uniqueSkills;
};

/**
 * Extracts structured work experience entries from experience section lines
 * @param {string[]} expLines 
 * @returns {Array<object>} Experience objects
 */
export const extractExperience = (expLines = []) => {
    if (!expLines || expLines.length === 0) return [];

    const entries = [];
    const dateRangeRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{4}|\d{2}\/\d{4})\s*(?:–|-|to)\s*(?:present|current|now|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{4}|\d{2}\/\d{4}))/i;

    let currentEntry = null;
    const descriptionBullets = [];

    const flushEntry = () => {
        if (currentEntry) {
            currentEntry.description = descriptionBullets.length > 0
                ? descriptionBullets.join("\n")
                : null;
            entries.push(currentEntry);
            currentEntry = null;
            descriptionBullets.length = 0;
        }
    };

    for (const line of expLines) {
        const isDateLine = dateRangeRegex.test(line);

        if (isDateLine) {
            flushEntry();

            const dateMatch = line.match(dateRangeRegex);
            const dateStr = dateMatch ? dateMatch[0] : "";
            const isCurrent = /present|current|now/i.test(dateStr);

            // Split date range into start and end
            const [startPart, endPart] = dateStr.split(/(?:–|-|to)/i).map((s) => s.trim());

            // Extract job title and company from the rest of the line or previous line
            const nonDatePart = line.replace(dateRangeRegex, "").trim();
            const tokens = nonDatePart
                .split(/[|•–—,-]/)
                .map((t) => t.trim())
                .filter(Boolean);

            let jobTitle = tokens[0] || null;
            let company = tokens[1] || null;
            let location = tokens[2] || null;

            // Handle "Job Title at Company" pattern
            if (nonDatePart.toLowerCase().includes(" at ")) {
                const atParts = nonDatePart.split(/\s+at\s+/i);
                jobTitle = atParts[0].trim();
                company = atParts[1]?.trim() || company;
            }

            currentEntry = {
                jobTitle: jobTitle || null,
                company: company || null,
                location: location || null,
                startDate: startPart || null,
                endDate: endPart || (isCurrent ? "Present" : null),
                isCurrent,
                description: null
            };
        } else if (currentEntry) {
            // Accumulate description bullet points
            const bullet = line.replace(/^[•*\->\s]+/, "").trim();
            if (bullet) {
                descriptionBullets.push(bullet);
            }
        } else {
            // First non-date line can be job title / company if preceding the date line
            const tokens = line.split(/[|•–—]/).map((t) => t.trim()).filter(Boolean);
            if (tokens.length >= 2) {
                currentEntry = {
                    jobTitle: tokens[0] || null,
                    company: tokens[1] || null,
                    location: tokens[2] || null,
                    startDate: null,
                    endDate: null,
                    isCurrent: false,
                    description: null
                };
            }
        }
    }

    flushEntry();
    return entries;
};

/**
 * Extracts structured education entries from education section lines
 * @param {string[]} eduLines 
 * @returns {Array<object>} Education objects
 */
export const extractEducation = (eduLines = []) => {
    if (!eduLines || eduLines.length === 0) return [];

    const entries = [];
    const degreeKeywords = /\b(b\.?s\.?|b\.?a\.?|b\.?tech\.?|b\.?e\.?|m\.?s\.?|m\.?tech\.?|m\.?b\.?a\.?|ph\.?d\.?|bachelor|master|doctorate|diploma|associate)\b/i;
    const yearRangeRegex = /\b(?:19|20)\d{2}\s*(?:–|-|to)\s*(?:(?:19|20)\d{2}|present|current)\b|\b(?:19|20)\d{2}\b/i;

    let currentEdu = null;

    for (const line of eduLines) {
        const hasDegree = degreeKeywords.test(line);
        const hasInst = /university|college|institute|school|academy/i.test(line);
        const dateMatch = line.match(yearRangeRegex);

        if (hasDegree || hasInst || !currentEdu) {
            if (currentEdu && (hasDegree || hasInst)) {
                entries.push(currentEdu);
                currentEdu = null;
            }

            let degree = null;
            let fieldOfStudy = null;
            let institution = null;
            let grade = null;

            if (hasDegree) {
                const degMatch = line.match(degreeKeywords);
                degree = degMatch ? degMatch[0] : null;

                if (line.toLowerCase().includes(" in ")) {
                    const inParts = line.split(/\s+in\s+/i);
                    degree = inParts[0].trim();
                    fieldOfStudy = inParts[1]?.split(/[,|–—]/)[0]?.trim() || null;
                } else {
                    degree = line.split(/[,|–—]/)[0].trim();
                }
            }

            if (hasInst) {
                institution = line.split(/[,|–—]/)[0].trim();
            }

            const gpaMatch = line.match(/(?:gpa|grade|score)[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
            if (gpaMatch) {
                grade = gpaMatch[0].trim();
            }

            let startDate = null;
            let endDate = null;
            if (dateMatch) {
                const dates = dateMatch[0].split(/(?:–|-|to)/i).map((d) => d.trim());
                startDate = dates[0] || null;
                endDate = dates[1] || (dates.length === 1 ? dates[0] : null);
            }

            currentEdu = {
                degree: degree || null,
                fieldOfStudy: fieldOfStudy || null,
                institution: institution || null,
                location: null,
                startDate,
                endDate,
                grade: grade || null
            };
        } else if (currentEdu) {
            if (/university|college|institute|school/i.test(line) && !currentEdu.institution) {
                currentEdu.institution = line.split(/[,|–—]/)[0].trim();
            }
            const gpaMatch = line.match(/(?:gpa|grade|score)[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
            if (gpaMatch && !currentEdu.grade) {
                currentEdu.grade = gpaMatch[0].trim();
            }
        }
    }

    if (currentEdu) {
        entries.push(currentEdu);
    }

    return entries;
};

/**
 * Extracts structured projects from projects section lines
 * @param {string[]} projLines 
 * @returns {Array<object>} Project objects
 */
export const extractProjects = (projLines = []) => {
    if (!projLines || projLines.length === 0) return [];

    const projects = [];
    let currentProj = null;
    const descLines = [];

    const flushProject = () => {
        if (currentProj) {
            currentProj.description = descLines.length > 0 ? descLines.join(" ") : null;
            projects.push(currentProj);
            currentProj = null;
            descLines.length = 0;
        }
    };

    for (const line of projLines) {
        const isHeaderLike = !currentProj || (!line.startsWith("•") && !line.startsWith("-") && line.length < 60);

        if (isHeaderLike && !line.toLowerCase().includes("technologies:") && !line.toLowerCase().includes("tech:")) {
            flushProject();

            const tokens = line.split(/[|–—]/).map((t) => t.trim()).filter(Boolean);
            const projectName = tokens[0] || line.trim();

            currentProj = {
                projectName,
                description: null,
                technologies: [],
                projectUrl: null
            };
        } else if (currentProj) {
            if (/^(?:technologies|tech|tools|stack)[:\s]*/i.test(line)) {
                const techStr = line.replace(/^(?:technologies|tech|tools|stack)[:\s]*/i, "");
                currentProj.technologies = techStr.split(/[,•|/]/).map((t) => t.trim()).filter(Boolean);
            } else if (/https?:\/\/[^\s]+/i.test(line)) {
                const urlMatch = line.match(/https?:\/\/[^\s]+/i);
                currentProj.projectUrl = urlMatch ? urlMatch[0].trim() : null;
            } else {
                descLines.push(line.replace(/^[•*\->\s]+/, "").trim());
            }
        }
    }

    flushProject();
    return projects;
};

/**
 * Extracts structured certifications from certification section lines
 * @param {string[]} certLines 
 * @returns {Array<object>} Certification objects
 */
export const extractCertifications = (certLines = []) => {
    if (!certLines || certLines.length === 0) return [];

    return certLines
        .map((line) => line.replace(/^[•*\->\s]+/, "").trim())
        .filter(Boolean)
        .map((line) => {
            const dateMatch = line.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*(?:19|20)\d{2}\b/i);
            const issueDate = dateMatch ? dateMatch[0].trim() : null;

            const urlMatch = line.match(/https?:\/\/[^\s]+/i);
            const credentialUrl = urlMatch ? urlMatch[0].trim() : null;

            const cleanLine = line
                .replace(/https?:\/\/[^\s]+/i, "")
                .replace(dateMatch ? dateMatch[0] : "", "")
                .replace(/[,–—|-]+$/, "")
                .trim();

            const tokens = cleanLine.split(/[,|–—]/).map((t) => t.trim()).filter(Boolean);
            const name = tokens[0] || cleanLine;
            const issuingOrganization = tokens[1] || null;

            return {
                name,
                issuingOrganization,
                issueDate,
                credentialUrl
            };
        });
};

/**
 * Converts raw extracted resume text into validated structured JSON format
 * 
 * @param {string} rawText - Extracted plain text from PDF or DOCX
 * @param {object} [options]
 * @param {string} [options.sourceType="unknown"] - "pdf" | "docx" | "unknown"
 * @param {string|number} [options.resumeId]
 * @returns {object} Validated structured resume object
 */
export const structureResumeContent = (rawText, options = {}) => {
    const { sourceType = "unknown" } = options;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
        const err = new Error("No readable resume text provided for structuring.");
        err.statusCode = 400;
        err.code = "EMPTY_RESUME_TEXT";
        throw err;
    }

    // 1. Text normalization
    const normalized = normalizeResumeText(rawText);

    // 2. Section segmentation
    const sections = segmentResumeSections(normalized);

    // 3. Section extractions
    const personalInfo = extractPersonalInfo(sections.HEADER, sections.CONTACT, normalized);
    const professionalSummary = sections.SUMMARY.length > 0 ? sections.SUMMARY.join(" ") : null;
    const skills = extractSkills(sections.SKILLS);
    const experience = extractExperience(sections.EXPERIENCE);
    const education = extractEducation(sections.EDUCATION);
    const projects = extractProjects(sections.PROJECTS);
    const certifications = extractCertifications(sections.CERTIFICATIONS);
    const languages = sections.LANGUAGES
        .flatMap((line) => line.split(/[,•|/]/).map((l) => l.trim()))
        .filter(Boolean);
    const achievements = sections.ACHIEVEMENTS
        .map((line) => line.replace(/^[•*\->\s]+/, "").trim())
        .filter(Boolean);

    const additionalSections = sections.ADDITIONAL.map((sec) => ({
        heading: sec.heading,
        content: sec.lines.join("\n")
    }));

    // 4. Metadata
    const metadata = {
        sourceType: sourceType === "docx" ? "docx" : (sourceType === "pdf" ? "pdf" : "unknown"),
        characterCount: normalized.length,
        wordCount: normalized.split(/\s+/).filter(Boolean).length,
        parserVersion: "1.0.0"
    };

    // 5. Assemble structured data
    const draftStructuredResume = {
        personalInfo,
        professionalSummary,
        skills,
        experience,
        education,
        projects,
        certifications,
        languages,
        achievements,
        additionalSections,
        metadata
    };

    // 6. Schema validation using Zod
    try {
        const validated = structuredResumeSchema.parse(draftStructuredResume);
        return validated;
    } catch (zodErr) {
        const err = new Error(`Structured resume validation failed: ${zodErr.message}`);
        err.statusCode = 422;
        err.code = "SCHEMA_VALIDATION_FAILED";
        throw err;
    }
};

export default {
    structureResumeContent,
    normalizeResumeText,
    segmentResumeSections,
    extractPersonalInfo,
    extractSkills,
    extractExperience,
    extractEducation,
    extractProjects,
    extractCertifications
};
