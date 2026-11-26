/**
 * Resume Enhancement Workflow Service (Lesson 7.4)
 * Orchestrates Free vs Advanced AI enhancement, draft persistence,
 * editable draft updates, approval into resume_versions, and discard.
 */

import db from "../config/db.js";
import { enhanceResumeFreeMode } from "./freeEnhancementService.js";
import { enhanceResumeAiMode } from "./aiEnhancementService.js";
import { getResumeFileForPreviewOrDownload, updateResumeExtractedText } from "./resumeStorageService.js";
import { extractTextFromPdf } from "./pdfExtractionService.js";
import { extractTextFromDocx } from "./docxExtractionService.js";
import { structureResumeContent } from "./resumeStructuringService.js";
import { AnalysisWorkflowError } from "./resumeAnalysisService.js";
import {
    enhanceResumeInputSchema,
    updateDraftInputSchema,
    ENHANCEMENT_SECTIONS_ENUM
} from "../validators/resumeEnhancementSchema.js";

/**
 * Recomputes sections diff between original and enhanced content
 */
export const computeSectionsDiff = (originalContent = {}, enhancedContent = {}, scope = "full_resume", sectionName = null) => {
    const diffs = [];
    const sectionsToInspect = scope === "single_section" && sectionName
        ? [sectionName]
        : ENHANCEMENT_SECTIONS_ENUM;

    for (const secKey of sectionsToInspect) {
        const orig = originalContent[secKey] !== undefined ? originalContent[secKey] : null;
        const enh = enhancedContent[secKey] !== undefined ? enhancedContent[secKey] : null;

        const isModified = JSON.stringify(orig) !== JSON.stringify(enh);
        const changes = [];

        if (isModified) {
            changes.push(`Enhanced and optimized ${secKey} formatting and phrasing`);
        } else {
            changes.push("Content verified clean; no modifications applied");
        }

        diffs.push({
            sectionName: secKey,
            original: orig,
            enhanced: enh,
            changes,
            isModified
        });
    }

    return diffs;
};

/**
 * Executes resume enhancement and creates an editable draft in resume_enhancement_drafts
 */
