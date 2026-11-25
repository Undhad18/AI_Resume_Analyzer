import db from "../config/db.js";

/**
 * Find user by email address
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export const findUserByEmail = async (email) => {
    const [rows] = await db.execute(
        `SELECT user_id, role_id, name, email, password_hash, profile_image, email_verified, account_status, created_at, updated_at
         FROM users
         WHERE email = ?`,
        [email]
    );

    return rows.length > 0 ? rows[0] : null;
};

/**
 * Find user by primary key ID
 * @param {number|string} userId
 * @returns {Promise<object|null>}
 */
export const findUserById = async (userId) => {
    const [rows] = await db.execute(
        `SELECT user_id, role_id, name, email, profile_image, email_verified, account_status, created_at, updated_at
         FROM users
         WHERE user_id = ?`,
        [userId]
    );

    return rows.length > 0 ? rows[0] : null;
};

/**
 * Create a new user with parameterized query
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.passwordHash
 * @param {number} [params.roleId=2] - Default 2 for regular user
 * @returns {Promise<object>}
 */
export const createUser = async ({ name, email, passwordHash, roleId = 2 }) => {
    const [result] = await db.execute(
        `INSERT INTO users (role_id, name, email, password_hash, account_status, email_verified)
         VALUES (?, ?, ?, ?, 'active', 0)`,
        [roleId, name, email, passwordHash]
    );

    return {
        user_id: result.insertId,
        name,
        email,
        role_id: roleId,
        account_status: "active"
    };
};

/**
 * Update user full name and email
 * @param {number|string} userId
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @returns {Promise<object|null>}
 */
export const updateUserProfile = async (userId, { name, email }) => {
    await db.execute(
        `UPDATE users
         SET name = ?, email = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [name, email, userId]
    );

    return findUserById(userId);
};
