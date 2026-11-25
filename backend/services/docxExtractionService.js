import fs from "fs";
import mammoth from "mammoth";
import { validateDocxDocument } from "./fileValidationService.js";

/**
 * Maximum buffer size permitted for in-memory DOCX parsing (10 MB)
 */
const MAX_DOCX_PROCESS_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Normalizes extracted DOCX text:
 * - Unifies carriage returns (\r\n -> \n)
 * - Normalizes excessive horizontal spaces and tabs while preserving spaces
 * - Preserves structural paragraph breaks (max 2 consecutive newlines)
 * - Trims whitespace from individual lines
 * 
 * @param {string} rawText 
 * @returns {string} Clean, normalized text
 */
export const normalizeDocxText = (rawText) => {
    if (!rawText || typeof rawText !== "string") return "";

    return rawText
        // Unify carriage returns and unicode line breaks
        .replace(/\r\n|\r|\u2028|\u2029/g, "\n")
        // Replace tabs and non-breaking spaces with standard space
        .replace(/[\t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
        // Collapse multiple horizontal spaces to single space
        .replace(/[ ]{2,}/g, " ")
        // Trim each line individually while preserving newlines
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        // Collapse 3 or more blank lines to max 2 newlines (preserve paragraphs without massive gaps)
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

/**
 * Extracts readable plain text and document metadata from a DOCX file buffer or path.
 * 
 * @param {Buffer|string} input - Validated Buffer or trusted absolute filesystem path
 * @returns {Promise<{
 *   extractedText: string,
 *   characterCount: number,
 *   wordCount: number,
 *   warnings: string[]
 * }>}
 */
export const extractTextFromDocx = async (input) => {
    let buffer;
    let filePath = null;

    // 1. Resolve and validate input
    if (Buffer.isBuffer(input)) {
        buffer = input;
    } else if (typeof input === "string") {
        filePath = input;
        try {
            const stats = await fs.promises.stat(filePath);
            if (!stats.isFile()) {
                const err = new Error("Invalid document storage reference");
                err.statusCode = 404;
                throw err;
            }
            if (stats.size > MAX_DOCX_PROCESS_SIZE_BYTES) {
                const err = new Error(`DOCX exceeds processing limit of ${MAX_DOCX_PROCESS_SIZE_BYTES / (1024 * 1024)} MB`);
                err.statusCode = 413;
                throw err;
            }
            buffer = await fs.promises.readFile(filePath);
        } catch (readErr) {
            if (readErr.statusCode) throw readErr;
            const err = new Error("Unable to read DOCX file from storage");
            err.statusCode = 404;
            throw err;
        }
    } else {
        const err = new Error("Invalid input: expected Buffer or file path");
        err.statusCode = 400;
        throw err;
    }

    // 2. Validate ZIP binary header (Magic numbers: PK\x03\x04 -> 0x50 0x4B 0x03 0x04)
    if (
        buffer.length < 4 ||
        buffer[0] !== 0x50 ||
        buffer[1] !== 0x4b ||
        buffer[2] !== 0x03 ||
        buffer[3] !== 0x04
    ) {
        const err = new Error("Invalid document format: Not a valid DOCX or ZIP archive");
        err.statusCode = 400;
        err.code = "INVALID_DOCX_FORMAT";
        throw err;
    }

    // 3. Enforce size limit on raw buffer
    if (buffer.length > MAX_DOCX_PROCESS_SIZE_BYTES) {
        const err = new Error(`DOCX exceeds processing limit of ${MAX_DOCX_PROCESS_SIZE_BYTES / (1024 * 1024)} MB`);
        err.statusCode = 413;
        throw err;
    }

    // 4. Archive inspection: if reading from disk, verify archive boundaries and required OpenXML files
    if (filePath) {
        try {
            await validateDocxDocument(filePath);
        } catch (archiveErr) {
            const err = new Error(archiveErr.message || "Invalid or corrupted DOCX archive structure");
            err.statusCode = archiveErr.statusCode || 400;
            err.code = archiveErr.code || "CORRUPTED_DOCX_ARCHIVE";
            throw err;
        }
    }

    // 5. Extract text via Mammoth.js
    let mammothResult;
    try {
        const extractFn = mammoth.extractRawText || mammoth.default?.extractRawText;
        mammothResult = await extractFn({ buffer });
    } catch (parseErr) {
        // Handle password protected or encrypted Word documents
        if (
            parseErr.message?.toLowerCase().includes("password") ||
            parseErr.message?.toLowerCase().includes("encrypt")
        ) {
            const err = new Error(
                "The DOCX document is password-protected or encrypted. Please remove the password and upload an unprotected document."
            );
            err.statusCode = 422;
            err.code = "DOCX_PASSWORD_PROTECTED";
            throw err;
        }

        // Handle missing document part
        if (
            parseErr.message?.toLowerCase().includes("could not find main document part") ||
            parseErr.message?.toLowerCase().includes("word/document.xml")
        ) {
            const err = new Error(
                "Invalid DOCX package: missing main document part ('word/document.xml')."
            );
            err.statusCode = 400;
            err.code = "MISSING_DOCX_DOCUMENT_XML";
            throw err;
        }

        // Handle corrupted or malformed ZIP archives
        if (
            parseErr.message?.toLowerCase().includes("zip") ||
            parseErr.message?.toLowerCase().includes("end of central directory") ||
            parseErr.message?.toLowerCase().includes("corrupted")
        ) {
            const err = new Error("The DOCX file is malformed, corrupted, or not a valid Word document.");
            err.statusCode = 400;
            err.code = "DOCX_CORRUPT";
            throw err;
        }

        // Generic parser failure
        const err = new Error(
            parseErr?.message && !parseErr.message.includes("node:") && !parseErr.message.includes("C:")
                ? `DOCX extraction failed: ${parseErr.message}`
                : "Failed to process DOCX document"
        );
        err.statusCode = 400;
        throw err;
    }

    // 6. Normalize raw text and collect safe warnings
    const rawText = mammothResult?.value || "";
    const normalizedText = normalizeDocxText(rawText);

    const safeWarnings = (mammothResult?.messages || [])
        .filter((m) => m && m.type === "warning" && typeof m.message === "string")
        .map((m) => m.message.replace(/[\\]/g, "/"));

    // 7. Validate that meaningful readable text exists (Detect image/scanned or empty DOCX without OCR)
    if (!normalizedText || normalizedText.length === 0) {
        const err = new Error(
            "No readable text could be extracted. The document may be empty or contain only images (OCR text recognition is not supported in this version)."
        );
        err.statusCode = 422;
        err.code = "NO_EXTRACTABLE_TEXT";
        throw err;
    }

    return {
        extractedText: normalizedText,
        characterCount: normalizedText.length,
        wordCount: normalizedText.split(/\s+/).filter(Boolean).length,
        warnings: safeWarnings
    };
};

export default {
    extractTextFromDocx,
    normalizeDocxText
};
