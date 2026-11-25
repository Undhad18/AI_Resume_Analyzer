import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private directories for upload lifecycle (outside public static directories)
export const STAGING_DIR = path.resolve(__dirname, "../uploads/staging");
export const STORAGE_DIR = path.resolve(__dirname, "../uploads/resumes");
export const QUARANTINE_DIR = path.resolve(__dirname, "../uploads/quarantine");

// Ensure directories exist safely
if (!fs.existsSync(STAGING_DIR)) {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
}
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(QUARANTINE_DIR)) {
    fs.mkdirSync(QUARANTINE_DIR, { recursive: true });
}

// Backward compatibility alias for existing tests and services
export const UPLOAD_DIR = STORAGE_DIR;

// 5 MB maximum file size limit
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Allowlisted extensions and MIME types
export const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword"
];

/**
 * Disk storage configuration staging incoming uploads with temporary unique filenames
 */
export const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, STAGING_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // Prevent path traversal and normalize extension
        const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ".bin";
        const uniqueId = crypto.randomBytes(16).toString("hex");
        const uniqueFilename = `stage-${Date.now()}-${uniqueId}${safeExt}`;
        cb(null, uniqueFilename);
    }
});

/**
 * Basic file filtering by extension and MIME type
 */
export const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());

    if (!isExtensionAllowed || !isMimeAllowed) {
        const error = new Error("Only PDF and DOCX files are supported");
        error.code = "UNSUPPORTED_FILE_TYPE";
        error.statusCode = 400;
        return cb(error, false);
    }

    cb(null, true);
};

export const uploadConfig = {
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1
    },
    fileFilter
};
