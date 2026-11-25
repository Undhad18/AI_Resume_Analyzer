import db from "../config/db.js";

/**
 * Fetch aggregated dashboard metrics and recent activity for the authenticated user.
 * 
 * Strict Multi-Tenant Security Rules:
 * 1. Filtered exclusively by authenticated userId (req.user.id).
 * 2. Parameterized queries to prevent SQL injection.
 * 3. Soft-deleted resumes (deleted_at IS NOT NULL) are excluded from all counts and lists.
 * 4. Sensitive file paths (file_path) are excluded from responses.
 * 5. Analyses must be in 'completed' status and have a non-null score to count toward averageScore.
 * 
 * @param {number|string} userId - The authenticated user's ID
 * @returns {Promise<object>} Dashboard summary payload
 */
export const getDashboardSummary = async (userId) => {
    // 1. Total active resumes owned by user
    const [resumeCountRows] = await db.execute(
        `SELECT COUNT(*) AS totalResumes
         FROM resumes
         WHERE user_id = ? AND deleted_at IS NULL`,
        [userId]
    );
    const totalResumes = Number(resumeCountRows[0]?.totalResumes || 0);

    // 2. Total completed analyses and average overall score for user's active resumes
    const [analysisStatsRows] = await db.execute(
        `SELECT 
            COUNT(ra.analysis_id) AS totalAnalyses,
            ROUND(AVG(ra.overall_score), 1) AS averageScore
         FROM resume_analyses ra
         JOIN resumes r ON ra.resume_id = r.resume_id
         WHERE r.user_id = ? 
           AND r.deleted_at IS NULL 
           AND ra.analysis_status = 'completed'
           AND ra.overall_score IS NOT NULL`,
        [userId]
    );
    const totalAnalyses = Number(analysisStatsRows[0]?.totalAnalyses || 0);
    const averageScore = analysisStatsRows[0]?.averageScore !== null && analysisStatsRows[0]?.averageScore !== undefined
        ? Number(analysisStatsRows[0].averageScore)
        : null;

    // 3. Total job matches for user's active resumes
    const [jobMatchRows] = await db.execute(
        `SELECT COUNT(jm.match_id) AS totalJobMatches
         FROM job_matches jm
         JOIN resumes r ON jm.resume_id = r.resume_id
         WHERE r.user_id = ? AND r.deleted_at IS NULL`,
        [userId]
    );
    const totalJobMatches = Number(jobMatchRows[0]?.totalJobMatches || 0);

    // 4. Recent resumes (limit 5 latest, excluding sensitive file_path)
    const [recentResumeRows] = await db.execute(
        `SELECT 
            r.resume_id AS id,
            r.resume_title AS title,
            r.candidate_name AS candidateName,
            r.status,
            r.created_at AS createdAt,
            r.updated_at AS updatedAt,
            rf.file_name AS fileName,
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
         LIMIT 5`,
        [userId]
    );

    // 5. Recent analyses (limit 5 latest, including score breakdown)
    const [recentAnalysisRows] = await db.execute(
        `SELECT 
            ra.analysis_id AS id,
            ra.resume_id AS resumeId,
            r.resume_title AS resumeTitle,
            ra.overall_score AS overallScore,
            rs.ats_score AS atsScore,
            ra.analysis_status AS status,
            ra.ai_model AS aiModel,
            ra.analyzed_at AS analyzedAt
         FROM resume_analyses ra
         JOIN resumes r ON ra.resume_id = r.resume_id
         LEFT JOIN resume_scores rs ON ra.analysis_id = rs.analysis_id
         WHERE r.user_id = ? AND r.deleted_at IS NULL
         ORDER BY ra.analyzed_at DESC
         LIMIT 5`,
        [userId]
    );

    return {
        totalResumes,
        totalAnalyses,
        averageScore,
        totalJobMatches,
        recentResumes: recentResumeRows.map(row => ({
            id: row.id,
            title: row.title || "Untitled Resume",
            candidateName: row.candidateName || null,
            status: row.status,
            fileName: row.fileName || null,
            fileType: row.fileType || null,
            fileSize: row.fileSize ? Number(row.fileSize) : null,
            createdAt: row.createdAt
        })),
        recentAnalyses: recentAnalysisRows.map(row => ({
            id: row.id,
            resumeId: row.resumeId,
            resumeTitle: row.resumeTitle || "Untitled Resume",
            overallScore: row.overallScore !== null ? Number(row.overallScore) : null,
            atsScore: row.atsScore !== null && row.atsScore !== undefined ? Number(row.atsScore) : null,
            status: row.status,
            aiModel: row.aiModel || null,
            analyzedAt: row.analyzedAt
        }))
    };
};
