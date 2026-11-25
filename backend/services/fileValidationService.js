import fs from "fs";
import path from "path";
import { fileTypeFromFile } from "file-type";
import yauzl from "yauzl";
import { PDFParse } from "pdf-parse";

/**
 * Custom error class for file validation failures
 */
export class FileValidationError extends Error {
    constructor(message, statusCode = 400, code = "FILE_VALIDATION_FAILED") {
        super(message);
        this.name = "FileValidationError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

// Security & resource constants
export const MAX_ZIP_ENTRIES = 500;
export const MAX_TOTAL_UNCOMPRESSED_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_COMPRESSION_RATIO = 100;
export const MIN_COMPRESSED_SIZE_FOR_RATIO_CHECK = 1024; // 1 KB

export const PDF_MAGIC_BYTES = Buffer.from("%PDF-", "utf8");
export const ZIP_MAGIC_BYTES = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
export const OLE2_MAGIC_BYTES = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);

export const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
export const ALLOWED_MIME_TYPES = {
    ".pdf": ["application/pdf"],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword" // Tolerated from some legacy client OS MIME headers if binary matches DOCX
    ]
};

/**
 * Safely read first N bytes of a file without reading entire file into memory
 * @param {string} filePath
 * @param {number} bytesToRead
 * @returns {Promise<Buffer>}
 */
export const readHeaderBytes = async (filePath, bytesToRead = 16) => {
    let fileHandle;
    try {
        fileHandle = await fs.promises.open(filePath, "r");
        const buffer = Buffer.alloc(bytesToRead);
        const { bytesRead } = await fileHandle.read(buffer, 0, bytesToRead, 0);
        return buffer.subarray(0, bytesRead);
    } finally {
        if (fileHandle) {
            await fileHandle.close();
        }
    }
};

/**
 * Validates file extension against allowlist
 * @param {string} originalName
 * @returns {string} Normalized extension
 */
export const validateExtension = (originalName) => {
    if (!originalName || typeof originalName !== "string") {
        throw new FileValidationError("Original filename is required", 400, "MISSING_FILENAME");
    }

    const ext = path.extname(originalName).toLowerCase();
    if (!ext) {
        throw new FileValidationError(
            "File has no extension. Allowed extensions are .pdf and .docx",
            400,
            "INVALID_EXTENSION"
        );
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new FileValidationError(
            `Unsupported file extension '${ext}'. Only .pdf and .docx files are permitted.`,
            400,
            "UNSUPPORTED_EXTENSION"
        );
    }

    return ext;
};

/**
 * Validates declared MIME type against expected types for the extension
 * @param {string} declaredMime
 * @param {string} ext
 */
export const validateDeclaredMimeType = (declaredMime, ext) => {
    if (!declaredMime || typeof declaredMime !== "string") {
        throw new FileValidationError("Declared MIME type is missing", 400, "MISSING_MIME_TYPE");
    }

    const normalizedMime = declaredMime.toLowerCase().trim();
    const allowed = ALLOWED_MIME_TYPES[ext] || [];

    if (!allowed.includes(normalizedMime)) {
        throw new FileValidationError(
            `Declared MIME type '${declaredMime}' does not match expected MIME type for extension '${ext}'`,
            400,
            "MIME_TYPE_MISMATCH"
        );
    }
};

/**
 * Deep inspection and validation of PDF document structure
 * @param {string} filePath
 * @returns {Promise<object>}
 */
