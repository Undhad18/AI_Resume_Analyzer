import fs from "fs";
import path from "path";
import { STAGING_DIR, STORAGE_DIR, UPLOAD_DIR } from "../config/multerConfig.js";
import {
    validateResumeDocument,
    FileValidationError
} from "../services/fileValidationService.js";

/**
 * Safely removes a staged file from disk, ensuring path is inside STAGING_DIR or STORAGE_DIR
 * @param {string} filePath
 */
const safeCleanupStagedFile = async (filePath) => {
    if (!filePath || typeof filePath !== "string") return;

    try {
        const resolvedPath = path.resolve(filePath);
        const resolvedStagingDir = path.resolve(STAGING_DIR);
        const resolvedStorageDir = path.resolve(STORAGE_DIR);
        const resolvedUploadDir = path.resolve(UPLOAD_DIR);

        // Security check: ensure path is strictly within the private upload or staging directory
        const isSafePath =
            resolvedPath.startsWith(resolvedStagingDir) ||
            resolvedPath.startsWith(resolvedStorageDir) ||
            resolvedPath.startsWith(resolvedUploadDir);

        if (isSafePath && fs.existsSync(resolvedPath)) {
            await fs.promises.unlink(resolvedPath);
        }
    } catch (cleanupErr) {
        // Log silently without throwing so we don't mask the primary validation error
        console.error("Warning: Staged file cleanup encountered an error:", cleanupErr.message);
    }
};

/**
 * Express middleware to perform deep document validation on uploaded resume files
 */
export const validateResumeFile = async (req, res, next) => {
    // 1. Ensure file was uploaded by Multer
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No resume file was uploaded. Please provide a file in the 'resume' field.",
            errors: null
        });
    }

    try {
        // 2. Perform deep validation (signature, structure, parser, ZIP safety)
        const validationResult = await validateResumeDocument({
            filePath: req.file.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });

        // 3. Attach validated document details to request for downstream handlers
        req.validatedDocument = validationResult;
        return next();
    } catch (error) {
        // 4. Clean up the invalid staged file immediately
        await safeCleanupStagedFile(req.file.path);

        const statusCode = error.statusCode || 400;
        const message = error.message || "File validation failed";
        const code = error.code || "FILE_VALIDATION_ERROR";

        return res.status(statusCode).json({
            success: false,
            message,
            errors: [
                {
                    code,
                    message
                }
            ]
        });
    }
};

export default validateResumeFile;
