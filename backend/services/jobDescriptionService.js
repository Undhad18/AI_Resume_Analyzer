/**
 * Job Description Service (Lesson 9.1)
 * Handles database operations with parameterized queries and strict tenant isolation.
 * Standardizes primary key as `id` (mapped to `job_id`) and content as `description` (mapped to `job_description`).
 */

import db from "../config/db.js";

/**
 * Creates a new job description for the authenticated user
 */
export const createJobDescription = async ({
  userId,
  jobTitle,
  companyName = null,
  experienceRequired = null,
  location = null,
  description,
  sourceUrl = null
}) => {
  const [result] = await db.execute(
    `INSERT INTO job_descriptions (
      user_id,
      job_title,
      company_name,
      experience_required,
      location,
      job_description,
      source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      jobTitle.trim(),
      companyName ? companyName.trim() : null,
      experienceRequired ? experienceRequired.trim() : null,
      location ? location.trim() : null,
      description.trim(),
      sourceUrl && sourceUrl.trim().length > 0 ? sourceUrl.trim() : null
    ]
  );

  return getJobDescriptionById({ id: result.insertId, userId });
};

/**
 * Lists and searches job descriptions for the authenticated user
 */
export const listJobDescriptions = async ({
  userId,
  search = "",
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "DESC"
}) => {
  const sortMap = {
    id: "job_id",
    job_id: "job_id",
    created_at: "created_at",
    updated_at: "updated_at",
    job_title: "job_title",
    company_name: "company_name"
  };

  const safeSortField = sortMap[sortBy] || "created_at";
  const safeSortDir = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  const offset = (Number(page) - 1) * Number(limit);
  const whereClauses = ["user_id = ?"];
  const queryParams = [userId];

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    whereClauses.push("(job_title LIKE ? OR company_name LIKE ? OR location LIKE ? OR job_description LIKE ?)");
    queryParams.push(term, term, term, term);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  // 1. Get total count for pagination
  const [countResult] = await db.execute(
    `SELECT COUNT(*) as total FROM job_descriptions ${whereSql}`,
    queryParams
  );
  const total = countResult[0]?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // 2. Query paginated results
  const [rows] = await db.query(
    `SELECT
      job_id AS id,
      job_id,
      user_id,
      job_title,
      company_name,
      experience_required,
      location,
      job_description AS description,
      job_description,
      source_url,
      created_at,
      updated_at
    FROM job_descriptions
    ${whereSql}
    ORDER BY ${safeSortField} ${safeSortDir}
    LIMIT ?, ?`,
    [...queryParams, Number(offset), Number(limit)]
  );

  return {
    jobDescriptions: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasMore: page < totalPages
    }
  };
};

/**
 * Retrieves a single job description ensuring strict ownership
 */
export const getJobDescriptionById = async ({ id, userId }) => {
  const [rows] = await db.execute(
    `SELECT
      job_id AS id,
      job_id,
      user_id,
      job_title,
      company_name,
      experience_required,
      location,
      job_description AS description,
      job_description,
      source_url,
      created_at,
      updated_at
    FROM job_descriptions
    WHERE job_id = ? AND user_id = ?`,
    [id, userId]
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * Updates an existing job description for the authenticated owner
 */
export const updateJobDescription = async ({ id, userId, updateData }) => {
  const existing = await getJobDescriptionById({ id, userId });
  if (!existing) {
    return null;
  }

  const newTitle = updateData.jobTitle !== undefined ? updateData.jobTitle.trim() : existing.job_title;
  const newCompany = updateData.companyName !== undefined
    ? (updateData.companyName ? updateData.companyName.trim() : null)
    : existing.company_name;
  const newExp = updateData.experienceRequired !== undefined
    ? (updateData.experienceRequired ? updateData.experienceRequired.trim() : null)
    : existing.experience_required;
  const newLoc = updateData.location !== undefined
    ? (updateData.location ? updateData.location.trim() : null)
    : existing.location;
  const newDesc = updateData.description !== undefined ? updateData.description.trim() : existing.job_description;
  const newUrl = updateData.sourceUrl !== undefined
    ? (updateData.sourceUrl && updateData.sourceUrl.trim().length > 0 ? updateData.sourceUrl.trim() : null)
    : existing.source_url;

  await db.execute(
    `UPDATE job_descriptions
     SET
       job_title = ?,
       company_name = ?,
       experience_required = ?,
       location = ?,
       job_description = ?,
       source_url = ?
     WHERE job_id = ? AND user_id = ?`,
    [newTitle, newCompany, newExp, newLoc, newDesc, newUrl, id, userId]
  );

  return getJobDescriptionById({ id, userId });
};

/**
 * Deletes a job description ensuring strict ownership
 */
export const deleteJobDescription = async ({ id, userId }) => {
  const existing = await getJobDescriptionById({ id, userId });
  if (!existing) {
    return null;
  }

  const [result] = await db.execute(
    `DELETE FROM job_descriptions WHERE job_id = ? AND user_id = ?`,
    [id, userId]
  );

  return result.affectedRows > 0 ? existing : null;
};
