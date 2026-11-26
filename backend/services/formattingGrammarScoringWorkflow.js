import db from "../config/db.js";
import { calculateFormattingScore } from "./formattingScoringService.js";
import { calculateGrammarScore } from "./grammarScoringService.js";
import { formattingGrammarScoreResponseSchema } from "../validators/formattingGrammarScoreSchema.js";
import { getResumeFileForPreviewOrDownload, updateResumeExtractedText } from "./resumeStorageService.js";
import { extractTextFromPdf } from "./pdfExtractionService.js";
import { extractTextFromDocx } from "./docxExtractionService.js";
import { structureResumeContent } from "./resumeStructuringService.js";
import { AnalysisWorkflowError } from "./resumeAnalysisService.js";
import { evaluateSkills, evaluateEducation, evaluateExperience } from "./detailedResumeScoringService.js";

/**
 * PHASE 7: Calculate Combined Formatting & Grammar Score with Overall Score Integration
 * 
 * Category Weights for Overall Score:
 * - Content Quality: 25 (refined by Grammar & Writing score)
 * - Skills: 20
 * - Experience: 20
 * - Projects: 15
 * - Education: 10
 * - Clarity & Completeness: 10 (refined by Formatting & Readability score)
 * Total = 100 Points.
 * 
 * @param {object} params
 * @param {string} params.rawText
 * @param {object} params.structuredResume
 * @param {number} params.resumeId
 * @param {number} params.userId
 * @param {"free"|"ai"} [params.analysisMode="free"]
 * @returns {object} Validated response matching formattingGrammarScoreResponseSchema
 */
export const calculateFormattingGrammarScore = ({
    rawText = "",
    structuredResume = {},
    resumeId,
    userId,
    analysisMode = "free"
}) => {
    // 1. Calculate formatting and grammar scores
    const formatting = calculateFormattingScore({ rawText, structuredResume });
    const grammar = calculateGrammarScore({ rawText, structuredResume });

    // 2. Evaluate remaining qualification categories via Lesson 6.3 engine
    const skills = evaluateSkills({ structuredResume, rawText });
    const education = evaluateEducation({ structuredResume, rawText });
    const experience = evaluateExperience({ structuredResume, rawText });

    // 3. Overall Integration per Phase 7 Rubric:
    // A. Grammar contributes directly to Resume Content Quality (Weight: 25)
    let contentQualityEarned = Math.round(((grammar.rating / 100) * 15) * 10) / 10;
    if (structuredResume.personalInfo?.email) contentQualityEarned += 2.5;
    if (structuredResume.personalInfo?.phone) contentQualityEarned += 2.5;
    if (structuredResume.professionalSummary && structuredResume.professionalSummary.length > 20) contentQualityEarned += 5;
    contentQualityEarned = Math.min(25, Math.round(contentQualityEarned * 10) / 10);

    // B. Projects Quality (Weight: 15)
    let projectsEarned = 0;
    const projectsList = Array.isArray(structuredResume.projects) ? structuredResume.projects : [];
    if (projectsList.length >= 2) projectsEarned += 10;
    else if (projectsList.length === 1) projectsEarned += 7;
    if (projectsList.some(p => (p.technologies || []).length > 0)) projectsEarned += 3;
    if (projectsList.some(p => (p.description || "").trim().length > 30)) projectsEarned += 2;
    projectsEarned = Math.min(15, projectsEarned);

    // C. Formatting contributes directly to Resume Clarity and Completeness (Weight: 10)
    let clarityEarned = Math.round(((formatting.rating / 100) * 10) * 10) / 10;
    clarityEarned = Math.min(10, clarityEarned);

    // D. Composite Overall Calculation
    const isExperienceNotApplicable = experience.status === "not_applicable_fresher";
    let isNormalized = false;
    let totalScore = 0;

    const rawEarnedSum =
        contentQualityEarned +
        skills.earnedPoints +
        experience.earnedPoints +
        projectsEarned +
        education.earnedPoints +
        clarityEarned;

    if (isExperienceNotApplicable) {
        isNormalized = true;
        totalScore = Math.min(100, Math.round((rawEarnedSum / 80) * 100));
    } else {
        totalScore = Math.min(100, Math.round(rawEarnedSum));
    }

    const summaryNotes = [
        `Formatting Score: ${formatting.rating}/100`,
        `Grammar Score: ${grammar.rating}/100`,
        `Overall Composite Score: ${totalScore}/100`
    ];

    const payload = {
        resumeId: Number(resumeId),
        userId: Number(userId),
        analysisMode,
        scoringVersion: "1.2.0",
        formattingScore: formatting.rating,
        grammarScore: grammar.rating,
        overallScore: totalScore,
        formatting,
        grammar,
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
        summaryNotes,
        scoredAt: new Date().toISOString()
    };

    return formattingGrammarScoreResponseSchema.parse(payload);
};

