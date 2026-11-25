import fs from "fs";
import { PDFParse, PasswordException, InvalidPDFException, FormatError } from "pdf-parse";

/**
 * Maximum buffer size permitted for in-memory PDF parsing (10 MB)
 */
const MAX_PDF_PROCESS_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Normalizes extracted text:
 * - Unifies line endings (\r\n -> \n)
 * - Collapses excessive horizontal whitespace (tabs, NBSP, consecutive spaces)
 * - Preserves structural line breaks and paragraph spacing (max 2 consecutive newlines)
 * - Trims whitespace from individual lines
 * 
 * @param {string} rawText 
 * @returns {string} Clean, normalized text
 */
export const normalizePdfText = (rawText) => {
    if (!rawText || typeof rawText !== "string") return "";

    return rawText
        // Unify carriage returns and unicode line separators
        .replace(/\r\n|\r|\u2028|\u2029/g, "\n")
        // Replace non-breaking spaces and other unusual space characters with standard ASCII space
        .replace(/[\t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
        // Collapse multiple horizontal spaces to single space
        .replace(/[ ]{2,}/g, " ")
        // Process line by line: trim trailing and leading spaces from each line
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        // Collapse 3 or more blank lines to max 2 newlines (preserve paragraphs without huge gaps)
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

/**
 * Extracts readable plain text and document metadata from a PDF file buffer or path.
 * 
 * @param {Buffer|string} input - Validated Buffer or trusted absolute filesystem path
 * @returns {Promise<{
 *   extractedText: string,
 *   characterCount: number,
 *   wordCount: number,
 *   pageCount: number,
 *   pages: Array<{ pageNumber: number, characterCount: number }>
 * }>}
 */
export const extractTextFromPdf = async (input) => {
    let buffer;

    // 1. Resolve and validate input
    if (Buffer.isBuffer(input)) {
        buffer = input;
    } else if (typeof input === "string") {
        try {
            const stats = await fs.promises.stat(input);
            if (!stats.isFile()) {
                const err = new Error("Invalid document storage reference");
                err.statusCode = 404;
                throw err;
            }
            if (stats.size > MAX_PDF_PROCESS_SIZE_BYTES) {
                const err = new Error(`PDF exceeds processing limit of ${MAX_PDF_PROCESS_SIZE_BYTES / (1024 * 1024)} MB`);
                err.statusCode = 413;
                throw err;
            }
            buffer = await fs.promises.readFile(input);
        } catch (readErr) {
            if (readErr.statusCode) throw readErr;
            const err = new Error("Unable to read PDF file from storage");
            err.statusCode = 404;
            throw err;
        }
    } else {
        const err = new Error("Invalid input: expected Buffer or file path");
        err.statusCode = 400;
        throw err;
    }

    // 2. Validate PDF binary header (Magic numbers: %PDF-)
    if (buffer.length < 5 || buffer.toString("utf-8", 0, 5) !== "%PDF-") {
        const err = new Error("Invalid document format: Not a valid PDF file");
        err.statusCode = 400;
        throw err;
    }

    // 3. Enforce size limit on raw buffer
    if (buffer.length > MAX_PDF_PROCESS_SIZE_BYTES) {
        const err = new Error(`PDF exceeds processing limit of ${MAX_PDF_PROCESS_SIZE_BYTES / (1024 * 1024)} MB`);
        err.statusCode = 413;
        throw err;
    }

    // 4. Instantiate parser and parse text
    let parser;
    let textResult;

    try {
        parser = new PDFParse({ data: buffer });
        textResult = await parser.getText();
    } catch (parseErr) {
        // Handle password protected PDFs
        if (
            parseErr instanceof PasswordException ||
            parseErr.name === "PasswordException" ||
            parseErr.message?.toLowerCase().includes("password") ||
            parseErr.message?.toLowerCase().includes("encrypt")
        ) {
            const err = new Error(
                "The PDF document is password-protected or encrypted. Please remove the password and upload an unprotected PDF."
            );
            err.statusCode = 422;
            err.code = "PDF_PASSWORD_PROTECTED";
            throw err;
        }

        // Handle corrupt / malformed PDFs
        if (
            parseErr instanceof InvalidPDFException ||
            parseErr instanceof FormatError ||
            parseErr.name === "InvalidPDFException" ||
            parseErr.name === "FormatError" ||
            parseErr.message?.toLowerCase().includes("invalid pdf") ||
            parseErr.message?.toLowerCase().includes("corrupted")
        ) {
            const err = new Error("The PDF file is malformed or corrupted and cannot be read.");
            err.statusCode = 400;
            err.code = "PDF_CORRUPT";
            throw err;
        }

        // Generic parser failure
        const err = new Error(
            parseErr?.message && !parseErr.message.includes("node:")
                ? `PDF parsing failed: ${parseErr.message}`
                : "Failed to process PDF document"
        );
        err.statusCode = 400;
        throw err;
    } finally {
        if (parser && typeof parser.destroy === "function") {
            try {
                await parser.destroy();
            } catch (destroyErr) {
                // Silently ignore cleanup errors
            }
        }
    }

    // 5. Extract and normalize per-page text
    const rawPages = textResult?.pages || [];
    const pageDetails = [];
    const normalizedPageTexts = [];

    for (let i = 0; i < rawPages.length; i++) {
        const page = rawPages[i];
        const pageNum = page.num || i + 1;
        const normalized = normalizePdfText(page.text || "");
        normalizedPageTexts.push(normalized);
        pageDetails.push({
            pageNumber: pageNum,
            characterCount: normalized.length
        });
    }

    // Combine page texts preserving page separation
    const combinedText = normalizedPageTexts
        .filter((t) => t.length > 0)
        .join("\n\n")
        .trim();

    // 6. Validate that meaningful readable text exists (Detect image/scanned PDF without OCR)
    if (!combinedText || combinedText.length === 0) {
        const err = new Error(
            "No readable text could be extracted. The document may be an image-based or scanned PDF (OCR text recognition is not supported in this version)."
        );
        err.statusCode = 422;
        err.code = "NO_EXTRACTABLE_TEXT";
        throw err;
    }

    const totalPages = textResult?.total || (pageDetails.length > 0 ? pageDetails.length : 1);

    return {
        extractedText: combinedText,
        characterCount: combinedText.length,
        wordCount: combinedText.split(/\s+/).filter(Boolean).length,
        pageCount: totalPages,
        pages: pageDetails
    };
};
