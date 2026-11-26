import db from "../config/db.js";
import { getResumeFileForPreviewOrDownload, updateResumeExtractedText } from "./resumeStorageService.js";
import { extractTextFromPdf } from "./pdfExtractionService.js";
import { extractTextFromDocx } from "./docxExtractionService.js";
import { structureResumeContent } from "./resumeStructuringService.js";
import { analyzeFullResumeWithAi } from "./openaiService.js";
import { getOpenAiModel } from "../config/openai.js";

/**
 * Concurrency window: consider analysis currently active if started within the last 60 seconds
 */
const ACTIVE_ANALYSIS_WINDOW_MS = 60 * 1000;

/**
 * Custom application error for analysis workflow exceptions
 */
export class AnalysisWorkflowError extends Error {
    constructor(message, statusCode = 500, code = "ANALYSIS_ERROR", details = null) {
        super(message);
        this.name = "AnalysisWorkflowError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

/**
 * Check for concurrent active analysis and create a new pending record
 * @param {object} params
 * @param {number} params.userId
 * @param {number} params.resumeId
 * @param {string} [params.aiModel]
 * @returns {Promise<number>} Inserted analysis ID
 */
export const createPendingAnalysisRecord = async ({ userId, resumeId, aiModel }) => {
    // 1. Concurrency check: prevent overlapping active requests for the same resume
    const [recentAnalyses] = await db.execute(
        `SELECT analysis_id, analysis_status, analyzed_at
         FROM resume_analyses
         WHERE resume_id = ? AND analysis_status = 'processing'
         ORDER BY analysis_id DESC
         LIMIT 1`,
        [resumeId]
    );

    if (recentAnalyses.length > 0) {
        const active = recentAnalyses[0];
        const ageMs = Date.now() - new Date(active.analyzed_at).getTime();

        if (ageMs < ACTIVE_ANALYSIS_WINDOW_MS) {
            const err = new AnalysisWorkflowError(
                "An AI analysis is currently in progress for this resume. Please wait a moment.",
                409,
                "ACTIVE_ANALYSIS_IN_PROGRESS",
                { analysisId: active.analysis_id }
            );
            throw err;
        }
    }

    // 2. Insert new pending analysis record
    const [result] = await db.execute(
        `INSERT INTO resume_analyses 
         (user_id, resume_id, analysis_status, analysis_type, ai_model, analyzed_at)
         VALUES (?, ?, 'pending', 'ai', ?, NOW())`,
        [userId, resumeId, aiModel || getOpenAiModel()]
    );

    return result.insertId;
};

/**
 * Update analysis status, output payload, and error messages
 * @param {object} params
 */
export const updateAnalysisRecord = async ({
    analysisId,
    status,
    analysisResult = null,
    overallScore = null,
    errorMessage = null,
    aiModel = null
}) => {
    const serializedResult = analysisResult
        ? typeof analysisResult === "string"
            ? analysisResult
            : JSON.stringify(analysisResult)
        : null;

    await db.execute(
        `UPDATE resume_analyses
         SET analysis_status = ?,
             analysis_result = ?,
             overall_score = ?,
             error_message = ?,
             ai_model = COALESCE(?, ai_model),
             analyzed_at = NOW()
         WHERE analysis_id = ?`,
        [status, serializedResult, overallScore, errorMessage, aiModel, analysisId]
    );
};

/**
 * Fetch the latest analysis record for a resume with strict tenant authorization
 * @param {object} params
 * @param {number} params.resumeId
 * @param {number} params.userId
 * @returns {Promise<object|null>} Analysis record or null
 */
export const getLatestAnalysisForResume = async ({ resumeId, userId }) => {
    const parsedResumeId = parseInt(resumeId, 10);
    if (!parsedResumeId || isNaN(parsedResumeId) || parsedResumeId <= 0) {
        const err = new AnalysisWorkflowError("Invalid resume ID", 400, "INVALID_RESUME_ID");
        throw err;
    }

    // 1. Verify resume existence and verify strict tenant ownership
    const [resumeRows] = await db.execute(
        `SELECT resume_id, user_id, resume_title, candidate_name
         FROM resumes 
         WHERE resume_id = ? AND deleted_at IS NULL`,
        [parsedResumeId]
    );

    if (!resumeRows.length) {
        return null;
    }

    const resumeRecord = resumeRows[0];
    if (resumeRecord.user_id !== userId) {
        const err = new AnalysisWorkflowError(
            "Access denied: you do not own this resource",
            403,
            "FORBIDDEN_RESOURCE"
        );
        throw err;
    }

    // 2. Query latest analysis record for this verified resume
    const [rows] = await db.execute(
        `SELECT 
            analysis_id,
            user_id,
            resume_id,
            overall_score,
            analysis_status,
            analysis_type,
            ai_model,
            analysis_result,
            error_message,
            analyzed_at
         FROM resume_analyses
         WHERE resume_id = ?
         ORDER BY analysis_id DESC
         LIMIT 1`,
        [parsedResumeId]
    );

    if (!rows.length) {
        return null;
    }

    const record = rows[0];
    let parsedResult = null;

    if (record.analysis_result) {
        try {
            parsedResult = typeof record.analysis_result === "string"
                ? JSON.parse(record.analysis_result)
                : record.analysis_result;
        } catch {
            parsedResult = record.analysis_result;
        }
    }

    return {
        analysisId: record.analysis_id,
        resumeId: record.resume_id,
        userId: record.user_id || userId,
        status: record.analysis_status,
        analysisType: record.analysis_type || (record.ai_model === "rule-based-engine" ? "rule_based" : "ai"),
        overallScore: record.overall_score ? parseFloat(record.overall_score) : null,
        aiModel: record.ai_model,
        analysisResult: parsedResult,
        errorMessage: record.error_message,
        analyzedAt: record.analyzed_at,
        resumeTitle: resumeRecord.resume_title,
        candidateName: resumeRecord.candidate_name
    };
};

/**
 * Execute the complete end-to-end AI resume analysis workflow
 * 
 * @param {object} params
 * @param {string|number} params.resumeId - ID of resume to analyze
 * @param {number} params.userId - Authenticated user ID (strictly enforced)
 * @param {object} [params.options] - Optional overrides (e.g. mock client for unit tests)
 * @returns {Promise<object>} Complete validated analysis result with metadata
 */
export const runCompleteResumeAnalysis = async ({ resumeId, userId, options = {} }) => {
    const parsedResumeId = parseInt(resumeId, 10);
    if (!parsedResumeId || isNaN(parsedResumeId) || parsedResumeId <= 0) {
        throw new AnalysisWorkflowError("Invalid resume ID", 400, "INVALID_RESUME_ID");
    }

    // Step 1: Verify user authentication & IDOR resource ownership
    const fileInfo = await getResumeFileForPreviewOrDownload({
        resumeId: parsedResumeId,
        userId
    });

    const targetModel = options.model || getOpenAiModel();

    // Step 2 & 3: Check concurrency & insert pending record
    const analysisId = await createPendingAnalysisRecord({
        userId,
        resumeId: parsedResumeId,
        aiModel: targetModel
    });

    // Step 4: Transition to processing
    await updateAnalysisRecord({
        analysisId,
        status: "processing"
    });

    try {
        // Step 5: Extract raw text if missing from database record
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

        // Step 6: Validate readable text presence
        if (!rawText || rawText.trim().length === 0) {
            const emptyErr = new AnalysisWorkflowError(
                "Cannot analyze resume: no readable text found in document.",
                422,
                "EMPTY_DOCUMENT_TEXT"
            );
            await updateAnalysisRecord({
                analysisId,
                status: "failed",
                errorMessage: emptyErr.message
            });
            throw emptyErr;
        }

        // Step 7: Deterministically structure sections using Lesson 5.3 engine
        const structuredResume = structureResumeContent(rawText, {
            sourceType,
            resumeId: fileInfo.resumeId
        });

        // Step 8: Update candidate_name in resumes table if newly identified
        if (structuredResume.personalInfo?.fullName) {
            try {
                await db.execute(
                    `UPDATE resumes 
                     SET candidate_name = ?, updated_at = NOW() 
                     WHERE resume_id = ? AND user_id = ? AND (candidate_name IS NULL OR candidate_name = '')`,
                    [structuredResume.personalInfo.fullName, fileInfo.resumeId, userId]
                );
            } catch {
                // Non-fatal
            }
        }

        // Step 9: Call OpenAI Responses API with Complete Analysis JSON Schema
        const aiResponse = await analyzeFullResumeWithAi(structuredResume, {
            ...options,
            model: targetModel
        });

        const validatedAnalysis = aiResponse.analysis;
        const overallScore = aiResponse.overallScore;

        // Step 10: Persist completed analysis in MySQL
        await updateAnalysisRecord({
            analysisId,
            status: "completed",
            analysisResult: validatedAnalysis,
            overallScore,
            aiModel: aiResponse.metadata?.model || targetModel
        });

        // Step 11: Also sync into resume_scores table if available
        try {
            await db.execute(
                `INSERT INTO resume_scores 
                 (analysis_id, overall_score, ats_score, skills_score, experience_score, education_score, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                     overall_score = VALUES(overall_score),
                     ats_score = VALUES(ats_score)`,
                [
                    analysisId,
                    overallScore,
                    overallScore, // ats baseline score
                    Math.min(100, (validatedAnalysis.skillsAnalysis?.foundSkills?.length || 0) * 10),
                    75.0,
                    80.0
                ]
            );
        } catch {
            // Non-critical, resume_scores is optional secondary table
        }

        return {
            analysisId,
            resumeId: fileInfo.resumeId,
            status: "completed",
            overallScore,
            analysis: validatedAnalysis,
            metadata: {
                aiModel: aiResponse.metadata?.model || targetModel,
                responseId: aiResponse.metadata?.responseId || null,
                analyzedAt: new Date().toISOString()
            }
        };
    } catch (err) {
        // Record failure status in MySQL so the record is never left dangling in 'processing'
        try {
            await updateAnalysisRecord({
                analysisId,
                status: "failed",
                errorMessage: err.message || "AI Analysis failed"
            });
        } catch (dbErr) {
            console.error("Failed to update analysis failure state in DB:", dbErr.message);
        }

        throw err;
    }
};

export default {
    runCompleteResumeAnalysis,
    getLatestAnalysisForResume,
    createPendingAnalysisRecord,
    updateAnalysisRecord,
    AnalysisWorkflowError
};
