import db from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

export const getHealthStatus = asyncHandler(
    async (req, res) => {

        await db.query("SELECT 1");

        const data = {
            application: "AI Resume Analyzer",
            server: "Running",
            database: "Connected",
            environment: process.env.NODE_ENV
        };

        return successResponse(
            res,
            "System health checked successfully",
            data
        );
    }
);