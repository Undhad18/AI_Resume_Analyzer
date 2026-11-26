import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { uploadResumeMiddleware } from "../middleware/uploadMiddleware.js";
import { validateResumeFile } from "../middleware/validateResumeFile.js";
import {
    uploadResumeFile,
    getResumeList,
    previewResumeFile,
    downloadResumeFile,
    deleteResumeFile,
    extractResumeText,
    extractDocxResumeText,
    structureResumeFile,
    evaluateResumeWithAi,
    analyzeResume,
    analyzeResumeFree,
    getResumeAnalysis,
    calculateAtsScore,
    getAtsScore,
    calculateDetailedScore,
    getDetailedScore,
    calculateFormattingGrammarScore,
    getFormattingGrammarScore,
    calculateStrengthsWeaknesses,
    getStrengthsWeaknesses,
    detectSkillsKeywords,
    getSkillsKeywords,
    generateImprovementSuggestions,
    getImprovementSuggestions,
    updateImprovementSuggestionStatus,
    enhanceResume,
    getEnhancementDraft,
    updateDraft,
    approveDraft,
    discardDraft
} from "../controllers/resumeController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import db from "../config/db.js";

const router = express.Router();

// List paginated resumes belonging strictly to authenticated user
router.get("/", authenticateToken, getResumeList);

// Upload, validate, and store a resume document
router.post(
    "/upload",
    authenticateToken,
    uploadResumeMiddleware,
    validateResumeFile,
    uploadResumeFile
);

// Preview resume document (PDF inline stream with range support, or DOCX download fallback)
router.get("/:resumeId/preview", authenticateToken, previewResumeFile);

// Download resume document as attachment
router.get("/:resumeId/download", authenticateToken, downloadResumeFile);

// Extract readable text from PDF resume
router.post("/:resumeId/extract-text", authenticateToken, extractResumeText);

// Extract readable text from DOCX resume
router.post("/:resumeId/extract-docx-text", authenticateToken, extractDocxResumeText);

// Convert extracted resume text to structured JSON schema
router.post("/:resumeId/structure", authenticateToken, structureResumeFile);

// AI-powered structured resume evaluation using OpenAI Responses API
router.post("/:resumeId/ai-evaluate", authenticateToken, evaluateResumeWithAi);

// Complete AI resume analysis engine workflow (Lesson 5.5)
router.post("/:resumeId/analyze", authenticateToken, analyzeResume);

// Free deterministic rule-based resume analysis (zero OpenAI API calls)
router.post("/:resumeId/analyze-free", authenticateToken, analyzeResumeFree);

// Calculate deterministic ATS compatibility score (Lesson 6.2)
router.post("/:resumeId/ats-score", authenticateToken, calculateAtsScore);

// Fetch latest ATS score record for resume
router.get("/:resumeId/ats-score", authenticateToken, getAtsScore);

// Calculate detailed Skills, Education, and Experience score (Lesson 6.3)
router.post("/:resumeId/detailed-score", authenticateToken, calculateDetailedScore);

// Fetch latest detailed score record for resume
router.get("/:resumeId/detailed-score", authenticateToken, getDetailedScore);

// Calculate formatting and grammar score (Lesson 6.4)
router.post("/:resumeId/formatting-grammar-score", authenticateToken, calculateFormattingGrammarScore);

// Fetch latest formatting and grammar score record for resume
router.get("/:resumeId/formatting-grammar-score", authenticateToken, getFormattingGrammarScore);

// Detect strengths, weaknesses, and missing information (Lesson 7.1)
router.post("/:resumeId/strengths-weaknesses", authenticateToken, calculateStrengthsWeaknesses);

// Fetch latest strengths and weaknesses record for resume
router.get("/:resumeId/strengths-weaknesses", authenticateToken, getStrengthsWeaknesses);

// Detect missing skills and keywords (Lesson 7.2)
router.post("/:resumeId/skills-keywords", authenticateToken, detectSkillsKeywords);

// Fetch latest skills and keywords record for resume
router.get("/:resumeId/skills-keywords", authenticateToken, getSkillsKeywords);

// Generate improvement suggestions (Lesson 7.3)
router.post("/:resumeId/improvement-suggestions", authenticateToken, generateImprovementSuggestions);

// Fetch latest improvement suggestions record for resume
router.get("/:resumeId/improvement-suggestions", authenticateToken, getImprovementSuggestions);

// Update status of specific suggestion (pending / accepted / completed / dismissed)
router.patch("/:resumeId/improvement-suggestions/:suggestionId/status", authenticateToken, updateImprovementSuggestionStatus);

// Generate resume enhancement draft (Lesson 7.4)
router.post("/:resumeId/enhance", authenticateToken, enhanceResume);

// Fetch latest enhancement draft for resume
router.get("/:resumeId/enhance/draft", authenticateToken, getEnhancementDraft);

// Update editable draft content
router.put("/:resumeId/enhance/draft/:draftId", authenticateToken, updateDraft);

// Approve enhancement draft and create improved resume version
router.post("/:resumeId/enhance/draft/:draftId/approve", authenticateToken, approveDraft);

// Discard enhancement draft
router.post("/:resumeId/enhance/draft/:draftId/discard", authenticateToken, discardDraft);

// Fetch latest analysis record for resume
router.get("/:resumeId/analysis", authenticateToken, getResumeAnalysis);

// Soft delete resume document
router.delete("/:resumeId", authenticateToken, deleteResumeFile);

// Private endpoint with strict user ownership scoping for single resume metadata
router.get(
    "/:resumeId",
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { resumeId } = req.params;
        const authenticatedUserId = req.user.id;

        // Query strictly scoped to req.user.id (server-side identity truth)
        const [rows] = await db.execute(
            `SELECT resume_id, user_id, resume_title, candidate_name, status, created_at, updated_at
             FROM resumes
             WHERE resume_id = ? AND user_id = ? AND deleted_at IS NULL`,
            [resumeId, authenticatedUserId]
        );

        if (!rows.length) {
            // Check if resource exists under another tenant to verify ownership violation
            const [existsElsewhere] = await db.execute(
                `SELECT resume_id FROM resumes WHERE resume_id = ? AND deleted_at IS NULL`,
                [resumeId]
            );

            if (existsElsewhere.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied: you do not own this resource",
                    errors: null
                });
            }

            return res.status(404).json({
                success: false,
                message: "Resume not found",
                errors: null
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    })
);

export default router;
