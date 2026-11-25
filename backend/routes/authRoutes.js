import express from "express";
import { register, login, getMe, logout } from "../controllers/authController.js";
import { validate } from "../middleware/validateMiddleware.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";
import { registrationLimiter, loginLimiter } from "../middleware/rateLimitMiddleware.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registrationLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);

// Protected routes
router.get("/me", authenticateToken, getMe);
router.post("/logout", logout);

export default router;