export const validatePdfDocument = async (filePath) => {
    // 1. Verify %PDF- magic bytes signature
    const header = await readHeaderBytes(filePath, 5);
    if (!header.equals(PDF_MAGIC_BYTES)) {
        throw new FileValidationError(
            "Invalid PDF header signature. The file is not a valid PDF document.",
            400,
            "INVALID_PDF_SIGNATURE"
        );
    }

    // 2. Read full file buffer for structure parsing
    const fileBuffer = await fs.promises.readFile(filePath);
    if (fileBuffer.length === 0) {
        throw new FileValidationError(
            "The uploaded PDF file is empty (0 bytes).",
            400,
            "EMPTY_DOCUMENT"
        );
    }

    // 3. Parse with pdf-parse parser
    let parser;
    try {
        parser = new PDFParse({ data: fileBuffer });
        const doc = await parser.load();

        if (!doc || doc.numPages <= 0) {
            throw new FileValidationError(
                "The PDF document contains no readable pages.",
                400,
                "EMPTY_PDF_PAGES"
            );
        }

        return {
            documentType: "pdf",
            mimeType: "application/pdf",
            pageCount: doc.numPages
        };
    } catch (err) {
        if (err instanceof FileValidationError) throw err;

        const errName = err.name || "";
        const errMsg = (err.message || "").toLowerCase();

        if (
            errName === "PasswordException" ||
            errMsg.includes("password") ||
            errMsg.includes("encrypted") ||
            errMsg.includes("security handler")
        ) {
            throw new FileValidationError(
                "Password-protected and encrypted PDF files are not supported. Please remove the password and try again.",
                400,
                "ENCRYPTED_PDF_REJECTED"
            );
        }

        if (
            errName === "InvalidPDFException" ||
            errName === "FormatError" ||
            errMsg.includes("corrupt") ||
            errMsg.includes("invalid pdf structure") ||
            errMsg.includes("trailer not found") ||
            errMsg.includes("xref")
        ) {
            throw new FileValidationError(
                "Corrupted or invalid PDF document structure.",
                400,
                "CORRUPTED_PDF"
            );
        }

        throw new FileValidationError(
            `Unable to parse PDF document: ${err.message || "Invalid structure"}`,
            400,
            "PDF_PARSER_ERROR"
        );
    } finally {
        if (parser) {
            try {
                await parser.destroy();
            } catch {
                // Ignore cleanup error
            }
        }
    }
};

/**
 * Deep inspection of DOCX (OpenXML ZIP package) structure using yauzl streaming
 * @param {string} filePath
 * @returns {Promise<object>}
 */
export const validateDocxDocument = async (filePath) => {
    // 1. Check for legacy .doc (OLE2 Compound File Binary Format) header
    const header8 = await readHeaderBytes(filePath, 8);
    if (header8.length >= 8 && header8.subarray(0, 8).equals(OLE2_MAGIC_BYTES)) {
        throw new FileValidationError(
            "Legacy .doc (Word 97-2003) binary files are not supported. Please save or convert your resume to modern .docx format.",
            400,
            "LEGACY_DOC_REJECTED"
        );
    }

    // 2. Check for standard ZIP signature PK\x03\x04
    if (header8.length < 4 || !header8.subarray(0, 4).equals(ZIP_MAGIC_BYTES)) {
        throw new FileValidationError(
            "Invalid DOCX signature. The file does not start with a valid OpenXML ZIP header.",
            400,
            "INVALID_DOCX_SIGNATURE"
        );
    }

    // 3. Streaming ZIP inspection using yauzl
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
            if (err) {
                return reject(
                    new FileValidationError(
                        `Invalid or corrupted DOCX archive: ${err.message}`,
                        400,
                        "CORRUPTED_DOCX_ARCHIVE"
                    )
                );
            }

            let entryCount = 0;
            let totalUncompressedSize = 0;
            let hasContentTypes = false;
            let hasDocumentXml = false;
            let isTerminated = false;

            const terminate = (validationError) => {
                if (isTerminated) return;
                isTerminated = true;
                try {
                    zipfile.close();
                } catch {
                    // Ignore close errors
                }
                reject(validationError);
            };

            zipfile.readEntry();

            zipfile.on("entry", (entry) => {
                if (isTerminated) return;

                entryCount++;
                if (entryCount > MAX_ZIP_ENTRIES) {
                    return terminate(
                        new FileValidationError(
                            `DOCX archive exceeds maximum entry limit (${MAX_ZIP_ENTRIES}). Possible ZIP bomb detected.`,
                            400,
                            "ZIP_BOMB_LIMIT_EXCEEDED"
                        )
                    );
                }

                const entryName = entry.fileName;

                // Path safety & directory traversal protection
                if (
                    entryName.includes("..") ||
                    entryName.startsWith("/") ||
                    entryName.startsWith("\\") ||
                    /^[a-zA-Z]:/.test(entryName) ||
                    entryName.includes("\0")
                ) {
                    return terminate(
                        new FileValidationError(
                            "Dangerous or malformed entry path detected in DOCX archive.",
                            400,
                            "UNSAFE_ARCHIVE_ENTRY"
                        )
                    );
                }

                // Total uncompressed size limit
                totalUncompressedSize += entry.uncompressedSize;
                if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_BYTES) {
                    return terminate(
                        new FileValidationError(
                            `DOCX archive exceeds maximum uncompressed size limit (${MAX_TOTAL_UNCOMPRESSED_BYTES / (1024 * 1024)} MB). Possible ZIP bomb detected.`,
                            400,
                            "ZIP_BOMB_LIMIT_EXCEEDED"
                        )
                    );
                }

                // Compression ratio limit
                if (
                    entry.compressedSize > 0 &&
                    entry.uncompressedSize > MIN_COMPRESSED_SIZE_FOR_RATIO_CHECK &&
                    (entry.uncompressedSize / entry.compressedSize) > MAX_COMPRESSION_RATIO
                ) {
                    return terminate(
                        new FileValidationError(
                            "Suspicious archive compression ratio detected. Possible ZIP bomb detected.",
                            400,
                            "ZIP_BOMB_LIMIT_EXCEEDED"
                        )
                    );
                }

                // Check for required OpenXML package entries
                if (entryName === "[Content_Types].xml") {
                    hasContentTypes = true;
                }
                if (entryName === "word/document.xml") {
                    hasDocumentXml = true;
                }

                zipfile.readEntry();
            });

            zipfile.on("end", () => {
                if (isTerminated) return;

                if (!hasContentTypes) {
                    return reject(
                        new FileValidationError(
                            "Invalid DOCX document package: missing '[Content_Types].xml'.",
                            400,
                            "MISSING_DOCX_CONTENT_TYPES"
                        )
                    );
                }

                if (!hasDocumentXml) {
                    return reject(
                        new FileValidationError(
                            "Invalid DOCX document package: missing 'word/document.xml'.",
                            400,
                            "MISSING_DOCX_DOCUMENT_XML"
                        )
                    );
                }

                resolve({
                    documentType: "docx",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    entryCount,
                    totalUncompressedSize
                });
            });

            zipfile.on("error", (zipErr) => {
                const errMsg = zipErr.message || "";
                const isPathError = errMsg.includes("relative path") || errMsg.includes("..");
                terminate(
                    new FileValidationError(
                        isPathError
                            ? `Dangerous or malformed entry path detected in DOCX archive: ${errMsg}`
                            : `Corrupted DOCX archive structure: ${errMsg}`,
                        400,
                        isPathError ? "UNSAFE_ARCHIVE_ENTRY" : "CORRUPTED_DOCX_ARCHIVE"
                    )
                );
            });
        });
    });
};

