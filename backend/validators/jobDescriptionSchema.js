/**
 * Zod Validation Schemas for Job Description Management (Lesson 9.1)
 */

import { z } from "zod";

const urlRegex = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/i;

/**
 * Sanitizes and trims string fields
 */
const trimmedString = (max) =>
  z
    .string()
    .trim()
    .max(max, `Must not exceed ${max} characters.`);

/**
 * Validates optional URL string (allows empty string or null)
 */
const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL must not exceed 500 characters.")
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val.trim().length === 0) return true;
      return urlRegex.test(val.trim());
    },
    {
      message: "Please provide a valid web URL starting with http:// or https://"
    }
  );

/**
 * Schema for creating a new job description
 * POST /api/job-descriptions
 */
export const createJobDescriptionSchema = z.object({
  jobTitle: z
    .string({ required_error: "Job title is required." })
    .trim()
    .min(2, "Job title must be at least 2 characters long.")
    .max(255, "Job title must not exceed 255 characters."),
  companyName: trimmedString(255).optional().nullable(),
  experienceRequired: trimmedString(100).optional().nullable(),
  location: trimmedString(255).optional().nullable(),
  description: z
    .string({ required_error: "Job description is required." })
    .trim()
    .min(10, "Job description must be at least 10 characters long.")
    .max(50000, "Job description must not exceed 50,000 characters."),
  sourceUrl: optionalUrl
});

/**
 * Schema for updating an existing job description
 * PUT /api/job-descriptions/:id
 */
export const updateJobDescriptionSchema = z.object({
  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must be at least 2 characters long.")
    .max(255, "Job title must not exceed 255 characters.")
    .optional(),
  companyName: trimmedString(255).optional().nullable(),
  experienceRequired: trimmedString(100).optional().nullable(),
  location: trimmedString(255).optional().nullable(),
  description: z
    .string()
    .trim()
    .min(10, "Job description must be at least 10 characters long.")
    .max(50000, "Job description must not exceed 50,000 characters.")
    .optional(),
  sourceUrl: optionalUrl
});

/**
 * Query schema for listing and searching job descriptions
 * GET /api/job-descriptions
 */
export const listJobDescriptionsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["created_at", "updated_at", "job_title", "company_name"]).default("created_at"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).default("DESC")
});
