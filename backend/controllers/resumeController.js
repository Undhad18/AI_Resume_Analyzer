import fs from "fs";
import db from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    storeResumeFileAndMetadata,
    getResumeListForUser,
    getResumeFileForPreviewOrDownload,
    deleteResumeForUser,
    updateResumeExtractedText
} from "../services/resumeStorageService.js";
import { extractTextFromPdf } from "../services/pdfExtractionService.js";
import { extractTextFromDocx } from "../services/docxExtractionService.js";
import { structureResumeContent } from "../services/resumeStructuringService.js";
import { evaluateStructuredResumeWithAi } from "../services/openaiService.js";
import { runCompleteResumeAnalysis, getLatestAnalysisForResume } from "../services/resumeAnalysisService.js";

/**
 * Sanitizes original filename for HTTP Content-Disposition headers (prevent header injection)
 * @param {string} rawFilename
 * @returns {{ asciiName: string, encodedName: string }}
 */
const sanitizeDispositionFilename = (rawFilename = "resume.pdf") => {
    // Strip control characters, quotes, and newlines
    const sanitized = rawFilename.replace(/[\r\n"\\/]/g, "").trim() || "resume.pdf";
    const asciiName = sanitized.replace(/[^\x20-\x7E]/g, "_");
    const encodedName = encodeURIComponent(sanitized);
    return { asciiName, encodedName };
};

/**
 * Upload, validate, store in private disk storage, and record resume metadata in MySQL
 * POST /api/resumes/upload
 */
export const uploadResumeFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No resume file was uploaded. Please provide a file in the 'resume' field.",
            errors: null
        });
    }

    // Authenticated user ID strictly sourced from verified JWT session (never trusted from req.body)
    const userId = req.user.id;
    const candidateName = req.user.name || null;

    // Securely move file from staging to private storage and insert into MySQL
    const savedResume = await storeResumeFileAndMetadata({
        userId,
        candidateName,
        originalName: req.file.originalname,
        stagedPath: req.file.path,
        mimeType: req.validatedDocument?.mimeType || req.file.mimetype,
        fileSize: req.file.size,
        documentType:
            req.validatedDocument?.documentType ||
            (req.file.originalname.toLowerCase().endsWith(".docx") ? "docx" : "pdf"),
        pageCount: req.validatedDocument?.pageCount || undefined
    });

    return res.status(201).json({
        success: true,
        message: "Resume uploaded and saved successfully",
        data: {
            resume: {
                id: savedResume.id,
                resumeId: savedResume.id,
                originalFilename: savedResume.originalFilename,
                mimeType: savedResume.mimeType,
                fileSize: savedResume.fileSize,
                status: savedResume.status,
                createdAt: savedResume.createdAt
            },
            // Backward-compatible properties for existing UI and test suites
            id: savedResume.id,
            resumeId: savedResume.id,
            originalName: savedResume.originalFilename,
            originalFilename: savedResume.originalFilename,
            fileName: savedResume.storedFilename,
            storedFilename: savedResume.storedFilename,
            mimeType: savedResume.mimeType,
            fileSize: savedResume.fileSize,
            status: savedResume.status,
            documentType: savedResume.documentType,
            pageCount: savedResume.pageCount,
            uploadedAt: savedResume.createdAt,
            createdAt: savedResume.createdAt
        }
    });
});

/**
 * List paginated resumes belonging strictly to the authenticated user
 * GET /api/resumes
 */
export const getResumeList = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.query;

    const result = await getResumeListForUser({
        userId,
        page,
        limit
    });

    return res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * Preview resume document (streams PDF inline, provides clear download fallback for DOCX)
 * GET /api/resumes/:resumeId/preview
 */
export const previewResumeFile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.resumeId || req.params.id;

    const {
        filePath,
        originalFilename,
        mimeType,
        fileType,
        fileSize
    } = await getResumeFileForPreviewOrDownload({
        resumeId,
        userId
    });

    // DOCX files cannot be previewed natively in web browsers
    if (fileType === "docx") {
        return res.status(400).json({
            success: false,
            message: "DOCX files cannot be previewed natively in the browser. Please use the download option to view this document.",
            fallbackAction: "download",
            downloadUrl: `/api/resumes/${resumeId}/download`,
            fileType: "docx",
            originalFilename
        });
    }

    const { asciiName, encodedName } = sanitizeDispositionFilename(originalFilename);

    // Common security & caching headers
    res.setHeader("Content-Type", mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
    res.setHeader("Accept-Ranges", "bytes");

    // Handle HTTP Range Requests (e.g. for streaming large PDFs in browser viewers)
    const rangeHeader = req.headers.range;
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
            res.setHeader("Content-Range", `bytes */${fileSize}`);
            return res.status(416).send("Requested Range Not Satisfiable");
        }

        const chunkLength = end - start + 1;
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Content-Length", chunkLength);

        const fileStream = fs.createReadStream(filePath, { start, end });
        fileStream.on("error", (err) => {
            console.error("Stream range error:", err.message);
            if (!res.headersSent) res.status(500).end();
        });
        return fileStream.pipe(res);
    }

    // Standard inline stream
    res.status(200);
    res.setHeader("Content-Length", fileSize);
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
        console.error("Stream preview error:", err.message);
        if (!res.headersSent) res.status(500).end();
    });
    return fileStream.pipe(res);
});

