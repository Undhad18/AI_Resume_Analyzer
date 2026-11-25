import api from "./api";

/**
 * Fetch authenticated user's dashboard metrics and recent activity
 * @returns {Promise<{
 *   totalResumes: number,
 *   totalAnalyses: number,
 *   averageScore: number|null,
 *   totalJobMatches: number,
 *   recentResumes: Array<object>,
 *   recentAnalyses: Array<object>
 * }>}
 */
export const getDashboardSummary = async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
};

export default {
    getDashboardSummary
};
