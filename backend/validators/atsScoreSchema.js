import { z } from "zod";

/**
 * Valid ATS Rating Label bounds:
 * 90-100: Excellent Compatibility
 * 80-89:  Very Good Compatibility
 * 70-79:  Good Compatibility
 * 60-69:  Moderate Compatibility
 * 40-59:  Low Compatibility
 * 0-39:   Poor Compatibility
 */
export const getAtsRatingLabel = (score) => {
    const num = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
    if (num >= 90) return "Excellent Compatibility";
    if (num >= 80) return "Very Good Compatibility";
    if (num >= 70) return "Good Compatibility";
    if (num >= 60) return "Moderate Compatibility";
    if (num >= 40) return "Low Compatibility";
    return "Poor Compatibility";
};

/**
 * Individual ATS category score schema
 */
export const atsCategoryScoreSchema = z.object({
    category: z.string(),
    rating: z.number().min(0).max(100),
    weight: z.number().positive(),
    earnedPoints: z.number().min(0),
    status: z.enum(["evaluated", "not_applicable", "not_evaluable"]).default("evaluated"),
    explanation: z.string(),
    evidence: z.union([z.array(z.string()), z.record(z.any())]).default([]),
    limitations: z.array(z.string()).default([])
});

/**
 * Keyword findings detail schema
 */
export const keywordFindingsSchema = z.object({
    mode: z.enum(["general", "job_specific"]),
    generalKeywordsCount: z.number().int().nonnegative(),
    detectedGeneralKeywords: z.array(z.string()),
    jobSpecificMatching: z.object({
        enabled: z.boolean(),
        matchedKeywords: z.array(z.string()).default([]),
        missingKeywords: z.array(z.string()).default([]),
        matchPercentage: z.number().nullable().default(null),
        note: z.string().optional()
    })
});

/**
 * Master ATS Score Response Schema
 */
export const atsScoreResponseSchema = z.object({
    atsScore: z.number().min(0).max(100),
    ratingLabel: z.string(),
    scoringVersion: z.string().default("1.0.0"),
    applicableWeightTotal: z.number().positive().max(100),
    categories: z.object({
        fileCompatibility: atsCategoryScoreSchema,
        sectionDetection: atsCategoryScoreSchema,
        contactInfo: atsCategoryScoreSchema,
        keywordReadability: atsCategoryScoreSchema,
        structureConsistency: atsCategoryScoreSchema,
        extractionQuality: atsCategoryScoreSchema
    }),
    detectedSections: z.array(z.string()),
    missingSections: z.array(z.string()),
    keywordFindings: keywordFindingsSchema,
    textExtractionQuality: z.object({
        characterCount: z.number().int().nonnegative(),
        wordCount: z.number().int().nonnegative(),
        isReadable: z.boolean(),
        isScannedPdfSuspected: z.boolean()
    }),
    improvementSuggestions: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        priority: z.enum(["high", "medium", "low"]).default("medium")
    })),
    limitations: z.array(z.string()).default([])
});

export default {
    atsCategoryScoreSchema,
    keywordFindingsSchema,
    atsScoreResponseSchema,
    getAtsRatingLabel
};
