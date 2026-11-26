import db from "../config/db.js";
import {
    atsScoreResponseSchema,
    getAtsRatingLabel
} from "../validators/atsScoreSchema.js";
import { getResumeFileForPreviewOrDownload, updateResumeExtractedText } from "./resumeStorageService.js";
import { extractTextFromPdf } from "./pdfExtractionService.js";
import { extractTextFromDocx } from "./docxExtractionService.js";
import { structureResumeContent } from "./resumeStructuringService.js";
import { AnalysisWorkflowError } from "./resumeAnalysisService.js";

/**
 * Common action and industry keywords for General ATS Readability
 */
const GENERAL_ATS_KEYWORDS = [
    // Action Verbs
    "developed", "engineered", "implemented", "designed", "architected", "managed",
    "led", "optimized", "integrated", "built", "maintained", "analyzed", "automated",
    "deployed", "coordinated", "delivered", "collaborated", "spearheaded", "executed",
    // Core Engineering & Technical Concepts
    "rest api", "database", "backend", "frontend", "full stack", "data structures",
    "algorithms", "git", "version control", "authentication", "authorization",
    "unit testing", "debugging", "agile", "scrum", "performance optimization",
    "cloud", "ci/cd", "microservices", "responsive design", "scalability", "security"
];

/**
 * Standard resume headings for detection
 */
const STANDARD_HEADINGS_MAP = {
    "Contact Information": /^(?:contact\s+information|contact\s+details|personal\s+details|contact)$/i,
    "Professional Summary": /^(?:professional\s+summary|executive\s+summary|career\s+summary|summary\s+of\s+qualifications|summary|career\s+objective|objective|about\s+me)$/i,
    "Technical Skills": /^(?:technical\s+skills|core\s+skills|key\s+skills|skills\s+(&|and)\s+technologies|skills|technologies|tools|areas\s+of\s+expertise)$/i,
    "Work Experience": /^(?:work\s+experience|professional\s+experience|employment\s+history|work\s+history|experience|internships|career\s+history)$/i,
    "Education": /^(?:educational\s+background|academic\s+background|education|academics|qualifications)$/i,
    "Projects": /^(?:personal\s+projects|academic\s+projects|key\s+projects|technical\s+projects|projects)$/i,
    "Certifications": /^(?:certifications|certificates|licenses\s+(&|and)\s+certifications|licenses)$/i,
    "Achievements": /^(?:achievements|awards|honors\s+(&|and)\s+awards|accomplishments)$/i
};

/**
 * Safe PII masking helper for public ATS explanations
 */
export const maskPii = (str) => {
    if (!str || typeof str !== "string") return null;
    if (str.includes("@")) {
        const [local, domain] = str.split("@");
        const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
        return `${maskedLocal}@${domain}`;
    }
    // Phone or general identifier
    const digits = str.replace(/\D/g, "");
    if (digits.length >= 7) {
        return `***-***-${digits.slice(-4)}`;
    }
    return str.slice(0, 3) + "***";
};

/**
 * 1. Evaluate Resume File Compatibility (Weight: 15)
 */
