import crypto from "crypto";
import { env } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Generate a cryptographically secure CSRF token
 * @returns {string}
 */
export const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

/**
 * Return cookie options for the readable CSRF token cookie
 * Note: httpOnly is false so standard clients (e.g. Axios) can read it and send in headers
 * @returns {object}
 */
export const getCsrfCookieOptions = () => {
    return {
        httpOnly: false,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    };
};

/**
 * CSRF Protection Middleware for cookie-authenticated state-changing requests
 */
export const csrfProtection = (req, res, next) => {
    // 1. Safe read-only methods are exempt
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    // 2. If the request does NOT carry a session cookie, CSRF does not apply (e.g. Bearer auth or public endpoints)
    if (!req.cookies?.token) {
        return next();
    }

    // 3. Exempt public authentication routes (login and register) where session doesn't exist yet
    if (req.path === "/api/auth/login" || req.path === "/api/auth/register" || req.path === "/login" || req.path === "/register") {
        return next();
    }

    // 4. Verify Origin header matches trusted CLIENT_URL (if Origin is provided)
    const origin = req.headers.origin;
    if (origin && origin === env.CLIENT_URL) {
        return next();
    }

    // 5. Verify custom CSRF header or Double-Submit token
    const clientToken =
        req.headers["x-csrf-token"] ||
        req.headers["x-xsrf-token"] ||
        req.headers["x-requested-with"];

    const cookieToken = req.cookies?.csrfToken || req.cookies?.["XSRF-TOKEN"];

    if (clientToken && cookieToken && clientToken === cookieToken) {
        return next();
    }

    // 6. If request has custom X-Requested-With header or valid token
    if (clientToken && (clientToken === "XMLHttpRequest" || clientToken.length >= 16)) {
        return next();
    }

    // 7. CSRF validation failed
    return res.status(403).json({
        success: false,
        message: "CSRF verification failed",
        errors: null
    });
};
