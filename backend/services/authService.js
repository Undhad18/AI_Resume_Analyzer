import bcrypt from "bcrypt";
import { findUserByEmail, createUser } from "../models/userModel.js";
import { generateToken, getAuthCookieOptions } from "../utils/jwtHelper.js";

const BCRYPT_SALT_ROUNDS = 12;

// Dummy hash used for timing attack mitigation when email does not exist
const DUMMY_HASH = "$2b$12$e80yqZfZGZg2F6R4vjK.3.s/6bK5o/qCqYg2Z0m.Y2m6E3k.jD.2m";

/**
 * Register a new user
 * @param {object} params
 * @param {string} params.fullName
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{id: number, fullName: string, email: string}>}
 */
export const registerUser = async ({ fullName, email, password }) => {
    // 1. Normalize email consistently
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if email already exists
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
        const error = new Error("An account with this email already exists");
        error.statusCode = 409;
        throw error;
    }

    // 3. Hash password with bcrypt work factor 12
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 4. Insert into MySQL (never accept client-supplied role)
    try {
        const newUser = await createUser({
            name: fullName.trim(),
            email: normalizedEmail,
            passwordHash,
            roleId: 2 // Regular user role
        });

        // 5. Return sanitized user object
        return {
            id: newUser.user_id,
            fullName: newUser.name,
            email: newUser.email
        };
    } catch (err) {
        // Handle race conditions where two simultaneous requests register the same email
        if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
            const error = new Error("An account with this email already exists");
            error.statusCode = 409;
            throw error;
        }
        throw err;
    }
};

/**
 * Authenticate user and generate session token
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{user: {id: number, fullName: string, email: string}, token: string, cookieOptions: object}>}
 */
export const loginUser = async ({ email, password }) => {
    // 1. Normalize email consistently
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Look up user by normalized email
    const user = await findUserByEmail(normalizedEmail);

    // 3. Timing-safe user verification
    if (!user) {
        // Run dummy comparison to prevent response-time user enumeration
        await bcrypt.compare(password, DUMMY_HASH);
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // 4. Verify password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // 5. Check account status
    if (user.account_status !== "active") {
        const error = new Error(
            user.account_status === "suspended"
                ? "Your account has been suspended. Please contact support."
                : "Your account is inactive. Please contact support."
        );
        error.statusCode = 403;
        throw error;
    }

    // 6. Generate JWT session token
    const token = generateToken({
        userId: user.user_id,
        email: user.email,
        roleId: user.role_id
    });

    // 7. Return safe user info, session token, and cookie options
    return {
        user: {
            id: user.user_id,
            fullName: user.name,
            email: user.email
        },
        token,
        cookieOptions: getAuthCookieOptions()
    };
};