export const evaluateFileCompatibility = (fileInfo, rawText) => {
    const weight = 15;
    const evidence = [];
    const limitations = [];
    let rating = 0;

    const fileType = (fileInfo.fileType || "").toLowerCase();
    const filename = (fileInfo.originalFilename || fileInfo.originalName || "").toLowerCase();
    const isPdf = fileType === "pdf" || filename.endsWith(".pdf");
    const isDocx = fileType === "docx" || filename.endsWith(".docx");

    if (!isPdf && !isDocx) {
        return {
            category: "Resume File Compatibility",
            rating: 0,
            weight,
            earnedPoints: 0,
            status: "not_evaluable",
            explanation: "Unsupported file format. ATS software strictly expects PDF or DOCX documents.",
            evidence: [`File format: ${fileType || "unknown"}`],
            limitations: ["File must be uploaded in standard PDF (.pdf) or Word (.docx) format."]
        };
    }

    // Base score for standard modern extension
    rating += 60;
    evidence.push(`Standard ATS format detected: ${isPdf ? "PDF (.pdf)" : "Word (.docx)"}`);

    // Check file size within reasonable range (10 KB to 5 MB)
    const size = Number(fileInfo.fileSize) || 0;
    if (size > 0 && size <= 5 * 1024 * 1024) {
        rating += 20;
        evidence.push(`File size (${Math.round(size / 1024)} KB) is optimal for ATS parsers (under 5 MB)`);
    } else if (size > 5 * 1024 * 1024) {
        limitations.push("Large file size (> 5 MB) may cause parsing latency or timeouts on some legacy ATS systems.");
    }

    // Check presence of selectable text
    if (rawText && rawText.trim().length >= 100) {
        rating += 20;
        evidence.push("Selectable machine-readable text stream verified");
    } else {
        rating = Math.min(rating, 30);
        limitations.push("Document contains little or no selectable text. It may be an image scan requiring OCR.");
    }

    rating = Math.min(100, rating);
    const earnedPoints = Math.round((rating / 100) * weight * 10) / 10;

    return {
        category: "Resume File Compatibility",
        rating,
        weight,
        earnedPoints,
        status: "evaluated",
        explanation: rating >= 80
            ? "File format and binary structure conform to modern ATS parsing standards."
            : "File format is acceptable, but text extraction or document structure has limitations.",
        evidence,
        limitations
    };
};

/**
 * 2. Evaluate Standard Section Detection (Weight: 20)
 */