/**
 * PHASE 9: Persist Formatting and Grammar Scoring in MySQL resume_scores
 * 
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.resumeId
 * @param {number} [params.analysisId]
 * @param {object} params.formattingGrammarResult
 * @returns {Promise<object>} Persistence record
 */
export const saveFormattingGrammarScoreRecord = async ({
    userId,
    resumeId,
    analysisId,
    formattingGrammarResult
}) => {
    let resolvedAnalysisId = analysisId;

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
                 VALUES (?, ?, 'completed', 'rule_based', 'formatting-grammar-engine', ?, NOW())`,
                [userId, resumeId, formattingGrammarResult.overallScore]
            );
            resolvedAnalysisId = insert.insertId;
        }
    }

    const serializedFormatting = JSON.stringify(formattingGrammarResult.formatting);
    const serializedGrammar = JSON.stringify(formattingGrammarResult.grammar);

    await db.execute(
        `INSERT INTO resume_scores 
         (analysis_id, user_id, resume_id, overall_score, formatting_score, grammar_score, formatting_result, grammar_result, analysis_mode, scoring_version, scored_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '1.2.0', NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
             user_id = VALUES(user_id),
             resume_id = VALUES(resume_id),
             overall_score = VALUES(overall_score),
             formatting_score = VALUES(formatting_score),
             grammar_score = VALUES(grammar_score),
             formatting_result = VALUES(formatting_result),
             grammar_result = VALUES(grammar_result),
             analysis_mode = VALUES(analysis_mode),
             scoring_version = '1.2.0',
             scored_at = NOW()`,
        [
            resolvedAnalysisId,
            userId,
            resumeId,
            formattingGrammarResult.overallScore,
            formattingGrammarResult.formattingScore,
            formattingGrammarResult.grammarScore,
            serializedFormatting,
            serializedGrammar,
            formattingGrammarResult.analysisMode || "free"
        ]
    );

    return {
        analysisId: resolvedAnalysisId,
        resumeId,
        userId,
        overallScore: formattingGrammarResult.overallScore,
        formattingScore: formattingGrammarResult.formattingScore,
        grammarScore: formattingGrammarResult.grammarScore,
        scoringVersion: "1.2.0"
    };
};

/**
 * PHASE 10: Run Complete Formatting & Grammar Scoring Workflow
 * 
 * @param {object} params
 * @param {string|number} params.resumeId
 * @param {number} params.userId
 * @param {object} [params.options]
 * @returns {Promise<object>} Complete validated response
 */
export const runFormattingGrammarScoringWorkflow = async ({ resumeId, userId, options = {} }) => {
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

    // 5. Calculate scores
    const analysisMode = options.analysisMode || "free";
    const result = calculateFormattingGrammarScore({
        rawText,
        structuredResume,
        resumeId: fileInfo.resumeId,
        userId,
        analysisMode
    });

    // 6. Persist to MySQL
    const saved = await saveFormattingGrammarScoreRecord({
        userId,
        resumeId: fileInfo.resumeId,
        formattingGrammarResult: result
    });

    return {
        ...result,
        analysisId: saved.analysisId
    };
};

/**
 * Fetch latest formatting & grammar score record from MySQL
 * 
 * @param {object} params
 * @param {string|number} params.resumeId
 * @param {number} params.userId
 * @returns {Promise<object|null>}
 */
export const getLatestFormattingGrammarScoreForResume = async ({ resumeId, userId }) => {
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
            formatting_score,
            grammar_score,
            formatting_result,
            grammar_result,
            analysis_mode,
            scoring_version,
            scored_at
         FROM resume_scores
         WHERE resume_id = ?
         ORDER BY score_id DESC
         LIMIT 1`,
        [parsedResumeId]
    );

    if (!rows.length || (!rows[0].formatting_result && !rows[0].grammar_result)) {
        return null;
    }

    const row = rows[0];
    let parsedFormatting = null;
    let parsedGrammar = null;

    try {
        parsedFormatting = typeof row.formatting_result === "string" ? JSON.parse(row.formatting_result) : row.formatting_result;
    } catch {
        parsedFormatting = row.formatting_result;
    }

    try {
        parsedGrammar = typeof row.grammar_result === "string" ? JSON.parse(row.grammar_result) : row.grammar_result;
    } catch {
        parsedGrammar = row.grammar_result;
    }

    return {
        scoreId: row.score_id,
        analysisId: row.analysis_id,
        resumeId: row.resume_id,
        userId: row.user_id,
        overallScore: Number(row.overall_score),
        formattingScore: Number(row.formatting_score),
        grammarScore: Number(row.grammar_score),
        analysisMode: row.analysis_mode,
        scoringVersion: row.scoring_version,
        scoredAt: row.scored_at,
        formatting: parsedFormatting,
        grammar: parsedGrammar
    };
};

export default {
    calculateFormattingGrammarScore,
    saveFormattingGrammarScoreRecord,
    runFormattingGrammarScoringWorkflow,
    getLatestFormattingGrammarScoreForResume
};
