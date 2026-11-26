/**
 * Job Matching API Routes (Lesson 9.2)
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  createJobMatchHandler,
  getJobMatchHandler,
  listJobMatchesHandler,
  calculateScoreHandler,
  getJobMatchReportHandler
} from "../controllers/jobMatchingController.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", createJobMatchHandler);
router.get("/", listJobMatchesHandler);
router.get("/:id", getJobMatchHandler);
router.post("/:id/score", calculateScoreHandler);
router.get("/:id/report", getJobMatchReportHandler);

export default router;
