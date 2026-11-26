/**
 * Job Description Frontend API Service (Lesson 9.1)
 */

import api from "./api";

/**
 * List and search job descriptions
 */
export const getJobDescriptions = async ({ search = "", page = 1, limit = 10, sortBy = "created_at", sortOrder = "DESC" } = {}) => {
  return await api.get("/job-descriptions", {
    params: {
      search: search || undefined,
      page,
      limit,
      sortBy,
      sortOrder
    }
  });
};

/**
 * Get job description by ID
 */
export const getJobDescriptionById = async (id) => {
  return await api.get(`/job-descriptions/${id}`);
};

/**
 * Create a new job description
 */
export const createJobDescription = async (data) => {
  return await api.post("/job-descriptions", data);
};

/**
 * Update an existing job description
 */
export const updateJobDescription = async (id, data) => {
  return await api.put(`/job-descriptions/${id}`, data);
};

/**
 * Delete a job description
 */
export const deleteJobDescription = async (id) => {
  return await api.delete(`/job-descriptions/${id}`);
};

export default {
  getJobDescriptions,
  getJobDescriptionById,
  createJobDescription,
  updateJobDescription,
  deleteJobDescription
};
