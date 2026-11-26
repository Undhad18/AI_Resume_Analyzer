import { formattingScoreSchema } from "../validators/formattingGrammarScoreSchema.js";

/**
 * Standard resume headings pattern
 */
const STANDARD_HEADINGS = [
    { name: "Summary", regex: /^(?:professional\s+summary|executive\s+summary|summary\s+of\s+qualifications|career\s+summary|summary|about\s+me|profile)$/i },
    { name: "Skills", regex: /^(?:technical\s+skills|core\s+competencies|key\s+skills|skills\s+(&|and)\s+technologies|skills|technologies|areas\s+of\s+expertise)$/i },
    { name: "Experience", regex: /^(?:work\s+experience|professional\s+experience|employment\s+history|experience|internships|work\s+history)$/i },
    { name: "Education", regex: /^(?:educational\s+background|academic\s+background|education|academics|qualifications)$/i },
    { name: "Projects", regex: /^(?:personal\s+projects|academic\s+projects|technical\s+projects|key\s+projects|projects)$/i },
    { name: "Certifications", regex: /^(?:certifications|certificates|licenses\s+(&|and)\s+certifications|licenses)$/i }
];

/**
 * Common date patterns in resumes
 */
const DATE_PATTERNS = {
    yearOnly: /\b(?:19|20)\d{2}\b/g,
    yearRange: /\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current)\b/gi,
    monthYear: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2}\b/gi,
    numericDate: /\b\d{1,2}\/\d{2,4}\b/g
};

/**
 * 1. Evaluate Heading Consistency (Weight: 20%)
 */
