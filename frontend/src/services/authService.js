import api from "./api";

/**
 * Register a new user account
 * @param {object} userData
 * @param {string} userData.fullName
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.confirmPassword
 * @returns {Promise<{success: boolean, message: string, user: object}>}
 */
export const registerApi = async (userData) => {
  return await api.post("/auth/register", userData);
};

/**
 * Log in user and establish cookie session
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{success: boolean, message: string, user: object}>}
 */
export const loginApi = async (credentials) => {
  return await api.post("/auth/login", credentials);
};

/**
 * Retrieve authenticated user profile from active session
 * @returns {Promise<{success: boolean, user: object}>}
 */
export const getMeApi = async () => {
  return await api.get("/auth/me");
};

/**
 * Log out user and clear authentication session cookies
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const logoutApi = async () => {
  return await api.post("/auth/logout");
};
