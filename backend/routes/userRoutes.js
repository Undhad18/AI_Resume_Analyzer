import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { updateProfileSchema } from "../validators/userValidator.js";
import { getProfile, updateProfile } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users/profile
router.get("/profile", authenticateToken, getProfile);

// PUT /api/users/profile
router.put(
    "/profile",
    authenticateToken,
    validate(updateProfileSchema),
    updateProfile
);

export default router;
