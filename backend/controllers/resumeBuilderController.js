/**
 * Resume Builder Content Generation & PDF Export Controller (Lessons 8.3 & 8.5)
 */

import {
  generateContentRequestSchema,
  validateSectionInputSufficiency
} from "../validators/resumeBuilderContentSchema.js";
import { resumePdfDownloadRequestSchema } from "../validators/resumePdfDownloadSchema.js";
import { generateBuilderContentFree } from "../services/freeContentGeneratorService.js";
import { generateBuilderContentAi } from "../services/aiContentGeneratorService.js";
import { generateResumePdf, ResumePdfError } from "../services/resumePdfService.js";
import { OpenAiServiceError } from "../services/openaiService.js";

/**
 * Generate resume content for specific section and tone
 * POST /api/resume-builder/generate-content
 */
export const generateBuilderContent = async (req, res, next) => {
  try {
    // 1. Authentication check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to generate resume content."
      });
    }

    // 2. Validate request body structure with Zod
    const parsed = generateContentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid content generation request.",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message
        }))
      });
    }

    const { mode, section, tone, data } = parsed.data;

    // 3. Validate input data sufficiency
    const sufficiencyCheck = validateSectionInputSufficiency(section, data);
    if (!sufficiencyCheck.valid) {
      return res.status(422).json({
        success: false,
        message: sufficiencyCheck.error || "Insufficient input provided for content generation.",
        errors: [{ field: "data", message: sufficiencyCheck.error }]
      });
    }

    // 4. Generate content according to mode
    let result;
    if (mode === "advanced") {
      result = await generateBuilderContentAi({ section, tone, data });
    } else {
      result = generateBuilderContentFree({ section, tone, data });
    }

    // 5. Return success payload
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof OpenAiServiceError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details || null
      });
    }

    console.error("Resume builder content generation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred during content generation.",
      code: "INTERNAL_GENERATION_ERROR"
    });
  }
};

/**
 * Generate and download formatted resume PDF (Lesson 8.5)
 * POST /api/resume-builder/download-pdf
 */
export const downloadResumePdf = async (req, res, next) => {
  try {
    // 1. Authentication check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to download resume PDF."
      });
    }

    // 2. Validate request body with Zod
    const parsed = resumePdfDownloadRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF download request parameters.",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message
        }))
      });
    }

    const { resumeData, selectedTemplate } = parsed.data;

    // 3. Generate PDF Buffer via ResumePdfService
    const { buffer, filename } = await generateResumePdf({
      resumeData,
      selectedTemplate
    });

    // 4. Return as downloadable PDF attachment
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).send(buffer);
  } catch (error) {
    if (error instanceof ResumePdfError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    console.error("Resume PDF download generation error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while generating the resume PDF.",
      code: "PDF_EXPORT_ERROR"
    });
  }
};
