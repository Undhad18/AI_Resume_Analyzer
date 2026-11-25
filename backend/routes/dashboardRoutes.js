import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getSummary } from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/summary - Protected by JWT authentication
router.get("/summary", authenticateToken, getSummary);

export default router;
