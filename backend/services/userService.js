import db from "../config/db.js";
import { findUserById, updateUserProfile as updateModelProfile } from "../models/userModel.js";

/**
 * Fetch safe user profile data for authenticated user
 * @param {number|string} userId
 * @returns {Promise<object>}
 */
export const getUserProfile = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    return {
        id: user.user_id,
        fullName: user.name,
        email: user.email,
        profileImage: user.profile_image || null,
        emailVerified: Boolean(user.email_verified),
        accountStatus: user.account_status,
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };
};

/**
 * Update authenticated user's profile (name and email)
 * @param {number|string} userId
 * @param {object} params
 * @param {string} params.fullName
 * @param {string} params.email
 * @returns {Promise<object>}
 */
export const updateUserProfileData = async (userId, { fullName, email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    // Check if user exists
    const currentUser = await findUserById(userId);
    if (!currentUser) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    // Check if new email is already claimed by another user
    const [existing] = await db.execute(
        `SELECT user_id FROM users WHERE email = ? AND user_id != ?`,
        [normalizedEmail, userId]
    );

    if (existing.length > 0) {
        const error = new Error("This email is already in use by another account");
        error.statusCode = 409;
        throw error;
    }

    try {
        const updatedUser = await updateModelProfile(userId, {
            name: trimmedName,
            email: normalizedEmail
        });

        return {
            id: updatedUser.user_id,
            fullName: updatedUser.name,
            email: updatedUser.email,
            profileImage: updatedUser.profile_image || null,
            emailVerified: Boolean(updatedUser.email_verified),
            accountStatus: updatedUser.account_status,
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at
        };
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
            const error = new Error("This email is already in use by another account");
            error.statusCode = 409;
            throw error;
        }
        throw err;
    }
};
