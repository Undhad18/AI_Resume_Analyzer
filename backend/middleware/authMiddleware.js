import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import db from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticateUser = asyncHandler(
    async (req, res, next) => {

        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            const error = new Error(
                "Authentication required"
            );

            error.statusCode = 401;

            throw error;
        }

        const token = authHeader.split(" ")[1];

        let decoded;

        try {
            decoded = jwt.verify(token, env.JWT_SECRET);
        } catch {
            const error = new Error(
                "Invalid or expired token"
            );

            error.statusCode = 401;

            throw error;
        }

        const [users] = await db.execute(
            `SELECT user_id, name, email, role_id, account_status
             FROM users
             WHERE user_id = ?`,
            [decoded.userId]
        );

        if (!users.length || users[0].account_status !== "active") {
            const error = new Error(
                "User account is unavailable"
            );

            error.statusCode = 401;

            throw error;
        }

        req.user = users[0];

        next();
    }
);