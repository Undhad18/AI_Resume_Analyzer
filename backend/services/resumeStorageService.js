import fs from "fs";
import path from "path";
import crypto from "crypto";
import db from "../config/db.js";
import { STAGING_DIR, STORAGE_DIR, QUARANTINE_DIR } from "../config/multerConfig.js";

/**
 * Safely moves a file from source to destination across filesystems
 * @param {string} sourcePath
 * @param {string} destinationPath
 */
export const moveFileSafely = async (sourcePath, destinationPath) => {
    try {
        await fs.promises.rename(sourcePath, destinationPath);
    } catch (err) {
        if (err.code === "EXDEV") {
            // Cross-device fallback: stream copy then unlink source
            await fs.promises.copyFile(sourcePath, destinationPath);
            await fs.promises.unlink(sourcePath);
        } else {
            throw err;
        }
    }
};

/**
 * Safely unlinks a file from disk if it resides inside private application directories
 * @param {string} filePath
 */
export const cleanupFileSafely = async (filePath) => {
    if (!filePath || typeof filePath !== "string") return;

    try {
        const resolvedPath = path.resolve(filePath);
        const resolvedStagingDir = path.resolve(STAGING_DIR);
        const resolvedStorageDir = path.resolve(STORAGE_DIR);
        const resolvedQuarantineDir = path.resolve(QUARANTINE_DIR);

        const isSafePath =
            resolvedPath.startsWith(resolvedStagingDir) ||
            resolvedPath.startsWith(resolvedStorageDir) ||
            resolvedPath.startsWith(resolvedQuarantineDir);

        if (isSafePath && fs.existsSync(resolvedPath)) {
            await fs.promises.unlink(resolvedPath);
        }
    } catch (cleanupErr) {
        console.error("Warning: Storage cleanup encountered an error:", cleanupErr.message);
    }
};

/**
 * Safely resolves a stored relative storage key inside the private storage directory,
 * preventing any path traversal attempts.
 * @param {string} storageKey
 * @returns {string} Absolute resolved file path
 */
export const resolveStorageFilePath = (storageKey) => {
    if (!storageKey || typeof storageKey !== "string") {
        const err = new Error("Invalid document storage reference");
        err.statusCode = 400;
        throw err;
    }

    // Explicit path traversal block
    if (storageKey.includes("..") || storageKey.includes("\0")) {
        const err = new Error("Dangerous storage reference detected: path traversal not allowed");
        err.statusCode = 400;
        throw err;
    }

    const baseUploadsDir = path.resolve(STORAGE_DIR, "..");
    const resolvedPath = path.resolve(baseUploadsDir, storageKey);
    const resolvedStorageDir = path.resolve(STORAGE_DIR);

    // Ensure the resolved path resides strictly inside STORAGE_DIR or baseUploadsDir
    if (!resolvedPath.startsWith(resolvedStorageDir) && !resolvedPath.startsWith(baseUploadsDir)) {
        const err = new Error("Access denied: path traversal attempt");
        err.statusCode = 403;
        throw err;
    }

    return resolvedPath;
};

/**
 * Stores a validated resume document in private storage and records metadata in MySQL
 * @param {object} params
 * @param {number|string} params.userId - Authenticated user ID (verified by auth middleware)
 * @param {string} [params.candidateName] - Candidate name from profile or document
 * @param {string} params.originalName - Client's original filename
 * @param {string} params.stagedPath - Path to staged file in STAGING_DIR
 * @param {string} params.mimeType - Validated MIME type
 * @param {number} params.fileSize - File size in bytes
 * @param {string} params.documentType - 'pdf' or 'docx'
 * @param {number} [params.pageCount] - Page count if PDF
 * @returns {Promise<object>} Stored resume metadata including database IDs
 */
