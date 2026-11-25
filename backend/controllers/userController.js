import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserProfile, updateUserProfileData } from "../services/userService.js";
import { generateToken, getAuthCookieOptions } from "../utils/jwtHelper.js";

/**
 * GET /api/users/profile
 * Retrieve the current authenticated user's profile
 */
export const getProfile = asyncHandler(async (req, res) => {
    const profile = await getUserProfile(req.user.id);

    return res.status(200).json({
        success: true,
        data: profile
    });
});

/**
 * PUT /api/users/profile
 * Update the current authenticated user's profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, email } = req.validatedBody;

    const updatedProfile = await updateUserProfileData(req.user.id, {
        fullName,
        email
    });

    // Refresh JWT token in session cookie with updated email and name claims
    const newToken = generateToken({
        userId: updatedProfile.id,
        email: updatedProfile.email,
        roleId: req.user.roleId || 2
    });

    res.cookie("token", newToken, getAuthCookieOptions());

    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile
    });
});
