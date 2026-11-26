/**
 * Job Matching Frontend API Service (Lesson 9.2)
 */

import api from "./api";

/**
 * Request a resume and job description matching analysis
 */
export const createJobMatch = async ({ resumeId, jobDescriptionId, mode = "free" }) => {
  return await api.post("/job-matches", {
    resumeId,
    jobDescriptionId,
    mode
  });
};

/**
 * Retrieve saved matching result by ID
 */
export const getJobMatch = async (matchId) => {
  return await api.get(`/job-matches/${matchId}`);
};

/**
 * List recent matching analyses for current user
 */
export const listJobMatches = async (limit = 10) => {
  return await api.get("/job-matches", {
    params: { limit }
  });
};

/**
 * Calculate or recalculate match score and report (Lesson 9.3)
 */
export const calculateJobMatchScore = async (matchId) => {
  return await api.post(`/job-matches/${matchId}/score`);
};

/**
 * Retrieve complete match report with scores and missing keywords (Lesson 9.3)
 */
export const getJobMatchReport = async (matchId) => {
  return await api.get(`/job-matches/${matchId}/report`);
};

export default {
  createJobMatch,
  getJobMatch,
  listJobMatches,
  calculateJobMatchScore,
  getJobMatchReport
};
