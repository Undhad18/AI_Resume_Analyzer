import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardSummary } from "../services/dashboardService.js";

/**
 * GET /api/dashboard/summary
 * Fetches dashboard statistics and recent activity for the authenticated user.
 */
export const getSummary = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const summary = await getDashboardSummary(userId);

    res.status(200).json({
        success: true,
        data: summary
    });
});
