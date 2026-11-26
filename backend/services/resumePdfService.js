/**
 * Resume PDF Generation Service (Lesson 8.5)
 * Orchestrates template selection, document layout, and PDF buffer generation.
 */

import PDFDocument from "pdfkit";
import { renderModernPdf } from "./pdfTemplates/modernPdfTemplate.js";
import { renderClassicPdf } from "./pdfTemplates/classicPdfTemplate.js";
import { renderMinimalPdf } from "./pdfTemplates/minimalPdfTemplate.js";
import { renderAtsPdf } from "./pdfTemplates/atsPdfTemplate.js";
import { extractValidPdfSections, sanitizeFilename } from "./pdfTemplates/pdfDataHelper.js";

export const ALLOWED_TEMPLATES = ["modern", "classic", "minimal", "ats"];
export const DEFAULT_TEMPLATE = "modern";

/**
 * Custom Error class for PDF generation failures
 */
export class ResumePdfError extends Error {
  constructor(message, statusCode = 500, code = "PDF_GENERATION_FAILED") {
    super(message);
    this.name = "ResumePdfError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Generates a PDF Buffer from resumeData and selectedTemplate
 * @param {Object} params
 * @param {Object} params.resumeData
 * @param {string} params.selectedTemplate
 * @returns {Promise<{ buffer: Buffer, filename: string, pageCount: number }>}
 */
export const generateResumePdf = async ({ resumeData = {}, selectedTemplate = DEFAULT_TEMPLATE }) => {
  // 1. Validate template
  const templateKey = ALLOWED_TEMPLATES.includes(selectedTemplate)
    ? selectedTemplate
    : DEFAULT_TEMPLATE;

  // 2. Validate resume data sufficiency
  const extracted = extractValidPdfSections(resumeData);
  if (extracted.isCompletelyEmpty) {
    throw new ResumePdfError(
      "Cannot generate PDF for a blank resume. Please provide at least personal details, experience, skills, or summary.",
      422,
      "EMPTY_RESUME"
    );
  }

  // 3. Initialize PDFKit document
  const doc = new PDFDocument({
    size: "A4",
    autoFirstPage: false,
    bufferPages: true,
    info: {
      Title: extracted.personalInfo.fullName
        ? `${extracted.personalInfo.fullName} - Resume`
        : "Resume",
      Author: extracted.personalInfo.fullName || "Candidate",
      Subject: "Professional Curriculum Vitae",
      Creator: "AI Resume Analyzer"
    }
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    let detectedPageCount = 1;

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", (err) => {
      reject(new ResumePdfError(`PDFKit document generation failed: ${err.message}`, 500, "PDFKIT_RENDER_ERROR"));
    });

    doc.on("end", () => {
      try {
        const buffer = Buffer.concat(chunks);
        const filename = sanitizeFilename(extracted.personalInfo.fullName, templateKey);

        resolve({
          buffer,
          filename,
          pageCount: detectedPageCount
        });
      } catch (err) {
        reject(new ResumePdfError(`Failed to assemble PDF buffer: ${err.message}`, 500, "BUFFER_ASSEMBLY_ERROR"));
      }
    });

    try {
      // Add first page with standardized A4 margins
      doc.addPage({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 45, right: 45 }
      });

      // 4. Dispatch template rendering
      switch (templateKey) {
        case "classic":
          renderClassicPdf(doc, resumeData);
          break;

        case "minimal":
          renderMinimalPdf(doc, resumeData);
          break;

        case "ats":
          renderAtsPdf(doc, resumeData);
          break;

        case "modern":
        default:
          renderModernPdf(doc, resumeData);
          break;
      }

      // Capture page count while buffer pages are still active before ending stream
      const range = doc.bufferedPageRange();
      detectedPageCount = range ? range.count : 1;

      // 5. Add unobtrusive page numbers on multi-page resumes (omitted on ATS for machine purity)
      if (detectedPageCount > 1 && templateKey !== "ats") {
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          const pageNum = i + 1;
          const totalPages = detectedPageCount;

          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#94a3b8")
            .text(`Page ${pageNum} of ${totalPages}`, 45, doc.page.height - 25, {
              width: doc.page.width - 90,
              align: "center"
            });
        }
      }

      // Finalize document stream
      doc.end();
    } catch (renderError) {
      reject(
        new ResumePdfError(
          `Template rendering error (${templateKey}): ${renderError.message}`,
          500,
          "TEMPLATE_RENDER_ERROR"
        )
      );
    }
  });
};

export default {
  generateResumePdf,
  ALLOWED_TEMPLATES,
  DEFAULT_TEMPLATE,
  ResumePdfError
};