export const storeResumeFileAndMetadata = async ({
    userId,
    candidateName,
    originalName,
    stagedPath,
    mimeType,
    fileSize,
    documentType,
    pageCount
}) => {
    if (!userId) {
        throw new Error("User ID is required for resume ownership");
    }

    if (!stagedPath || !fs.existsSync(stagedPath)) {
        throw new Error("Staged resume file does not exist on server");
    }

    // 1. Generate unique server-side storage filename
    const ext = path.extname(originalName).toLowerCase();
    const safeExt = [".pdf", ".docx"].includes(ext)
        ? ext
        : documentType === "docx"
            ? ".docx"
            : ".pdf";

    const uniqueId = crypto.randomBytes(16).toString("hex");
    const storageFilename = `resume-${Date.now()}-${uniqueId}${safeExt}`;
    const finalStoragePath = path.join(STORAGE_DIR, storageFilename);
    const storageKey = `resumes/${storageFilename}`; // Safe relative key stored in DB

    // 2. Move file from staging to private permanent storage
    try {
        await moveFileSafely(stagedPath, finalStoragePath);
    } catch (moveErr) {
        await cleanupFileSafely(stagedPath);
        console.error("Failed to move resume file to private storage:", moveErr.message);
        const error = new Error("Failed to secure resume file storage");
        error.statusCode = 500;
        throw error;
    }

    // 3. Database persistence with coordinated transaction & rollback cleanup
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Derive clean title from original filename
        const rawTitle = originalName.replace(/\.[^/.]+$/, "").trim();
        const resumeTitle = rawTitle.substring(0, 200) || "Uploaded Resume";
        const finalCandidateName = (candidateName || "").trim().substring(0, 150) || null;

        // Insert logical resume entity
        const [resumeResult] = await connection.execute(
            `INSERT INTO resumes (user_id, resume_title, candidate_name, status, created_at, updated_at)
             VALUES (?, ?, ?, 'uploaded', NOW(), NOW())`,
            [userId, resumeTitle, finalCandidateName]
        );
        const resumeId = resumeResult.insertId;

        // Insert physical resume file record
        const safeFileType = safeExt.replace(".", "").toLowerCase(); // 'pdf' or 'docx'
        const [fileResult] = await connection.execute(
            `INSERT INTO resume_files (resume_id, file_name, file_path, file_type, file_size, file_purpose, uploaded_at)
             VALUES (?, ?, ?, ?, ?, 'original', NOW())`,
            [resumeId, originalName, storageKey, safeFileType, fileSize]
        );
        const fileId = fileResult.insertId;

        await connection.commit();

        return {
            id: resumeId,
            resumeId,
            fileId,
            userId,
            title: resumeTitle,
            candidateName: finalCandidateName,
            originalFilename: originalName,
            storedFilename: storageFilename,
            storageKey,
            mimeType,
            fileSize,
            fileType: safeFileType,
            documentType: safeFileType,
            pageCount: pageCount || undefined,
            status: "uploaded",
            createdAt: new Date().toISOString()
        };
    } catch (dbErr) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {
                // Ignore rollback failure
            }
        }

        // ROLLBACK FILE: Remove newly moved file from storage so no orphaned files exist
        await cleanupFileSafely(finalStoragePath);

        console.error("Database failure while saving resume metadata:", dbErr.message);
        const error = new Error("Failed to save resume record to database");
        error.statusCode = 500;
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Fetch paginated resume records belonging to the authenticated user
 * @param {object} params
 * @param {number|string} params.userId - Authenticated user ID
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @returns {Promise<{resumes: Array, pagination: object}>}
 */
