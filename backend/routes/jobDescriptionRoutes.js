/**
 * Job Description API Routes (Lesson 9.1)
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  createJobDescriptionHandler,
  listJobDescriptionsHandler,
  getJobDescriptionHandler,
  updateJobDescriptionHandler,
  deleteJobDescriptionHandler
} from "../controllers/jobDescriptionController.js";

const router = express.Router();

// Apply authentication to all job description endpoints
router.use(authenticateToken);

router.post("/", createJobDescriptionHandler);
router.get("/", listJobDescriptionsHandler);
router.get("/:id", getJobDescriptionHandler);
router.put("/:id", updateJobDescriptionHandler);
router.delete("/:id", deleteJobDescriptionHandler);

export default router;