export const runResumeEnhancementWorkflow = async ({ resumeId, userId, options = {} }) => {
    const validatedInput = enhanceResumeInputSchema.parse(options);
    const { mode, scope, section, targetJobDescription } = validatedInput;

    // Verify resume exists and belongs to user
    const [resumeRows] = await db.query(
        "SELECT resume_id, user_id, resume_title, extracted_text FROM resumes WHERE resume_id = ? AND user_id = ?",
        [resumeId, userId]
    );

    if (!resumeRows || resumeRows.length === 0) {
        throw new AnalysisWorkflowError("Resume not found or unauthorized access", 404, "RESUME_NOT_FOUND");
    }

    const resume = resumeRows[0];
    let rawText = resume.extracted_text || "";

    // If extracted text missing, extract from storage
    if (!rawText || rawText.trim().length === 0) {
        const fileData = await getResumeFileForPreviewOrDownload(resumeId, userId);
        if (fileData.mimeType === "application/pdf") {
            const extractRes = await extractTextFromPdf(fileData.buffer);
            rawText = extractRes.text || "";
        } else if (
            fileData.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            fileData.mimeType === "application/msword"
        ) {
            const extractRes = await extractTextFromDocx(fileData.buffer);
            rawText = extractRes.text || "";
        }

        if (rawText && rawText.trim().length > 0) {
            await updateResumeExtractedText(resumeId, rawText);
        }
    }

    // Structure resume
    const structuredResume = structureResumeContent(rawText);

    // Run Free or AI Enhancement
    let result;
    if (mode === "advanced") {
        result = await enhanceResumeAiMode({
            structuredResume,
            rawText,
            scope,
            sectionName: section,
            targetJobDescription
        });
    } else {
        result = enhanceResumeFreeMode({
            structuredResume,
            scope,
            sectionName: section
        });
        result.modeUsed = "free";
    }

    // Persist draft into database
    const [insertResult] = await db.query(
        `INSERT INTO resume_enhancement_drafts 
        (user_id, resume_id, enhancement_mode, scope, section_name, original_content, enhanced_content, changes_summary, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [
            userId,
            resumeId,
            result.modeUsed || mode,
            scope,
            section || null,
            JSON.stringify(result.originalContent),
            JSON.stringify(result.enhancedContent),
            result.changesSummary
        ]
    );

    return {
        draftId: insertResult.insertId,
        resumeId: Number(resumeId),
        userId: Number(userId),
        enhancementMode: result.modeUsed || mode,
        scope,
        sectionName: section || null,
        originalContent: result.originalContent,
        enhancedContent: result.enhancedContent,
        sectionsDiff: result.sectionsDiff || computeSectionsDiff(result.originalContent, result.enhancedContent, scope, section),
        changesSummary: result.changesSummary,
        status: "draft"
    };
};

/**
 * Retrieves the latest enhancement draft for a resume
 */
export const getLatestEnhancementDraft = async ({ resumeId, userId }) => {
    const [rows] = await db.query(
        `SELECT id, user_id, resume_id, version_id, enhancement_mode, scope, section_name, 
                original_content, enhanced_content, changes_summary, status, approved_at, created_at, updated_at
         FROM resume_enhancement_drafts
         WHERE resume_id = ? AND user_id = ?
         ORDER BY id DESC LIMIT 1`,
        [resumeId, userId]
    );

    if (!rows || rows.length === 0) {
        return null;
    }

    const draft = rows[0];
    const originalContent = typeof draft.original_content === "string"
        ? JSON.parse(draft.original_content)
        : draft.original_content;
    const enhancedContent = typeof draft.enhanced_content === "string"
        ? JSON.parse(draft.enhanced_content)
        : draft.enhanced_content;

    const sectionsDiff = computeSectionsDiff(originalContent, enhancedContent, draft.scope, draft.section_name);

    return {
        draftId: draft.id,
        resumeId: draft.resume_id,
        userId: draft.user_id,
        versionId: draft.version_id,
        enhancementMode: draft.enhancement_mode,
        scope: draft.scope,
        sectionName: draft.section_name,
        originalContent,
        enhancedContent,
        sectionsDiff,
        changesSummary: draft.changes_summary,
        status: draft.status,
        approvedAt: draft.approved_at,
        createdAt: draft.created_at,
        updatedAt: draft.updated_at
    };
};

/**
 * Updates an editable draft's enhancedContent and changesSummary
 */
export const updateEnhancementDraft = async ({ resumeId, userId, draftId, updatedContent, changesSummary }) => {
    const validated = updateDraftInputSchema.parse({
        enhancedContent: updatedContent,
        changesSummary
    });

    // Check draft exists and belongs to user
    const [rows] = await db.query(
        "SELECT * FROM resume_enhancement_drafts WHERE id = ? AND resume_id = ? AND user_id = ?",
        [draftId, resumeId, userId]
    );

    if (!rows || rows.length === 0) {
        throw new AnalysisWorkflowError("Draft not found or unauthorized", 404, "DRAFT_NOT_FOUND");
    }

    const draft = rows[0];
    if (draft.status !== "draft") {
        throw new AnalysisWorkflowError(`Cannot edit draft in status '${draft.status}'`, 400, "DRAFT_NOT_EDITABLE");
    }

    const originalContent = typeof draft.original_content === "string"
        ? JSON.parse(draft.original_content)
        : draft.original_content;

    const finalSummary = validated.changesSummary || draft.changes_summary || "Updated by candidate.";

    await db.query(
        "UPDATE resume_enhancement_drafts SET enhanced_content = ?, changes_summary = ? WHERE id = ?",
        [JSON.stringify(validated.enhancedContent), finalSummary, draftId]
    );

    const sectionsDiff = computeSectionsDiff(originalContent, validated.enhancedContent, draft.scope, draft.section_name);

    return {
        draftId: draft.id,
        resumeId: draft.resume_id,
        userId: draft.user_id,
        enhancementMode: draft.enhancement_mode,
        scope: draft.scope,
        sectionName: draft.section_name,
        originalContent,
        enhancedContent: validated.enhancedContent,
        sectionsDiff,
        changesSummary: finalSummary,
        status: "draft"
    };
};

/**
 * Approves draft and records a new version in resume_versions table
 */
export const approveEnhancementDraft = async ({ resumeId, userId, draftId }) => {
    const [draftRows] = await db.query(
        "SELECT * FROM resume_enhancement_drafts WHERE id = ? AND resume_id = ? AND user_id = ?",
        [draftId, resumeId, userId]
    );

    if (!draftRows || draftRows.length === 0) {
        throw new AnalysisWorkflowError("Draft not found or unauthorized", 404, "DRAFT_NOT_FOUND");
    }

    const draft = draftRows[0];
    if (draft.status !== "draft") {
        throw new AnalysisWorkflowError(`Draft is already in '${draft.status}' state`, 400, "DRAFT_ALREADY_FINALIZED");
    }

    // Determine next version number in resume_versions
    const [versionRows] = await db.query(
        "SELECT COALESCE(MAX(version_number), 0) AS max_ver FROM resume_versions WHERE resume_id = ?",
        [resumeId]
    );
    const nextVersionNumber = (versionRows?.[0]?.max_ver || 0) + 1;

    // Get original resume file_id if exists
    const [fileRows] = await db.query(
        "SELECT file_id FROM resume_files WHERE resume_id = ? ORDER BY file_id DESC LIMIT 1",
        [resumeId]
    );
    const fileId = fileRows?.[0]?.file_id || null;

    // Insert new version with version_type = 'improved'
    const versionNotes = `Approved enhanced resume (${draft.enhancement_mode} mode, scope: ${draft.scope})`;
    const [insertVer] = await db.query(
        `INSERT INTO resume_versions (resume_id, file_id, version_number, version_type, version_notes)
         VALUES (?, ?, ?, 'improved', ?)`,
        [resumeId, fileId, nextVersionNumber, versionNotes]
    );

    const versionId = insertVer.insertId;

    // Mark draft approved
    await db.query(
        "UPDATE resume_enhancement_drafts SET status = 'approved', version_id = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?",
        [versionId, draftId]
    );

    return {
        message: "Resume enhancement draft approved successfully",
        draftId: Number(draftId),
        versionId: Number(versionId),
        versionNumber: nextVersionNumber,
        status: "approved"
    };
};

/**
 * Discards draft without modifying versions or resumes
 */
export const discardEnhancementDraft = async ({ resumeId, userId, draftId }) => {
    const [draftRows] = await db.query(
        "SELECT * FROM resume_enhancement_drafts WHERE id = ? AND resume_id = ? AND user_id = ?",
        [draftId, resumeId, userId]
    );

    if (!draftRows || draftRows.length === 0) {
        throw new AnalysisWorkflowError("Draft not found or unauthorized", 404, "DRAFT_NOT_FOUND");
    }

    const draft = draftRows[0];
    if (draft.status !== "draft") {
        throw new AnalysisWorkflowError(`Draft is already in '${draft.status}' state`, 400, "DRAFT_ALREADY_FINALIZED");
    }

    await db.query(
        "UPDATE resume_enhancement_drafts SET status = 'discarded' WHERE id = ?",
        [draftId]
    );

    return {
        message: "Resume enhancement draft discarded",
        draftId: Number(draftId),
        status: "discarded"
    };
};

export default {
    runResumeEnhancementWorkflow,
    getLatestEnhancementDraft,
    updateEnhancementDraft,
    approveEnhancementDraft,
    discardEnhancementDraft,
    computeSectionsDiff
};
