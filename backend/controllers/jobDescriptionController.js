/**
 * Job Description Controller (Lesson 9.1)
 * Enforces authentication, input validation, and secure multi-tenant CRUD actions.
 */

import {
  createJobDescriptionSchema,
  updateJobDescriptionSchema,
  listJobDescriptionsQuerySchema
} from "../validators/jobDescriptionSchema.js";
import {
  createJobDescription,
  listJobDescriptions,
  getJobDescriptionById,
  updateJobDescription,
  deleteJobDescription
} from "../services/jobDescriptionService.js";

/**
 * Create a new job description
 * POST /api/job-descriptions
 */
export const createJobDescriptionHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to create a job description."
      });
    }

    const parsed = createJobDescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid job description input data.",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message
        }))
      });
    }

    const jobDescription = await createJobDescription({
      userId: req.user.id,
      ...parsed.data
    });

    return res.status(201).json({
      success: true,
      message: "Job description created successfully.",
      data: jobDescription
    });
  } catch (error) {
    console.error("Error creating job description:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while saving the job description."
    });
  }
};

/**
 * List and search job descriptions for authenticated user
 * GET /api/job-descriptions
 */
export const listJobDescriptionsHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to view job descriptions."
      });
    }

    const parsed = listJobDescriptionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message
        }))
      });
    }

    const result = await listJobDescriptions({
      userId: req.user.id,
      ...parsed.data
    });

    return res.status(200).json({
      success: true,
      data: result.jobDescriptions,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Error listing job descriptions:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving job descriptions."
    });
  }
};

/**
 * Retrieve a single job description
 * GET /api/job-descriptions/:id
 */
export const getJobDescriptionHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const id = Number(req.params.id);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid job description identifier."
      });
    }

    const jobDescription = await getJobDescriptionById({
      id,
      userId: req.user.id
    });

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: "Job description not found or access denied."
      });
    }

    return res.status(200).json({
      success: true,
      data: jobDescription
    });
  } catch (error) {
    console.error("Error retrieving job description:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while fetching the job description."
    });
  }
};

/**
 * Update an existing job description
 * PUT /api/job-descriptions/:id
 */
export const updateJobDescriptionHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const id = Number(req.params.id);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid job description identifier."
      });
    }

    const parsed = updateJobDescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid update parameters.",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message
        }))
      });
    }

    const updated = await updateJobDescription({
      id,
      userId: req.user.id,
      updateData: parsed.data
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Job description not found or access denied."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job description updated successfully.",
      data: updated
    });
  } catch (error) {
    console.error("Error updating job description:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating the job description."
    });
  }
};

/**
 * Delete a job description
 * DELETE /api/job-descriptions/:id
 */
export const deleteJobDescriptionHandler = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    const id = Number(req.params.id);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid job description identifier."
      });
    }

    const deleted = await deleteJobDescription({
      id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Job description not found or access denied."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job description deleted successfully.",
      data: { id: deleted.id, jobTitle: deleted.job_title }
    });
  } catch (error) {
    console.error("Error deleting job description:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while deleting the job description."
    });
  }
};