export const evaluateStandardSections = (structuredResume, rawText) => {
    const weight = 20;
    const detectedSections = [];
    const missingSections = [];
    const lines = (rawText || "").split("\n").map((l) => l.trim().replace(/^[#*•\-~>\s]+/, "").replace(/[:\s]+$/, ""));

    for (const [sectionName, regex] of Object.entries(STANDARD_HEADINGS_MAP)) {
        const foundInLines = lines.some((line) => line.length <= 40 && regex.test(line));
        const foundInStructured = (
            (sectionName === "Contact Information" && (structuredResume.personalInfo?.email || structuredResume.personalInfo?.phone)) ||
            (sectionName === "Professional Summary" && Boolean(structuredResume.professionalSummary)) ||
            (sectionName === "Technical Skills" && structuredResume.skills?.length > 0) ||
            (sectionName === "Work Experience" && structuredResume.experience?.length > 0) ||
            (sectionName === "Education" && structuredResume.education?.length > 0) ||
            (sectionName === "Projects" && structuredResume.projects?.length > 0) ||
            (sectionName === "Certifications" && structuredResume.certifications?.length > 0) ||
            (sectionName === "Achievements" && structuredResume.achievements?.length > 0)
        );

        if (foundInLines || foundInStructured) {
            detectedSections.push(sectionName);
        } else {
            missingSections.push(sectionName);
        }
    }

    // Core essential sections: Contact, Skills, Experience, Education
    const hasContact = detectedSections.includes("Contact Information");
    const hasSkills = detectedSections.includes("Technical Skills");
    const hasEducation = detectedSections.includes("Education");
    const hasExperience = detectedSections.includes("Work Experience");
    const hasProjects = detectedSections.includes("Projects");
    const hasSummary = detectedSections.includes("Professional Summary");

    let rating = 0;
    if (hasContact) rating += 20;
    if (hasSkills) rating += 25;
    if (hasEducation) rating += 20;

    // Handle fresher policy: Projects substitute for missing experience
    if (hasExperience) {
        rating += 25;
        if (hasSummary || hasProjects) rating += 10;
    } else if (hasProjects) {
        rating += 25; // Fresher with projects receives full section points
        if (hasSummary) rating += 10;
    }

    rating = Math.min(100, Math.max(10, rating));
    const earnedPoints = Math.round((rating / 100) * weight * 10) / 10;

    return {
        category: "Standard Section Detection",
        rating,
        weight,
        earnedPoints,
        status: "evaluated",
        explanation: `Detected ${detectedSections.length} recognizable resume sections. Modern ATS systems rely on standard headings to categorize candidate data.`,
        evidence: detectedSections.map((sec) => `Found section heading: "${sec}"`),
        detectedSections,
        missingSections,
        limitations: missingSections.includes("Work Experience") && !hasProjects
            ? ["Neither Work Experience nor Projects sections were clearly detected."]
            : []
    };
};

/**
 * 3. Evaluate Contact Information Detection (Weight: 10)
 */
export const evaluateContactInformation = (structuredResume, rawText) => {
    const weight = 10;
    const pInfo = structuredResume.personalInfo || {};
    const evidence = [];
    let rating = 0;

    // Name
    if (pInfo.fullName && pInfo.fullName.trim().length >= 2) {
        rating += 30;
        evidence.push(`Full Name verified: ${pInfo.fullName}`);
    } else {
        evidence.push("Full Name could not be definitively isolated from header.");
    }

    // Email
    if (pInfo.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pInfo.email)) {
        rating += 30;
        evidence.push(`Email verified: ${maskPii(pInfo.email)}`);
    } else {
        evidence.push("Valid email address was not detected.");
    }

    // Phone
    if (pInfo.phone && pInfo.phone.trim().length >= 7) {
        rating += 25;
        evidence.push(`Phone number verified: ${maskPii(pInfo.phone)}`);
    } else {
        evidence.push("Phone number was not detected.");
    }

    // Location
    if (pInfo.location && pInfo.location.trim().length >= 2) {
        rating += 15;
        evidence.push(`Location detected: ${pInfo.location}`);
    }

    // Professional links (bonus/enrichment)
    const links = [];
    if (pInfo.linkedin) links.push("LinkedIn");
    if (pInfo.github) links.push("GitHub");
    if (pInfo.portfolio) links.push("Portfolio");
    if (links.length > 0) {
        evidence.push(`Professional links found: ${links.join(", ")}`);
    }

    rating = Math.min(100, rating);
    const earnedPoints = Math.round((rating / 100) * weight * 10) / 10;

    return {
        category: "Contact Information Detection",
        rating,
        weight,
        earnedPoints,
        status: "evaluated",
        explanation: rating >= 80
            ? "Primary contact details are complete and parseable by ATS scanners."
            : "Some critical contact fields (e.g. email or phone) could not be definitively parsed.",
        evidence,
        limitations: []
    };
};

/**
 * 4. Evaluate Keyword Readability (Weight: 20)
 */
export const evaluateKeywordReadability = (structuredResume, rawText, jobDescription = null) => {
    const weight = 20;
    const lowerText = (rawText || "").toLowerCase();
    const detectedGeneral = [];

    // General keyword matching using strict word boundaries (\b)
    for (const kw of GENERAL_ATS_KEYWORDS) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        if (regex.test(lowerText)) {
            detectedGeneral.push(kw);
        }
    }

    let jobSpecificMatching = {
        enabled: false,
        matchedKeywords: [],
        missingKeywords: [],
        matchPercentage: null,
        note: "No job description supplied. Evaluated against standard industry ATS keywords."
    };

    let rating = 0;
    const genCount = detectedGeneral.length;

    if (genCount >= 15) rating = 100;
    else if (genCount >= 11) rating = 85;
    else if (genCount >= 7) rating = 70;
    else if (genCount >= 4) rating = 55;
    else rating = 35;

    // Optional Mode B: Job-Specific Matching
    if (jobDescription && typeof jobDescription === "string" && jobDescription.trim().length > 30) {
        const jdWords = jobDescription
            .toLowerCase()
            .replace(/[^a-z0-9#+.\s-]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length >= 3 && !["the", "and", "for", "with", "that", "this", "from", "have", "will", "your", "must"].includes(w));

        const uniqueJdTerms = Array.from(new Set(jdWords));
        const matched = [];
        const missing = [];

        for (const term of uniqueJdTerms) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            if (new RegExp(`\\b${escaped}\\b`, "i").test(lowerText)) {
                matched.push(term);
            } else {
                missing.push(term);
            }
        }

        const matchPct = uniqueJdTerms.length > 0
            ? Math.round((matched.length / uniqueJdTerms.length) * 100)
            : 100;

        jobSpecificMatching = {
            enabled: true,
            matchedKeywords: matched.slice(0, 20),
            missingKeywords: missing.slice(0, 20),
            matchPercentage: matchPct,
            note: `Evaluated against ${uniqueJdTerms.length} terms extracted from supplied job description.`
        };

        // Blend 60% general readability + 40% JD match
        rating = Math.round(rating * 0.6 + matchPct * 0.4);
    }

    rating = Math.max(10, Math.min(100, rating));
    const earnedPoints = Math.round((rating / 100) * weight * 10) / 10;

    return {
        category: "Keyword Readability",
        rating,
        weight,
        earnedPoints,
        status: "evaluated",
        explanation: `Detected ${detectedGeneral.length} high-frequency ATS action and technical terms. Clear vocabulary allows ATS filters to categorize candidate skills accurately.`,
        evidence: detectedGeneral.slice(0, 15).map((kw) => `Keyword matched: "${kw}"`),
        keywordFindings: {
            mode: jobSpecificMatching.enabled ? "job_specific" : "general",
            generalKeywordsCount: detectedGeneral.length,
            detectedGeneralKeywords: detectedGeneral,
            jobSpecificMatching
        },
        limitations: []
    };
};

/**
 * 5. Evaluate Resume Structure and Consistency (Weight: 20)
 */
export const evaluateStructureAndConsistency = (structuredResume, rawText) => {
    const weight = 20;
    const evidence = [];
    const limitations = [];
    let rating = 70; // baseline

    // Date consistency check
    const dateRegex = /\b(?:20\d{2}|19\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)\b/gi;
    const dateMatches = (rawText || "").match(dateRegex) || [];
    if (dateMatches.length >= 4) {
        rating += 15;
        evidence.push("Chronological employment/education date patterns consistently formatted.");
    } else {
        evidence.push("Few chronological date patterns detected in text.");
    }

    // Bullet formatting check
    const bulletLines = (rawText || "").split("\n").filter((l) => /^[•*\->◦§]/.test(l.trim()));
    if (bulletLines.length >= 4) {
        rating += 15;
        evidence.push(`Found ${bulletLines.length} structured bullet points for experience/projects.`);
    } else {
        evidence.push("Limited bullet-point structure detected; continuous prose blocks may lower ATS readability.");
    }

    // Check for garbled repeated characters (e.g. "aaaaa" or repeated corrupted tokens)
    if (/([a-zA-Z])\1{5,}/.test(rawText || "")) {
        rating -= 20;
        limitations.push("Repeated character patterns detected, which may indicate text encoding artifacts.");
    }

    rating = Math.max(10, Math.min(100, rating));
    const earnedPoints = Math.round((rating / 100) * weight * 10) / 10;

    return {
        category: "Resume Structure and Consistency",
        rating,
        weight,
        earnedPoints,
        status: "evaluated",
        explanation: "Evaluates standard section sequencing, chronological date markers, and bullet clarity.",
        evidence,
        limitations
    };
};

/**
 * 6. Evaluate Text Extraction Quality (Weight: 15)
 */
export const evaluateTextExtractionQuality = (fileInfo, rawText) => {
    const weight = 15;
    const cleanText = (rawText || "").trim();
    const charCount = cleanText.length;
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const evidence = [];
    const limitations = [];

    // Empty text check (scanned document limitation)
    if (charCount < 50 || wordCount < 10) {
        return {
            category: "Text Extraction Quality",
            rating: 0,
            weight,
            earnedPoints: 0,
            status: "not_evaluable",
            explanation: "No readable machine text extracted. The document may be a scanned image or flattened vector file without an embedded text layer.",
            evidence: [`Character count: ${charCount}`, `Word count: ${wordCount}`],
            limitations: [
                "Document contains no selectable text layer.",
                "OCR (Optical Character Recognition) is required to parse scanned resumes.",
                "ATS engines cannot parse images without embedded text."
            ]
        };
    }

    let rating = 60;
    evidence.push(`Extracted ${wordCount} words and ${charCount} characters.`);

    // Ideal length check (250 - 1200 words)
    if (wordCount >= 200 && wordCount <= 1200) {
        rating += 20;
        evidence.push("Resume document word count is within optimal single/two-page ATS range (200-1200 words).");
    } else if (wordCount > 1200) {
        limitations.push("Document exceeds 1200 words; excessively long resumes may suffer parsing truncation.");
    }

    // Check for replacement characters (\uFFFD or excessive non-ascii)
    const replacementCount = (cleanText.match(/\uFFFD/g) || []).length;
    if (replacementCount > 5) {
        rating -= 20;
        limitations.push(`Detected ${replacementCount} replacement characters (\uFFFD) indicating font encoding mismatches.`);
    } else {
        rating += 20;
        evidence.push("Zero font encoding replacement artifacts detected.");
    }

    rating = Math.max(10, Math.min(100, rating));
    const earnedPoints = Math.round((rating / 100) * weight * 10) / 10;

    return {
        category: "Text Extraction Quality",
        rating,
        weight,
        earnedPoints,
        status: "evaluated",
        explanation: "Measures plain-text parser fidelity, character encoding integrity, and text density.",
        evidence,
        limitations
    };
};

/**
 * Generate Actionable ATS Improvement Suggestions
 */
export const generateAtsSuggestions = (categories, detectedSections, missingSections) => {
    const suggestions = [];

    if (categories.fileCompatibility?.rating < 80) {
        suggestions.push({
            area: "File Format",
            suggestion: "Ensure your resume is exported directly as a text-searchable PDF or standard DOCX document.",
            priority: "high"
        });
    }

    if (missingSections.includes("Professional Summary")) {
        suggestions.push({
            area: "Summary Section",
            suggestion: "Include a 2-3 sentence 'Professional Summary' at the top with your target title and core technical skills.",
            priority: "medium"
        });
    }

    if (missingSections.includes("Work Experience") && missingSections.includes("Projects")) {
        suggestions.push({
            area: "Experience / Projects",
            suggestion: "Clearly label a 'Work Experience' or 'Projects' section using standard headings so ATS filters can index your career trajectory.",
            priority: "high"
        });
    }

    if (categories.keywordReadability?.rating < 70) {
        suggestions.push({
            area: "Keyword Density",
            suggestion: "Incorporate more industry-standard action verbs (e.g., 'architected', 'optimized', 'engineered') and explicit technical tools in your bullets.",
            priority: "high"
        });
    }

    if (categories.contactInfo?.rating < 80) {
        suggestions.push({
            area: "Contact Header",
            suggestion: "Ensure your Email, Phone number, and City/State location are positioned cleanly in the top header.",
            priority: "high"
        });
    }

    if (categories.structureConsistency?.rating < 75) {
        suggestions.push({
            area: "Bullet Formatting",
            suggestion: "Use consistent, standard bullet points (- or •) rather than unusual characters or complex graphic columns.",
            priority: "medium"
        });
    }

    if (suggestions.length === 0) {
        suggestions.push({
            area: "Continuous Optimization",
            suggestion: "Your resume exhibits excellent ATS compatibility. Tailor your keywords to match specific job descriptions for target positions.",
            priority: "low"
        });
    }

    return suggestions;
};

/**
 * Master ATS Compatibility Calculation Engine (Lesson 6.2)
 * Deterministic, explainable, zero OpenAI calls required.
 * 
 * @param {object} params
 * @param {object} params.fileInfo
 * @param {object} params.structuredResume
 * @param {string} params.rawText
 * @param {string} [params.jobDescription]
 * @returns {object} Validated ATS Score Result
 */
export const calculateAtsScore = ({ fileInfo, structuredResume, rawText, jobDescription = null }) => {
    // 1. Run all 6 category evaluations
    const fileComp = evaluateFileCompatibility(fileInfo, rawText);
    const secDet = evaluateStandardSections(structuredResume, rawText);
    const contactEval = evaluateContactInformation(structuredResume, rawText);
    const kwEval = evaluateKeywordReadability(structuredResume, rawText, jobDescription);
    const structEval = evaluateStructureAndConsistency(structuredResume, rawText);
    const extractEval = evaluateTextExtractionQuality(fileInfo, rawText);

    const categories = {
        fileCompatibility: fileComp,
        sectionDetection: secDet,
        contactInfo: contactEval,
        keywordReadability: kwEval,
        structureConsistency: structEval,
        extractionQuality: extractEval
    };

    // 2. Normalization Policy for genuinely un-evaluable categories
    let applicableWeightTotal = 0;
    let totalEarnedPoints = 0;

    for (const cat of Object.values(categories)) {
        if (cat.status === "evaluated") {
            applicableWeightTotal += cat.weight;
            totalEarnedPoints += cat.earnedPoints;
        }
    }

    let finalAtsScore = 0;
    if (applicableWeightTotal > 0) {
        finalAtsScore = Math.round((totalEarnedPoints / applicableWeightTotal) * 100);
    }
    finalAtsScore = Math.max(0, Math.min(100, finalAtsScore));

    const ratingLabel = getAtsRatingLabel(finalAtsScore);
    const suggestions = generateAtsSuggestions(categories, secDet.detectedSections, secDet.missingSections);

    const limitations = [
        "ATS score is an estimated compatibility indicator based on standard ATS parsing heuristics.",
        "Does not guarantee human recruiter selection or individual employer ATS vendor pass-rates.",
        "Visual styling, complex CSS/table rendering, and graphical elements are not simulated by text extraction."
    ];

    if (extractEval.status === "not_evaluable") {
        limitations.unshift("Document has zero selectable text (scanned image). OCR is required for machine readability.");
    }

    const result = {
        atsScore: finalAtsScore,
        ratingLabel,
        scoringVersion: "1.0.0",
        applicableWeightTotal,
        categories,
        detectedSections: secDet.detectedSections,
        missingSections: secDet.missingSections,
        keywordFindings: kwEval.keywordFindings,
        textExtractionQuality: {
            characterCount: (rawText || "").trim().length,
            wordCount: (rawText || "").trim().split(/\s+/).filter(Boolean).length,
            isReadable: extractEval.status === "evaluated",
            isScannedPdfSuspected: extractEval.status === "not_evaluable"
        },
        improvementSuggestions: suggestions,
        limitations
    };

    // Validate output with Zod schema
    const validated = atsScoreResponseSchema.parse(result);
    return validated;
};

/**
 * Save or update ATS score in resume_scores table
 */
export const saveAtsScoreRecord = async ({ userId, resumeId, analysisId, atsResult }) => {
    const atsScore = atsResult.atsScore;
    const ratingLabel = atsResult.ratingLabel;
    const serializedResult = JSON.stringify(atsResult);

    await db.execute(
        `INSERT INTO resume_scores 
         (analysis_id, user_id, resume_id, ats_score, ats_rating_label, ats_result, scoring_version, scored_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, '1.0.0', NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
             user_id = VALUES(user_id),
             resume_id = VALUES(resume_id),
             ats_score = VALUES(ats_score),
             ats_rating_label = VALUES(ats_rating_label),
             ats_result = VALUES(ats_result),
             scoring_version = VALUES(scoring_version),
             scored_at = NOW()`,
        [analysisId, userId, resumeId, atsScore, ratingLabel, serializedResult]
    );

    return true;
};

/**
 * Complete End-to-End Workflow to calculate and persist ATS Compatibility Score
 * 
 * @param {object} params
 * @param {string|number} params.resumeId
 * @param {number} params.userId
 * @param {string} [params.jobDescription]
 * @returns {Promise<object>} Complete ATS Score Result
 */
export const runAtsScoringWorkflow = async ({ resumeId, userId, jobDescription = null }) => {
    const parsedResumeId = parseInt(resumeId, 10);
    if (!parsedResumeId || isNaN(parsedResumeId) || parsedResumeId <= 0) {
        throw new AnalysisWorkflowError("Invalid resume ID", 400, "INVALID_RESUME_ID");
    }

    // Step 1: Verify resume ownership and fetch file info
    const fileInfo = await getResumeFileForPreviewOrDownload({
        resumeId: parsedResumeId,
        userId
    });

    // Step 2: Ensure extracted text is available
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

    // Step 3: Structure resume content
    let structuredResume = {};
    if (rawText && rawText.trim().length > 0) {
        try {
            structuredResume = structureResumeContent(rawText, { sourceType });
        } catch {
            structuredResume = { personalInfo: {}, skills: [], experience: [], education: [], projects: [] };
        }
    }

    // Step 4: Calculate ATS score using deterministic scoring model
    const atsResult = calculateAtsScore({
        fileInfo,
        structuredResume,
        rawText,
        jobDescription
    });

    // Step 5: Resolve linked analysis ID or create a placeholder row in resume_analyses if none exists
    const [existingAnalyses] = await db.execute(
        `SELECT analysis_id FROM resume_analyses WHERE resume_id = ? AND user_id = ? ORDER BY analysis_id DESC LIMIT 1`,
        [parsedResumeId, userId]
    );

    let analysisId;
    if (existingAnalyses.length > 0) {
        analysisId = existingAnalyses[0].analysis_id;
    } else {
        const [insertedAnalysis] = await db.execute(
            `INSERT INTO resume_analyses 
             (user_id, resume_id, analysis_status, analysis_type, ai_model, overall_score, analyzed_at)
             VALUES (?, ?, 'completed', 'rule_based', 'ats-engine', ?, NOW())`,
            [userId, parsedResumeId, atsResult.atsScore]
        );
        analysisId = insertedAnalysis.insertId;
    }

    // Step 6: Persist in resume_scores table
    await saveAtsScoreRecord({
        userId,
        resumeId: parsedResumeId,
        analysisId,
        atsResult
    });

    return {
        resumeId: parsedResumeId,
        userId,
        analysisId,
        atsScore: atsResult.atsScore,
        ratingLabel: atsResult.ratingLabel,
        atsResult
    };
};

/**
 * Fetch latest ATS score record for a resume
 */
export const getLatestAtsScoreForResume = async ({ resumeId, userId }) => {
    const parsedResumeId = parseInt(resumeId, 10);
    if (!parsedResumeId || isNaN(parsedResumeId) || parsedResumeId <= 0) {
        throw new AnalysisWorkflowError("Invalid resume ID", 400, "INVALID_RESUME_ID");
    }

    // Ownership check
    const [resumeRows] = await db.execute(
        `SELECT resume_id, user_id FROM resumes WHERE resume_id = ? AND deleted_at IS NULL`,
        [parsedResumeId]
    );

    if (!resumeRows.length) return null;
    if (resumeRows[0].user_id !== userId) {
        throw new AnalysisWorkflowError("Access denied: you do not own this resource", 403, "FORBIDDEN_RESOURCE");
    }

    const [scores] = await db.execute(
        `SELECT rs.score_id, rs.analysis_id, rs.resume_id, rs.user_id, rs.ats_score, rs.ats_rating_label, rs.ats_result, rs.scoring_version, rs.scored_at
         FROM resume_scores rs
         WHERE rs.resume_id = ? AND rs.user_id = ? AND rs.ats_result IS NOT NULL
         ORDER BY rs.score_id DESC
         LIMIT 1`,
        [parsedResumeId, userId]
    );

    if (!scores.length) return null;

    const row = scores[0];
    let parsedResult = null;
    try {
        parsedResult = typeof row.ats_result === "string" ? JSON.parse(row.ats_result) : row.ats_result;
    } catch {
        parsedResult = row.ats_result;
    }

    return {
        scoreId: row.score_id,
        analysisId: row.analysis_id,
        resumeId: row.resume_id,
        userId: row.user_id,
        atsScore: row.ats_score ? parseFloat(row.ats_score) : null,
        ratingLabel: row.ats_rating_label,
        atsResult: parsedResult,
        scoringVersion: row.scoring_version,
        scoredAt: row.scored_at
    };
};

export default {
    calculateAtsScore,
    runAtsScoringWorkflow,
    getLatestAtsScoreForResume,
    evaluateFileCompatibility,
    evaluateStandardSections,
    evaluateContactInformation,
    evaluateKeywordReadability,
    evaluateStructureAndConsistency,
    evaluateTextExtractionQuality,
    saveAtsScoreRecord,
    maskPii
};