export const getResumeListForUser = async ({ userId, page = 1, limit = 10 }) => {
    // Validate pagination inputs safely
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    // 1. Query resumes and their primary file metadata
    const [rows] = await db.execute(
        `SELECT 
            r.resume_id AS id,
            r.user_id AS userId,
            r.resume_title AS title,
            r.candidate_name AS candidateName,
            r.status,
            r.created_at AS createdAt,
            r.updated_at AS updatedAt,
            rf.file_name AS originalFilename,
            rf.file_type AS fileType,
            rf.file_size AS fileSize
         FROM resumes r
         LEFT JOIN (
            SELECT resume_id, file_name, file_type, file_size
            FROM resume_files
            WHERE file_id IN (
                SELECT MAX(file_id) 
                FROM resume_files 
                WHERE file_purpose = 'original' 
                GROUP BY resume_id
            )
         ) rf ON r.resume_id = rf.resume_id
         WHERE r.user_id = ? AND r.deleted_at IS NULL
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, parsedLimit, offset]
    );

    // 2. Query total count for pagination metadata
    const [countRows] = await db.execute(
        `SELECT COUNT(*) AS total FROM resumes WHERE user_id = ? AND deleted_at IS NULL`,
        [userId]
    );
    const total = Number(countRows[0]?.total || 0);
    const totalPages = Math.ceil(total / parsedLimit) || 1;

    // Standardize client metadata response
    const resumes = rows.map((r) => ({
        id: r.id,
        resumeId: r.id,
        title: r.title,
        candidateName: r.candidateName,
        originalFilename: r.originalFilename || `${r.title}.${r.fileType || "pdf"}`,
        mimeType:
            r.fileType === "docx"
                ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                : "application/pdf",
        fileType: r.fileType || "pdf",
        fileSize: Number(r.fileSize || 0),
        status: r.status || "uploaded",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
    }));

    return {
        resumes,
        pagination: {
            total,
            page: parsedPage,
            limit: parsedLimit,
            totalPages
        }
    };
};

/**
 * Fetch and verify file path for preview or download strictly enforcing user ownership
 * @param {object} params
 * @param {number|string} params.resumeId
 * @param {number|string} params.userId
 * @returns {Promise<object>} Resolved file details
 */
export const getResumeFileForPreviewOrDownload = async ({ resumeId, userId }) => {
    const parsedId = parseInt(resumeId, 10);
    if (!parsedId || isNaN(parsedId) || parsedId <= 0) {
        const err = new Error("Invalid resume ID");
        err.statusCode = 400;
        throw err;
    }

    // 1. Query resume and file record belonging strictly to authenticated user
    const [rows] = await db.execute(
        `SELECT 
            r.resume_id,
            r.user_id,
            r.resume_title,
            r.status,
            r.created_at,
            rf.file_id,
            rf.file_name,
            rf.file_path,
            rf.file_type,
            rf.file_size
         FROM resumes r
         JOIN resume_files rf ON r.resume_id = rf.resume_id AND rf.file_purpose = 'original'
         WHERE r.resume_id = ? AND r.user_id = ? AND r.deleted_at IS NULL
         ORDER BY rf.file_id DESC
         LIMIT 1`,
        [parsedId, userId]
    );

    if (!rows.length) {
        // Multi-tenant check: test if resource belongs to another user
        const [otherTenantRows] = await db.execute(
            `SELECT resume_id FROM resumes WHERE resume_id = ? AND deleted_at IS NULL`,
            [parsedId]
        );

        if (otherTenantRows.length > 0) {
            const err = new Error("Access denied: you do not own this resource");
            err.statusCode = 403;
            throw err;
        }

        const err = new Error("Resume not found");
        err.statusCode = 404;
        throw err;
    }

    const record = rows[0];

    // 2. Safely resolve disk path avoiding path traversal
    const resolvedFilePath = resolveStorageFilePath(record.file_path);

    // 3. Confirm file exists on disk and is a regular file
    if (!fs.existsSync(resolvedFilePath)) {
        const err = new Error("Resume document file is missing on storage server");
        err.statusCode = 404;
        throw err;
    }

    const stats = await fs.promises.stat(resolvedFilePath);
    if (!stats.isFile()) {
        const err = new Error("Invalid document storage reference");
        err.statusCode = 404;
        throw err;
    }

    const mimeType =
        record.file_type === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf";

    return {
        resumeId: record.resume_id,
        userId: record.user_id,
        filePath: resolvedFilePath,
        originalFilename: record.file_name,
        mimeType,
        fileType: record.file_type,
        fileSize: stats.size
    };
};

/**
 * Safely delete a resume for the authenticated user using soft delete and file quarantine
 * @param {object} params
 * @param {number|string} params.resumeId
 * @param {number|string} params.userId
 * @returns {Promise<object>}
 */
export const deleteResumeForUser = async ({ resumeId, userId }) => {
    const parsedId = parseInt(resumeId, 10);
    if (!parsedId || isNaN(parsedId) || parsedId <= 0) {
        const err = new Error("Invalid resume ID");
        err.statusCode = 400;
        throw err;
    }

    // 1. Find record and verify ownership
    const [rows] = await db.execute(
        `SELECT 
            r.resume_id,
            r.user_id,
            rf.file_path,
            rf.file_name
         FROM resumes r
         LEFT JOIN resume_files rf ON r.resume_id = rf.resume_id
         WHERE r.resume_id = ? AND r.user_id = ? AND r.deleted_at IS NULL`,
        [parsedId, userId]
    );

    if (!rows.length) {
        // Multi-tenant check
        const [otherTenantRows] = await db.execute(
            `SELECT resume_id FROM resumes WHERE resume_id = ? AND deleted_at IS NULL`,
            [parsedId]
        );

        if (otherTenantRows.length > 0) {
            const err = new Error("Access denied: you do not own this resource");
            err.statusCode = 403;
            throw err;
        }

        const err = new Error("Resume not found");
        err.statusCode = 404;
        throw err;
    }

    const record = rows[0];
    let originalFilePath = null;
    let quarantineFilePath = null;

    // 2. Quarantine physical file if present
    if (record.file_path) {
        try {
            originalFilePath = resolveStorageFilePath(record.file_path);
            if (fs.existsSync(originalFilePath)) {
                const quarantineFilename = `quarantine-${Date.now()}-${path.basename(originalFilePath)}`;
                quarantineFilePath = path.join(QUARANTINE_DIR, quarantineFilename);
                await moveFileSafely(originalFilePath, quarantineFilePath);
            }
        } catch (quarantineErr) {
            console.error("Warning during file quarantine:", quarantineErr.message);
        }
    }

    // 3. Execute soft delete in MySQL
    try {
        const [updateResult] = await db.execute(
            `UPDATE resumes SET deleted_at = NOW(), status = 'failed'
             WHERE resume_id = ? AND user_id = ? AND deleted_at IS NULL`,
            [parsedId, userId]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error("Resume already deleted or update failed");
        }

        // 4. On DB success: permanently remove quarantined file
        if (quarantineFilePath && fs.existsSync(quarantineFilePath)) {
            await cleanupFileSafely(quarantineFilePath);
        }

        return {
            success: true,
            message: "Resume deleted successfully",
            deletedId: parsedId
        };
    } catch (dbErr) {
        // RESTORE QUARANTINED FILE ON DB FAILURE
        if (quarantineFilePath && originalFilePath && fs.existsSync(quarantineFilePath)) {
            try {
                await moveFileSafely(quarantineFilePath, originalFilePath);
            } catch (restoreErr) {
                console.error("Failed to restore quarantined file:", restoreErr.message);
            }
        }

        console.error("Database error during resume deletion:", dbErr.message);
        const err = new Error("Failed to delete resume record");
        err.statusCode = 500;
        throw err;
    }
};

/**
 * Persists extracted plain text for a resume belonging to the authenticated user
 * @param {object} params
 * @param {number|string} params.resumeId
 * @param {number|string} params.userId
 * @param {string} params.extractedText
 */
export const updateResumeExtractedText = async ({ resumeId, userId, extractedText }) => {
    const parsedId = parseInt(resumeId, 10);
    if (!parsedId || isNaN(parsedId) || parsedId <= 0) {
        const err = new Error("Invalid resume ID");
        err.statusCode = 400;
        throw err;
    }

    await db.execute(
        `UPDATE resumes
         SET extracted_text = ?, updated_at = NOW()
         WHERE resume_id = ? AND user_id = ? AND deleted_at IS NULL`,
        [extractedText, parsedId, userId]
    );
};

export default {
    storeResumeFileAndMetadata,
    getResumeListForUser,
    getResumeFileForPreviewOrDownload,
    deleteResumeForUser,
    updateResumeExtractedText,
    resolveStorageFilePath,
    moveFileSafely,
    cleanupFileSafely
};
