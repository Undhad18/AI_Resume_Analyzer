import db from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwtHelper.js";

/**
 * JWT Authentication Middleware
 * Validates access token from HttpOnly cookie (or Bearer header),
 * validates claims, enforces active account status, and binds verified user to req.user.
 */
export const authenticateToken = asyncHandler(async (req, res, next) => {
    // 1. Read token from cookie (primary) or Authorization header (fallback)
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        const error = new Error("Authentication required");
        error.statusCode = 401;
        throw error;
    }

    // 2. Cryptographically verify signature, expiration, issuer, audience, and algorithm
    let decoded;
    try {
        decoded = verifyToken(token);
    } catch {
        const error = new Error("Invalid or expired authentication token");
        error.statusCode = 401;
        throw error;
    }

    // 3. Validate subject claim
    const userId = decoded.sub || decoded.userId;
    if (!userId) {
        const error = new Error("Invalid token claims");
        error.statusCode = 401;
        throw error;
    }

    // 4. Verify identity in MySQL database
    const [users] = await db.execute(
        `SELECT user_id, role_id, name, email, account_status
         FROM users
         WHERE user_id = ?`,
        [userId]
    );

    if (!users.length) {
        const error = new Error("User account not found");
        error.statusCode = 401;
        throw error;
    }

    const user = users[0];

    // 5. Enforce account status constraints
    if (user.account_status !== "active") {
        const error = new Error(
            user.account_status === "suspended"
                ? "Your account has been suspended. Please contact support."
                : "Your account is inactive. Please contact support."
        );
        error.statusCode = 403;
        throw error;
    }

    // 6. Bind verified server-side identity to req.user
    req.user = {
        id: user.user_id,
        userId: user.user_id,
        roleId: user.role_id,
        fullName: user.name,
        name: user.name,
        email: user.email,
        accountStatus: user.account_status
    };

    next();
});

// Backward-compatibility alias
export const authenticateUser = authenticateToken;
