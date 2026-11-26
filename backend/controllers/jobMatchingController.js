/**
 * Job Matching Controller (Lesson 9.2)
 * Manages matching requests, authorization verification, and saved match retrieval.
 */

import { createJobMatchRequestSchema } from "../validators/jobMatchingSchema.js";
import {
  performResumeJobMatch,
  getJobMatchById,
  listUserJobMatches,
  JobMatchingError
} from "../services/resumeJobMatchingService.js";
import { getJobMatchReportById } from "../services/jobMatchReportService.js";
import { OpenAiServiceError } from "../services/openaiService.js";

/**
 * Execute resume and job description matching analysis
 * POST /api/job-matches
 */
export const createJobMatchHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to request job matching."
      });
    }

    const parsed = createJobMatchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid matching parameters.",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message
        }))
      });
    }

    const { resumeId, jobDescriptionId, jobId, mode } = parsed.data;
    const targetJdId = jobDescriptionId || jobId;

    const result = await performResumeJobMatch({
      userId: req.user.id,
      resumeId,
      jobDescriptionId: targetJdId,
      mode
    });

    return res.status(201).json({
      success: true,
      message: "Resume and job description matching completed.",
      data: result
    });
  } catch (error) {
    if (error instanceof JobMatchingError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    if (error instanceof OpenAiServiceError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    console.error("Job matching error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred during job matching.",
      code: "MATCHING_INTERNAL_ERROR"
    });
  }
};

/**
 * Retrieve saved matching result by ID
 * GET /api/job-matches/:id
 */
export const getJobMatchHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const matchId = Number(req.params.id);
    if (!matchId || isNaN(matchId) || matchId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid match record ID."
      });
    }

    const match = await getJobMatchById({
      matchId,
      userId: req.user.id
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Matching record not found or access denied."
      });
    }

    return res.status(200).json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error("Error retrieving job match:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while fetching the match record."
    });
  }
};

/**
 * List recent matching analyses for authenticated user
 * GET /api/job-matches
 */
export const listJobMatchesHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const limit = Number(req.query.limit) || 10;
    const matches = await listUserJobMatches({
      userId: req.user.id,
      limit
    });

    return res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error("Error listing job matches:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while listing job matches."
    });
  }
};

/**
 * Calculate or recalculate job match score and report
 * POST /api/job-matches/:id/score
 */
export const calculateScoreHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const matchId = Number(req.params.id);
    if (!matchId || isNaN(matchId) || matchId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid match record ID."
      });
    }

    const report = await getJobMatchReportById({
      matchId,
      userId: req.user.id,
      recalculate: true
    });

    return res.status(200).json({
      success: true,
      message: "Job match score and report calculated successfully.",
      data: report
    });
  } catch (error) {
    if (error instanceof JobMatchingError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    console.error("Error calculating job match score:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred while calculating match score."
    });
  }
};

/**
 * Retrieve complete job match report by matchId
 * GET /api/job-matches/:id/report
 */
export const getJobMatchReportHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const matchId = Number(req.params.id);
    if (!matchId || isNaN(matchId) || matchId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid match record ID."
      });
    }

    const report = await getJobMatchReportById({
      matchId,
      userId: req.user.id,
      recalculate: false
    });

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    if (error instanceof JobMatchingError) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    console.error("Error retrieving job match report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred while fetching the match report."
    });
  }
};