/**
 * Master validation pipeline for staged resume documents
 * @param {object} fileParams
 * @param {string} fileParams.filePath
 * @param {string} fileParams.originalName
 * @param {string} fileParams.mimeType
 * @param {number} fileParams.size
 * @returns {Promise<object>}
 */
export const validateResumeDocument = async ({ filePath, originalName, mimeType, size }) => {
    // 1. Basic file existence and size check
    if (!filePath || !fs.existsSync(filePath)) {
        throw new FileValidationError("Staged file not found on server", 400, "FILE_NOT_FOUND");
    }

    if (!size || size <= 0) {
        throw new FileValidationError("The uploaded file is empty (0 bytes).", 400, "EMPTY_DOCUMENT");
    }

    // 2. Normalize and validate file extension
    const ext = validateExtension(originalName);

    // 3. Validate declared MIME type against extension
    validateDeclaredMimeType(mimeType, ext);

    // 4. Binary file type detection (detect disguised images, executables, etc.)
    const detected = await fileTypeFromFile(filePath);
    if (detected) {
        if (ext === ".pdf" && detected.ext !== "pdf") {
            throw new FileValidationError(
                `File content does not match the .pdf extension. Detected binary type: ${detected.ext} (${detected.mime}).`,
                400,
                "FILE_TYPE_MISMATCH"
            );
        }

        // For .docx, fileType typically detects 'docx' or generic 'zip'
        if (ext === ".docx" && detected.ext !== "docx" && detected.ext !== "zip") {
            throw new FileValidationError(
                `File content does not match the .docx extension. Detected binary type: ${detected.ext} (${detected.mime}).`,
                400,
                "FILE_TYPE_MISMATCH"
            );
        }
    }

    // 5. Deep document structure validation based on extension
    let documentDetails;
    if (ext === ".pdf") {
        documentDetails = await validatePdfDocument(filePath);
    } else if (ext === ".docx") {
        documentDetails = await validateDocxDocument(filePath);
    } else {
        throw new FileValidationError(`Unsupported file extension: ${ext}`, 400, "UNSUPPORTED_EXTENSION");
    }

    return {
        isValid: true,
        originalName,
        extension: ext,
        fileSize: size,
        ...documentDetails
    };
};

export default {
    validateResumeDocument,
    validateExtension,
    validateDeclaredMimeType,
    validatePdfDocument,
    validateDocxDocument,
    readHeaderBytes,
    FileValidationError,
    MAX_ZIP_ENTRIES,
    MAX_TOTAL_UNCOMPRESSED_BYTES,
    MAX_COMPRESSION_RATIO
};
