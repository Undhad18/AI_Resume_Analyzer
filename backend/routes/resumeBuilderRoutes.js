/**
 * Resume Builder API Routes (Lessons 8.3 & 8.5)
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { builderAiLimiter } from "../middleware/rateLimitMiddleware.js";
import {
  generateBuilderContent,
  downloadResumePdf
} from "../controllers/resumeBuilderController.js";

const router = express.Router();

/**
 * POST /api/resume-builder/generate-content
 * Generates tailored, fact-preserving content for resume builder sections
 */
router.post(
  "/generate-content",
  authenticateToken,
  builderAiLimiter,
  generateBuilderContent
);

/**
 * POST /api/resume-builder/download-pdf
 * Generates and downloads formatted resume PDF for the selected template (Lesson 8.5)
 */
router.post(
  "/download-pdf",
  authenticateToken,
  downloadResumePdf
);

export default router;
