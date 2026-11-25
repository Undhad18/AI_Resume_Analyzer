import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// 15 minutes in milliseconds
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

/**
 * Generate a signed JWT access token for the authenticated user
 * @param {object} payload
 * @param {number|string} payload.userId
 * @param {string} [payload.email]
 * @param {number} [payload.roleId]
 * @param {object} [options]
 * @returns {string}
 */
export const generateToken = (payload, options = {}) => {
    const { userId, email, roleId, ...rest } = payload;

    return jwt.sign(
        {
            sub: String(userId),
            email,
            roleId,
            ...rest
        },
        env.JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: env.JWT_ACCESS_EXPIRES_IN,
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
            ...options
        }
    );
};

/**
 * Verify a JWT access token, strictly enforcing algorithm, issuer, and audience
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
    });
};

/**
 * Return standardized secure cookie options for session management
 * @returns {object}
 */
export const getAuthCookieOptions = () => {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
        path: "/"
    };
};

/**
 * Return matching cookie options for clearing the session
 * @returns {object}
 */
export const getClearCookieOptions = () => {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    };
};
