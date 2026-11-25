/**
 * Resume File Validation Utility
 * Client-side validation for PDF and DOCX resume uploads.
 * 
 * Note: Frontend validation provides responsive user feedback.
 * Full security validation is enforced on the backend during processing.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes (5,242,880 bytes)
export const MAX_FILE_SIZE_MB = 5;

export const SUPPORTED_EXTENSIONS = ["pdf", "docx"];

export const SUPPORTED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

/**
 * Format bytes into readable string (e.g. "2.4 MB" or "450 KB")
 * @param {number} bytes 
 * @returns {string} Formatted string
 */
export const formatFileSize = (bytes) => {
    if (!bytes || typeof bytes !== "number" || bytes <= 0) {
        return "0 KB";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const kb = bytes / 1024;
    if (kb < 1024) {
        return `${Math.round(kb * 10) / 10} KB`;
    }

    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
};

/**
 * Extract lowercased file extension without leading dot
 * @param {string} fileName 
 * @returns {string}
 */
export const getFileExtension = (fileName) => {
    if (!fileName || typeof fileName !== "string") {
        return "";
    }
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

/**
 * Validate a selected resume file
 * @param {File|null} file - The candidate File object
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateResumeFile = (file) => {
    if (!file) {
        return {
            isValid: false,
            error: "Please select a resume file."
        };
    }

    // Check for empty file
    if (file.size === 0) {
        return {
            isValid: false,
            error: "The selected file is empty."
        };
    }

    // Check file size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
            isValid: false,
            error: `File size must not exceed ${MAX_FILE_SIZE_MB} MB.`
        };
    }

    // Check extension
    const extension = getFileExtension(file.name);
    const isExtensionSupported = SUPPORTED_EXTENSIONS.includes(extension);

    // Check MIME type if populated by the browser
    const isMimeSupported = !file.type || SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase());

    if (!isExtensionSupported || !isMimeSupported) {
        return {
            isValid: false,
            error: "Only PDF and DOCX files are supported."
        };
    }

    return {
        isValid: true,
        error: null
    };
};

export default {
    validateResumeFile,
    formatFileSize,
    getFileExtension,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    SUPPORTED_EXTENSIONS,
    SUPPORTED_MIME_TYPES
};