/**
 * Download resume document as attachment
 * GET /api/resumes/:resumeId/download
 */
export const downloadResumeFile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.resumeId || req.params.id;

    const {
        filePath,
        originalFilename,
        mimeType,
        fileSize
    } = await getResumeFileForPreviewOrDownload({
        resumeId,
        userId
    });

    const { asciiName, encodedName } = sanitizeDispositionFilename(originalFilename);

    res.status(200);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", fileSize);
    res.setHeader("Content-Disposition", `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
        console.error("Stream download error:", err.message);
        if (!res.headersSent) res.status(500).end();
    });
    return fileStream.pipe(res);
});

/**
 * Soft delete resume document and quarantine physical file
 * DELETE /api/resumes/:resumeId
 */
export const deleteResumeFile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.resumeId || req.params.id;

    const result = await deleteResumeForUser({
        resumeId,
        userId
    });

    return res.status(200).json(result);
});

/**
 * Extract readable text from an authenticated user's uploaded PDF resume
 * POST /api/resumes/:resumeId/extract-text
 */
export const extractResumeText = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.resumeId || req.params.id;

    // 1. Resolve storage file strictly verifying ownership and existence
    const fileInfo = await getResumeFileForPreviewOrDownload({ resumeId, userId });

    // 2. Enforce PDF document requirement (DOCX not processed by this endpoint)
    const isDocx =
        fileInfo.fileType === "docx" ||
        fileInfo.originalFilename?.toLowerCase().endsWith(".docx") ||
        fileInfo.mimeType?.includes("wordprocessingml");

    if (isDocx) {
        return res.status(400).json({
            success: false,
            message: "Text extraction for DOCX resumes is not supported by this PDF extraction endpoint.",
            data: {
                resumeId: fileInfo.resumeId,
                fileType: fileInfo.mimeType
            }
        });
    }

    // 3. Extract text and metadata via PDF extraction service
    const extractionResult = await extractTextFromPdf(fileInfo.filePath);

    // 4. Update extracted_text in MySQL database
    await updateResumeExtractedText({
        resumeId: fileInfo.resumeId,
        userId,
        extractedText: extractionResult.extractedText
    });

    // 5. Set private cache-control headers
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    // 6. Return response matching requested schema
    return res.status(200).json({
        success: true,
        message: "PDF text extracted successfully",
        data: {
            resumeId: fileInfo.resumeId,
            fileType: "application/pdf",
            extractedText: extractionResult.extractedText,
            characterCount: extractionResult.characterCount,
            wordCount: extractionResult.wordCount,
            pageCount: extractionResult.pageCount,
            pages: extractionResult.pages
        }
    });
});

/**
 * Extract readable text from an authenticated user's uploaded DOCX resume
 * POST /api/resumes/:resumeId/extract-docx-text
 */
export const extractDocxResumeText = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.resumeId || req.params.id;

    // 1. Resolve storage file strictly verifying ownership and existence
    const fileInfo = await getResumeFileForPreviewOrDownload({ resumeId, userId });

    // 2. Enforce DOCX document requirement (PDF not processed by this endpoint)
    const isDocx =
        fileInfo.fileType === "docx" ||
        fileInfo.originalFilename?.toLowerCase().endsWith(".docx") ||
        fileInfo.mimeType?.includes("wordprocessingml");

    if (!isDocx) {
        return res.status(400).json({
            success: false,
            message: "DOCX text extraction requires a DOCX document. Provided resume is a PDF file.",
            data: {
                resumeId: fileInfo.resumeId,
                fileType: fileInfo.mimeType
            }
        });
    }

    // 3. Extract text and metadata via DOCX extraction service
    const extractionResult = await extractTextFromDocx(fileInfo.filePath);

    // 4. Update extracted_text in MySQL database
    await updateResumeExtractedText({
        resumeId: fileInfo.resumeId,
        userId,
        extractedText: extractionResult.extractedText
    });

    // 5. Set private cache-control headers
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    // 6. Return response matching requested schema
    return res.status(200).json({
        success: true,
        message: "DOCX text extracted successfully",
        data: {
            resumeId: fileInfo.resumeId,
            fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            extractedText: extractionResult.extractedText,
            characterCount: extractionResult.characterCount,
            wordCount: extractionResult.wordCount,
            warnings: extractionResult.warnings || []
        }
    });
});

/**
 * Convert extracted PDF or DOCX resume text into consistent structured JSON format
 * POST /api/resumes/:resumeId/structure
 */
export const structureResumeFile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.resumeId || req.params.id;

    // 1. Resolve storage file strictly verifying ownership and existence
    const fileInfo = await getResumeFileForPreviewOrDownload({ resumeId, userId });

    const isDocx =
        fileInfo.fileType === "docx" ||
        fileInfo.originalFilename?.toLowerCase().endsWith(".docx") ||
        fileInfo.mimeType?.includes("wordprocessingml");

    const sourceType = isDocx ? "docx" : "pdf";

    // 2. Extract plain text using appropriate engine (PDF or DOCX)
    let rawText = "";
    if (isDocx) {
        const extraction = await extractTextFromDocx(fileInfo.filePath);
        rawText = extraction.extractedText;
    } else {
        const extraction = await extractTextFromPdf(fileInfo.filePath);
        rawText = extraction.extractedText;
    }

    // 3. Update extracted_text in MySQL database if not yet set
    await updateResumeExtractedText({
        resumeId: fileInfo.resumeId,
        userId,
        extractedText: rawText
    });

    // 4. Structure content deterministically and validate through Zod schema
    const structuredResume = structureResumeContent(rawText, {
        sourceType,
        resumeId: fileInfo.resumeId
    });

    // 5. If personalInfo.fullName was extracted and candidate_name in DB is null, update it
    if (structuredResume.personalInfo?.fullName) {
        try {
            await db.execute(
                `UPDATE resumes 
                 SET candidate_name = ?, updated_at = NOW() 
                 WHERE resume_id = ? AND user_id = ? AND (candidate_name IS NULL OR candidate_name = '')`,
                [structuredResume.personalInfo.fullName, fileInfo.resumeId, userId]
            );
        } catch {
            // Non-critical, ignore
        }
    }

    // 6. Set private cache-control headers
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    // 7. Return structured response matching requested schema
    return res.status(200).json({
        success: true,
        message: "Resume content structured successfully",
        data: {
            resumeId: fileInfo.resumeId,
            sourceType,
            structuredResume
        }
    });
});

/**
 * Perform AI-powered resume evaluation using OpenAI Responses API
 * POST /api/resumes/:resumeId/ai-evaluate
 */
export const evaluateResumeWithAi = asyncHandler(async (req, res) => {
    const { resumeId } = req.params;
    const userId = req.user.id;

    // 1. Verify resource ownership and access rights (IDOR mitigation)
    const fileInfo = await getResumeFileForPreviewOrDownload({
        resumeId,
        userId
    });

    // 2. Extract or read resume text
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

    if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "Cannot evaluate resume: no readable text found in document.",
            errors: null
        });
    }

    // 3. Structure resume content deterministically
    const structuredResume = structureResumeContent(rawText, {
        sourceType,
        resumeId: fileInfo.resumeId
    });

    // 4. Send to OpenAI Responses API for structured evaluation
    const aiResult = await evaluateStructuredResumeWithAi(structuredResume);

    // 5. Prevent caching of sensitive AI evaluation results
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    return res.status(200).json({
        success: true,
        message: "AI resume evaluation completed successfully",
        data: {
            resumeId: fileInfo.resumeId,
            evaluation: aiResult.evaluation,
            metadata: aiResult.metadata
        }
    });
});

/**
 * Execute complete AI resume analysis engine (Lesson 5.5)
 * POST /api/resumes/:resumeId/analyze
 */
export const analyzeResume = asyncHandler(async (req, res) => {
    const { resumeId } = req.params;
    const userId = req.user.id;

    const result = await runCompleteResumeAnalysis({
        resumeId,
        userId
    });

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    return res.status(200).json({
        success: true,
        message: "Resume analysis completed successfully",
        data: result
    });
});

/**
 * Fetch latest completed or active analysis for resume
 * GET /api/resumes/:resumeId/analysis
 */
export const getResumeAnalysis = asyncHandler(async (req, res) => {
    const { resumeId } = req.params;
    const userId = req.user.id;

    const record = await getLatestAnalysisForResume({
        resumeId,
        userId
    });

    if (!record) {
        return res.status(404).json({
            success: false,
            message: "No analysis found for this resume",
            errors: null
        });
    }

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.status(200).json({
        success: true,
        data: record
    });
});

export default {
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
};
