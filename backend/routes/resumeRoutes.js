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
    getResumeAnalysis
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
