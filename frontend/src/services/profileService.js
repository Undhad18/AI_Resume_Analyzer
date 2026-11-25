import api from "./api";

/**
 * Fetch current authenticated user's profile
 * @returns {Promise<object>} Safe user profile object
 */
export const getProfile = async () => {
    const res = await api.get("/users/profile");
    // Handle both unwrapped and wrapped response structures safely
    return res?.data ? res.data : res;
};

/**
 * Update authenticated user's profile
 * @param {object} profileData
 * @param {string} profileData.fullName
 * @param {string} profileData.email
 * @returns {Promise<object>} Updated profile data object
 */
export const updateProfile = async (profileData) => {
    const res = await api.put("/users/profile", profileData);
    return res?.data ? res.data : res;
};

export default {
    getProfile,
    updateProfile
};
