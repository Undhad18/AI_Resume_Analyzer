import multer from "multer";
import fs from "fs";
import { uploadConfig } from "../config/multerConfig.js";

const multerInstance = multer(uploadConfig).single("resume");

/**
 * Middleware handling single resume file upload with explicit error mapping
 */
export const uploadResumeMiddleware = (req, res, next) => {
    multerInstance(req, res, (err) => {
        if (err) {
            // Cleanup any partially uploaded file if present
            if (req.file?.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch {
                    // Ignore unlink error
                }
            }

            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({
                        success: false,
                        message: "File size exceeds the 5 MB limit",
                        errors: null
                    });
                }

                if (err.code === "LIMIT_UNEXPECTED_FILE") {
                    return res.status(400).json({
                        success: false,
                        message: "Unexpected field: expected 'resume'",
                        errors: null
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: err.message,
                    errors: null
                });
            }

            if (err.code === "UNSUPPORTED_FILE_TYPE") {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    errors: null
                });
            }

            return res.status(err.statusCode || 400).json({
                success: false,
                message: err.message || "File upload failed",
                errors: null
            });
        }

        next();
    });
};
