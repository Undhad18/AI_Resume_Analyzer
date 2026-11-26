/**
 * Zod Validation Schemas for Resume & Job Description Matching (Lesson 9.2)
 */

import { z } from "zod";

export const MATCH_STATUS_ENUM = ["matched", "partially_matched", "not_detected"];
export const REQUIREMENT_CATEGORY_ENUM = ["required", "preferred", "general"];

/**
 * Request schema for POST /api/job-matches
 */
export const createJobMatchRequestSchema = z.object({
  resumeId: z.coerce.number().int().positive("A valid resumeId is required."),
  jobDescriptionId: z.coerce.number().int().positive().optional(),
  jobId: z.coerce.number().int().positive().optional(),
  mode: z.enum(["free", "advanced"]).default("free")
}).refine((data) => data.jobDescriptionId || data.jobId, {
  message: "Either jobDescriptionId or jobId must be provided."
});

/**
 * Supporting textual evidence citation from the resume
 */
export const matchEvidenceItemSchema = z.object({
  sourceSection: z.string().default("general"),
  text: z.string().min(1, "Evidence text cannot be empty.")
});

/**
 * Individual matched requirement
 */
export const requirementMatchItemSchema = z.object({
  requirement: z.string().min(1, "Requirement cannot be empty."),
  category: z.string().default("required"),
  status: z.enum(MATCH_STATUS_ENUM),
  evidence: z.array(matchEvidenceItemSchema).default([]),
  explanation: z.string().default("")
});

/**
 * Detailed matching categories
 */
export const matchingDetailsSchema = z.object({
  skills: z.array(requirementMatchItemSchema).default([]),
  experience: z.array(requirementMatchItemSchema).default([]),
  education: z.array(requirementMatchItemSchema).default([]),
  projects: z.array(requirementMatchItemSchema).default([]),
  responsibilities: z.array(requirementMatchItemSchema).default([]),
  certifications: z.array(requirementMatchItemSchema).default([])
});

/**
 * Score Interpretation Labels (Lesson 9.3)
 */
export const SCORE_LABELS_ENUM = [
  "Excellent Match",
  "Very Good Match",
  "Good Match",
  "Moderate Match",
  "Low Match",
  "Very Low Match"
];

/**
 * Category Score Breakdown Item
 */
export const categoryScoreDetailSchema = z.object({
  category: z.string(),
  score: z.number().min(0).max(100),
  baseWeight: z.number().min(0).max(100),
  normalizedWeight: z.number().min(0).max(100),
  weightedContribution: z.number().min(0).max(100),
  isApplicable: z.boolean(),
  totalRequirements: z.number().int().min(0),
  matchedCount: z.number().int().min(0),
  partiallyMatchedCount: z.number().int().min(0),
  notDetectedCount: z.number().int().min(0),
  confidence: z.enum(["high", "medium", "low", "insufficient"])
});

/**
 * Keyword item schema
 */
export const keywordItemSchema = z.object({
  keyword: z.string().min(1),
  category: z.string().default("general"),
  status: z.enum(MATCH_STATUS_ENUM),
  sourceSection: z.string().optional().default("skills"),
  evidence: z.string().optional().default(""),
  importance: z.enum(REQUIREMENT_CATEGORY_ENUM).default("required"),
  suggestedAction: z.string().optional()
});

/**
 * Report Strengths & Improvement Areas
 */
export const reportInsightItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  evidence: z.string().optional(),
  suggestedAction: z.string().optional()
});

/**
 * Complete Job Match Report Schema (Lesson 9.3)
 */
export const jobMatchReportSchema = z.object({
  matchId: z.number().int().positive(),
  status: z.enum(["completed", "pending", "failed", "processing"]),
  overallScore: z.number().min(0).max(100),
  scoreLabel: z.string(),
  scoreExplanation: z.string(),
  categoryScores: z.object({
    skills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    education: z.number().min(0).max(100),
    projects: z.number().min(0).max(100),
    responsibilities: z.number().min(0).max(100),
    certifications: z.number().min(0).max(100)
  }),
  categoryWeights: z.object({
    skills: z.number(),
    experience: z.number(),
    education: z.number(),
    projects: z.number(),
    responsibilities: z.number(),
    certifications: z.number()
  }),
  categoryDetails: z.record(categoryScoreDetailSchema),
  keywords: z.object({
    matched: z.array(keywordItemSchema).default([]),
    partiallyMatched: z.array(keywordItemSchema).default([]),
    notDetected: z.array(keywordItemSchema).default([])
  }),
  strengths: z.array(reportInsightItemSchema).default([]),
  improvementAreas: z.array(reportInsightItemSchema).default([]),
  analysisLimitations: z.array(z.string()).default([])
});

/**
 * OpenAI Structured Output JSON Schema for Responses API
 */
export const jobMatchingAiFormatConfig = {
  type: "json_schema",
  json_schema: {
    name: "resume_job_matching_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        skills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              category: { type: "string", enum: ["required", "preferred", "general"] },
              status: { type: "string", enum: ["matched", "partially_matched", "not_detected"] },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceSection: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["sourceSection", "text"],
                  additionalProperties: false
                }
              },
              explanation: { type: "string" }
            },
            required: ["requirement", "category", "status", "evidence", "explanation"],
            additionalProperties: false
          }
        },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              category: { type: "string", enum: ["required", "preferred", "general"] },
              status: { type: "string", enum: ["matched", "partially_matched", "not_detected"] },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceSection: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["sourceSection", "text"],
                  additionalProperties: false
                }
              },
              explanation: { type: "string" }
            },
            required: ["requirement", "category", "status", "evidence", "explanation"],
            additionalProperties: false
          }
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              category: { type: "string", enum: ["required", "preferred", "general"] },
              status: { type: "string", enum: ["matched", "partially_matched", "not_detected"] },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceSection: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["sourceSection", "text"],
                  additionalProperties: false
                }
              },
              explanation: { type: "string" }
            },
            required: ["requirement", "category", "status", "evidence", "explanation"],
            additionalProperties: false
          }
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              category: { type: "string", enum: ["required", "preferred", "general"] },
              status: { type: "string", enum: ["matched", "partially_matched", "not_detected"] },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceSection: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["sourceSection", "text"],
                  additionalProperties: false
                }
              },
              explanation: { type: "string" }
            },
            required: ["requirement", "category", "status", "evidence", "explanation"],
            additionalProperties: false
          }
        },
        responsibilities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              category: { type: "string", enum: ["required", "preferred", "general"] },
              status: { type: "string", enum: ["matched", "partially_matched", "not_detected"] },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceSection: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["sourceSection", "text"],
                  additionalProperties: false
                }
              },
              explanation: { type: "string" }
            },
            required: ["requirement", "category", "status", "evidence", "explanation"],
            additionalProperties: false
          }
        },
        certifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              requirement: { type: "string" },
              category: { type: "string", enum: ["required", "preferred", "general"] },
              status: { type: "string", enum: ["matched", "partially_matched", "not_detected"] },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceSection: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["sourceSection", "text"],
                  additionalProperties: false
                }
              },
              explanation: { type: "string" }
            },
            required: ["requirement", "category", "status", "evidence", "explanation"],
            additionalProperties: false
          }
        },
        analysisLimitations: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: [
        "skills",
        "experience",
        "education",
        "projects",
        "responsibilities",
        "certifications",
        "analysisLimitations"
      ],
      additionalProperties: false
    }
  }
};