export const evaluateHeadingConsistency = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 20;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Heading Consistency",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No resume text available to evaluate headings.",
            findings: [{
                type: "formatting",
                issue: "Missing Document Content",
                explanation: "The document text is empty.",
                severity: "high"
            }]
        };
    }

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const detectedHeadings = [];

    for (const line of lines) {
        if (line.length > 45) continue;
        for (const headingDef of STANDARD_HEADINGS) {
            if (headingDef.regex.test(line)) {
                detectedHeadings.push({
                    text: line,
                    matchedName: headingDef.name,
                    isUpper: line === line.toUpperCase() && /[A-Z]/.test(line),
                    isTitle: /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(line),
                    isLower: line === line.toLowerCase()
                });
                break;
            }
        }
    }

    if (detectedHeadings.length === 0) {
        findings.push({
            type: "formatting",
            issue: "No Clear Section Headings Detected",
            explanation: "Standard section headings (e.g. SKILLS, EXPERIENCE, EDUCATION) were not clearly identified.",
            evidence: lines.slice(0, 3).join(" "),
            suggestion: "Add distinct, standard section headings on their own lines (e.g., 'EXPERIENCE', 'EDUCATION').",
            severity: "high"
        });

        return {
            name: "Heading Consistency",
            weight,
            rating: 20,
            earnedPoints: (20 / 100) * weight,
            explanation: "Few or no recognizable section headings detected.",
            findings
        };
    }

    // Check casing consistency across detected headings
    const upperCount = detectedHeadings.filter(h => h.isUpper).length;
    const titleCount = detectedHeadings.filter(h => h.isTitle).length;
    const totalHeadings = detectedHeadings.length;

    let rating = 100;
    if (upperCount === totalHeadings || titleCount === totalHeadings) {
        // Perfect casing consistency
        rating = 100;
    } else if (upperCount > 0 && titleCount > 0) {
        rating = 75;
        findings.push({
            type: "formatting",
            issue: "Inconsistent Heading Casing",
            explanation: "Headings mix ALL CAPS and Title Case inconsistently.",
            evidence: detectedHeadings.map(h => h.text).join(", "),
            suggestion: "Standardize all headings to either ALL CAPS (e.g., 'EXPERIENCE') or Title Case (e.g., 'Experience').",
            severity: "medium"
        });
    } else {
        rating = 85;
    }

    // Check for standard section coverage
    const uniqueSections = new Set(detectedHeadings.map(h => h.matchedName));
    if (uniqueSections.size < 3) {
        rating = Math.min(rating, 65);
        findings.push({
            type: "formatting",
            issue: "Limited Section Coverage",
            explanation: `Only ${uniqueSections.size} standard sections were identified: ${Array.from(uniqueSections).join(", ")}.`,
            evidence: Array.from(uniqueSections).join(", "),
            suggestion: "Include standard resume sections: Summary, Skills, Experience, and Education.",
            severity: "medium"
        });
    }

    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = rating >= 85
        ? `Identified ${totalHeadings} headings with consistent styling and standard naming.`
        : `Headings detected with styling or casing inconsistencies.`;

    return {
        name: "Heading Consistency",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 2. Evaluate Section Organization (Weight: 20%)
 */
export const evaluateSectionOrganization = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 20;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Section Organization",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No resume text available.",
            findings: []
        };
    }

    let rating = 100;

    // Check for duplicate sections in text
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const seenHeadings = new Map();

    for (const line of lines) {
        if (line.length > 45) continue;
        for (const headingDef of STANDARD_HEADINGS) {
            if (headingDef.regex.test(line)) {
                const count = seenHeadings.get(headingDef.name) || 0;
                seenHeadings.set(headingDef.name, count + 1);
                break;
            }
        }
    }

    const duplicateHeadings = [];
    for (const [name, count] of seenHeadings.entries()) {
        if (count > 1) {
            duplicateHeadings.push(name);
        }
    }

    if (duplicateHeadings.length > 0) {
        rating -= 25;
        findings.push({
            type: "formatting",
            issue: "Duplicate Section Detected",
            explanation: `The following sections appear more than once: ${duplicateHeadings.join(", ")}.`,
            evidence: duplicateHeadings.join(", "),
            suggestion: "Consolidate repeated sections into a single coherent section.",
            severity: "medium"
        });
    }

    // Check for misplaced contact details in body
    const hasEmailInMiddle = lines.slice(15).some(l => /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i.test(l));
    if (hasEmailInMiddle) {
        rating -= 15;
        findings.push({
            type: "formatting",
            issue: "Misplaced Contact Information",
            explanation: "Contact email was detected in the middle or bottom of the document rather than the header.",
            suggestion: "Place all contact details strictly at the top of the resume in the header.",
            severity: "low"
        });
    }

    // Check core section presence
    const coreCount = [
        structuredResume.skills?.length > 0,
        structuredResume.experience?.length > 0 || structuredResume.projects?.length > 0,
        structuredResume.education?.length > 0
    ].filter(Boolean).length;

    if (coreCount < 2) {
        rating -= 30;
        findings.push({
            type: "formatting",
            issue: "Incomplete Section Structure",
            explanation: "Core sections (Skills, Experience/Projects, Education) are not clearly partitioned.",
            suggestion: "Ensure Skills, Experience, and Education are each given their own dedicated section.",
            severity: "high"
        });
    }

    rating = Math.max(10, Math.min(100, rating));
    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = rating >= 80
        ? "Resume content is logically organized with distinct, non-redundant sections."
        : "Section organization contains structural overlap or duplicate sections.";

    return {
        name: "Section Organization",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 3. Evaluate Bullet Point Structure (Weight: 15%)
 */
export const evaluateBulletStructure = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 15;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Bullet Point Structure",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No resume text available.",
            findings: []
        };
    }

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const bulletMarkers = {
        bullet: 0,   // •
        dash: 0,     // - or –
        star: 0,     // *
        numbered: 0, // 1., 2.
        broken: 0    // ? or 
    };

    let totalBullets = 0;
    let longParagraphsCount = 0;

    for (const line of lines) {
        // Check for broken bullet characters at line start
        if (/^[?]\s+[A-Za-z]/.test(line)) {
            bulletMarkers.broken++;
            totalBullets++;
            continue;
        }

        // Standard bullet checks
        if (/^[•·▪]\s+/.test(line)) {
            bulletMarkers.bullet++;
            totalBullets++;
        } else if (/^[-–—]\s+/.test(line)) {
            bulletMarkers.dash++;
            totalBullets++;
        } else if (/^\*\s+/.test(line)) {
            bulletMarkers.star++;
            totalBullets++;
        } else if (/^\d+\.\s+/.test(line)) {
            bulletMarkers.numbered++;
            totalBullets++;
        } else {
            // Check if non-bullet line is a long dense paragraph
            const words = line.split(/\s+/).length;
            if (words > 75) {
                longParagraphsCount++;
            }
        }
    }

    let rating = 100;

    // 1. Broken bullet symbols check
    if (bulletMarkers.broken > 0) {
        rating -= 35;
        findings.push({
            type: "formatting",
            issue: "Broken Bullet Characters",
            explanation: `Found ${bulletMarkers.broken} lines starting with broken symbols (e.g., '?' or '') instead of proper bullet points.`,
            evidence: lines.find(l => /^[?]\s+/.test(l)) || "",
            suggestion: "Replace non-standard characters with standard unicode bullet points (•) or hyphens (-).",
            severity: "high"
        });
    }

    // 2. Bullet consistency check
    const markerTypesUsed = Object.entries(bulletMarkers)
        .filter(([k, count]) => k !== "broken" && count > 0)
        .length;

    if (markerTypesUsed > 1) {
        rating -= 20;
        findings.push({
            type: "formatting",
            issue: "Inconsistent Bullet Symbols",
            explanation: "Mixed bullet symbols detected (e.g. mixing hyphens, dots, and asterisks across sections).",
            suggestion: "Use a single consistent bullet character throughout all experience and project items.",
            severity: "medium"
        });
    }

    // 3. Wall-of-text check
    if (longParagraphsCount > 0) {
        rating -= 25;
        findings.push({
            type: "formatting",
            issue: "Dense Unstructured Paragraphs",
            explanation: `Detected ${longParagraphsCount} large paragraph blocks (> 75 words) without bullet points.`,
            suggestion: "Break large dense text blocks into concise 1–2 line bullet points.",
            severity: "medium"
        });
    }

    // 4. Presence of bullets in experience
    if (totalBullets === 0 && (structuredResume.experience?.length > 0 || structuredResume.projects?.length > 0)) {
        rating -= 40;
        findings.push({
            type: "formatting",
            issue: "No Bullet Points in Experience/Projects",
            explanation: "Work history and project achievements are written as continuous text without bullet points.",
            suggestion: "Format experience achievements as bullet points starting with action verbs.",
            severity: "high"
        });
    }

    rating = Math.max(10, Math.min(100, rating));
    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = rating >= 80
        ? `Clean bullet point structure with ${totalBullets} well-formatted list items.`
        : `Bullet formatting contains irregularities, mixed markers, or unformatted paragraphs.`;

    return {
        name: "Bullet Point Structure",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 4. Evaluate Date and Text Consistency (Weight: 15%)
 */
export const evaluateDateConsistency = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 15;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Date and Text Consistency",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No resume text available.",
            findings: []
        };
    }

    let rating = 100;

    // Check date pattern consistency
    const yearRanges = rawText.match(DATE_PATTERNS.yearRange) || [];
    const monthYears = rawText.match(DATE_PATTERNS.monthYear) || [];
    const numericDates = rawText.match(DATE_PATTERNS.numericDate) || [];

    if (monthYears.length > 0 && numericDates.length > 0) {
        rating -= 25;
        findings.push({
            type: "formatting",
            issue: "Inconsistent Date Formats",
            explanation: "Dates alternate between written months (e.g. 'May 2022') and numeric notation (e.g. '05/2022').",
            evidence: `${monthYears[0]} vs ${numericDates[0]}`,
            suggestion: "Standardize all dates to one format (e.g., 'Month YYYY - Present' or 'YYYY - YYYY').",
            severity: "medium"
        });
    }

    // Check spacing consistency (consecutive spaces or missing space after comma)
    const multipleSpacesCount = (rawText.match(/[^\S\r\n]{3,}/g) || []).length;
    if (multipleSpacesCount > 5) {
        rating -= 15;
        findings.push({
            type: "formatting",
            issue: "Irregular Whitespace & Spacing",
            explanation: `Found ${multipleSpacesCount} instances of excessive consecutive spaces.`,
            suggestion: "Clean up irregular double/triple spaces between words.",
            severity: "low"
        });
    }

    const missingSpaceAfterComma = (rawText.match(/[a-zA-Z],[a-zA-Z]/g) || []).length;
    if (missingSpaceAfterComma > 3) {
        rating -= 15;
        findings.push({
            type: "formatting",
            issue: "Missing Spaces After Punctuation",
            explanation: `Found ${missingSpaceAfterComma} commas directly attached to subsequent words without a space.`,
            evidence: (rawText.match(/[a-zA-Z],[a-zA-Z]/g) || []).slice(0, 3).join(", "),
            suggestion: "Ensure all commas are followed by a single space.",
            severity: "low"
        });
    }

    rating = Math.max(20, Math.min(100, rating));
    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = rating >= 80
        ? "Date formats and document spacing exhibit strong consistency."
        : "Found inconsistent date formatting or spacing irregularities.";

    return {
        name: "Date and Text Consistency",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 5. Evaluate Readability (Weight: 20%)
 */
export const evaluateReadability = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 20;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Readability",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No resume text available.",
            findings: []
        };
    }

    const words = rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount < 100) {
        return {
            name: "Readability",
            weight,
            rating: 30,
            earnedPoints: (30 / 100) * weight,
            explanation: "Document is excessively brief for professional evaluation.",
            findings: [{
                type: "readability",
                issue: "Sparse Content",
                explanation: `Resume contains only ${wordCount} words.`,
                suggestion: "Expand your technical background, projects, and impact.",
                severity: "high"
            }]
        };
    }

    let rating = 100;

    // Check for massive paragraphs (> 100 words in one block)
    const blocks = rawText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const wallOfTextBlocks = blocks.filter(b => b.split(/\s+/).length > 100);

    if (wallOfTextBlocks.length > 0) {
        rating -= 25;
        findings.push({
            type: "readability",
            issue: "Wall of Text Detected",
            explanation: `${wallOfTextBlocks.length} paragraph block(s) exceed 100 words without breakups.`,
            suggestion: "Break paragraphs into concise, punchy bullet points of 15–25 words each.",
            severity: "medium"
        });
    }

    // Check for repetitive phrases / word repetition
    const wordFreq = {};
    for (const w of words) {
        const cleanW = w.toLowerCase().replace(/[^a-z]/g, "");
        if (cleanW.length > 4) {
            wordFreq[cleanW] = (wordFreq[cleanW] || 0) + 1;
        }
    }

    const overusedWords = Object.entries(wordFreq)
        .filter(([w, count]) => count > 12 && !["experience", "project", "system", "software", "development"].includes(w))
        .map(([w]) => w);

    if (overusedWords.length > 0) {
        rating -= 15;
        findings.push({
            type: "readability",
            issue: "Repetitive Vocabulary",
            explanation: `Noticeably frequent repetition of words: "${overusedWords.join('", "')}".`,
            suggestion: "Use varied action verbs and synonyms to enhance prose dynamism.",
            severity: "low"
        });
    }

    rating = Math.max(20, Math.min(100, rating));
    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = rating >= 80
        ? "Document exhibits clear readability and appropriate sentence density."
        : "Readability could be improved by breaking dense paragraphs and varying vocabulary.";

    return {
        name: "Readability",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * 6. Evaluate Special Characters and Extraction Issues (Weight: 10%)
 */
export const evaluateSpecialCharacters = (rawText = "", structuredResume = {}) => {
    const findings = [];
    const weight = 10;

    if (!rawText || !rawText.trim()) {
        return {
            name: "Special Characters and Extraction Issues",
            weight,
            rating: 0,
            earnedPoints: 0,
            explanation: "No resume text available.",
            findings: []
        };
    }

    let rating = 100;

    // Check for replacement characters / extraction corruption
    const replacementChars = (rawText.match(/[\uFFFD]|â€™|Ã©|ï¿½/g) || []).length;
    if (replacementChars > 0) {
        rating -= 40;
        findings.push({
            type: "artifact",
            issue: "Garbled Characters Detected",
            explanation: `Found ${replacementChars} garbled or corrupted character artifacts resulting from encoding mismatch or PDF parser issues.`,
            suggestion: "Re-save your resume in UTF-8 encoding or export directly from Word/Docs without special ligatures.",
            severity: "high"
        });
    }

    // Check for repeated punctuation (e.g., ???, !!!, ...., ,,)
    const repeatedPunct = (rawText.match(/\?{2,}|\!{2,}|\,{2,}|\.{4,}/g) || []).length;
    if (repeatedPunct > 0) {
        rating -= 20;
        findings.push({
            type: "artifact",
            issue: "Repeated Punctuation",
            explanation: "Detected repeated punctuation marks (e.g. multiple question marks or excessive periods).",
            suggestion: "Remove repeated punctuation marks for professional presentation.",
            severity: "medium"
        });
    }

    // Check for broken word line splits (e.g. 'deve- \nloper' or 'imple- ment')
    const hyphenSplitWords = (rawText.match(/[a-zA-Z]+-\s+[a-zA-Z]+/g) || []).length;
    if (hyphenSplitWords > 3) {
        rating -= 15;
        findings.push({
            type: "artifact",
            issue: "Hyphenated Word Line Wraps",
            explanation: `Found ${hyphenSplitWords} words split across lines with hyphens.`,
            suggestion: "Turn off auto-hyphenation in your document editor before exporting to PDF.",
            severity: "low"
        });
    }

    rating = Math.max(20, Math.min(100, rating));
    const earnedPoints = Math.round(((rating / 100) * weight) * 10) / 10;
    const explanation = rating >= 85
        ? "No garbled characters, encoding errors, or broken extraction artifacts found."
        : "Found character encoding artifacts or irregular punctuation.";

    return {
        name: "Special Characters and Extraction Issues",
        weight,
        rating,
        earnedPoints,
        explanation,
        findings
    };
};

/**
 * PHASE 2: Calculate Complete Formatting Score (0–100)
 * 
 * Category Weights:
 * 1. Heading Consistency: 20%
 * 2. Section Organization: 20%
 * 3. Bullet Point Structure: 15%
 * 4. Date and Text Consistency: 15%
 * 5. Readability: 20%
 * 6. Special Characters and Extraction Issues: 10%
 * Total = 100%
 */
export const calculateFormattingScore = ({ rawText = "", structuredResume = {} }) => {
    const headingConsistency = evaluateHeadingConsistency(rawText, structuredResume);
    const sectionOrganization = evaluateSectionOrganization(rawText, structuredResume);
    const bulletStructure = evaluateBulletStructure(rawText, structuredResume);
    const dateConsistency = evaluateDateConsistency(rawText, structuredResume);
    const readability = evaluateReadability(rawText, structuredResume);
    const specialCharacters = evaluateSpecialCharacters(rawText, structuredResume);

    const earnedPointsSum =
        headingConsistency.earnedPoints +
        sectionOrganization.earnedPoints +
        bulletStructure.earnedPoints +
        dateConsistency.earnedPoints +
        readability.earnedPoints +
        specialCharacters.earnedPoints;

    const rating = Math.max(0, Math.min(100, Math.round(earnedPointsSum)));

    const allFindings = [
        ...headingConsistency.findings,
        ...sectionOrganization.findings,
        ...bulletStructure.findings,
        ...dateConsistency.findings,
        ...readability.findings,
        ...specialCharacters.findings
    ];

    const limitations = [
        "Evaluated via text-based formatting heuristics. Visual styling, margins, colors, and print layout are not detectable from plain extracted text."
    ];

    const status = (!rawText || !rawText.trim())
        ? "not_evaluable"
        : rating < 50 ? "needs_attention" : "evaluated";

    const payload = {
        category: "Formatting & Layout",
        rating,
        status,
        parameters: {
            headingConsistency,
            sectionOrganization,
            bulletStructure,
            dateConsistency,
            readability,
            specialCharacters
        },
        findings: allFindings,
        limitations
    };

    return formattingScoreSchema.parse(payload);
};

export default {
    evaluateHeadingConsistency,
    evaluateSectionOrganization,
    evaluateBulletStructure,
    evaluateDateConsistency,
    evaluateReadability,
    evaluateSpecialCharacters,
    calculateFormattingScore
};
