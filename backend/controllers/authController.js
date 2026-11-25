import { asyncHandler } from "../utils/asyncHandler.js";
import { registerUser, loginUser } from "../services/authService.js";
import { getClearCookieOptions } from "../utils/jwtHelper.js";
import { generateCsrfToken, getCsrfCookieOptions } from "../middleware/csrfMiddleware.js";

/**
 * Register a new user controller
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.validatedBody;

    const user = await registerUser({
        fullName,
        email,
        password
    });

    return res.status(201).json({
        success: true,
        message: "Registration successful",
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email
        }
    });
});

/**
 * Authenticate user controller
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.validatedBody;

    const { user, token, cookieOptions } = await loginUser({
        email,
        password
    });

    const csrfToken = generateCsrfToken();

    // Establish authentication session via Secure HttpOnly cookie
    res.cookie("token", token, cookieOptions);
    // Dispatches readable CSRF token for double-submit verification
    res.cookie("csrfToken", csrfToken, getCsrfCookieOptions());

    return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email
        }
    });
});

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            fullName: req.user.fullName,
            email: req.user.email
        }
    });
});

/**
 * Log out user by clearing authentication cookies
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
    res.clearCookie("token", getClearCookieOptions());
    res.clearCookie("csrfToken", { path: "/" });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});
