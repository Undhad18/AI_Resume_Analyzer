import { z } from "zod";

/**
 * Controlled category enums for strengths, weaknesses, and recommendations
 */
export const CATEGORY_ENUM = [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "structure",
    "formatting",
    "readability",
    "contact_information"
];

export const IMPORTANCE_ENUM = ["high", "medium", "low"];
export const IMPACT_ENUM = ["high", "medium", "low"];
export const CONFIDENCE_ENUM = ["high", "medium", "low"];

/**
 * Strength Finding Schema
 */
export const strengthFindingSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    category: z.enum(CATEGORY_ENUM),
    evidence: z.array(z.string().min(1)).min(1),
    importance: z.enum(IMPORTANCE_ENUM),
    confidence: z.enum(CONFIDENCE_ENUM)
});

/**
 * Weakness Finding Schema (Potential Improvement Area)
 */
export const weaknessFindingSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    category: z.enum(CATEGORY_ENUM),
    evidence: z.array(z.string().min(1)).min(1),
    impact: z.enum(IMPACT_ENUM),
    confidence: z.enum(CONFIDENCE_ENUM),
    suggestion: z.string().min(1)
});

/**
 * Missing Information Finding Schema
 */
export const missingInfoFindingSchema = z.object({
    field: z.string().min(1),
    reason: z.string().min(1),
    importance: z.enum(IMPORTANCE_ENUM)
});

/**
 * Complete Master Schema for Lesson 7.1 Response
 */
export const strengthsWeaknessesResponseSchema = z.object({
    resumeId: z.number(),
    userId: z.number(),
    analysisMode: z.enum(["free", "ai"]),
    strengths: z.array(strengthFindingSchema),
    weaknesses: z.array(weaknessFindingSchema),
    missingInformation: z.array(missingInfoFindingSchema),
    analysisSummary: z.string(),
    limitations: z.array(z.string()),
    analyzedAt: z.string().optional()
});

/**
 * OpenAI Responses API structured output configuration
 */
export const strengthsWeaknessesOpenAiFormatConfig = {
    type: "json_schema",
    json_schema: {
        name: "resume_strengths_and_weaknesses",
        strict: true,
        schema: {
            type: "object",
            properties: {
                strengths: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            description: { type: "string" },
                            category: {
                                type: "string",
                                enum: CATEGORY_ENUM
                            },
                            evidence: {
                                type: "array",
                                items: { type: "string" }
                            },
                            importance: {
                                type: "string",
                                enum: IMPORTANCE_ENUM
                            },
                            confidence: {
                                type: "string",
                                enum: CONFIDENCE_ENUM
                            }
                        },
                        required: ["id", "title", "description", "category", "evidence", "importance", "confidence"],
                        additionalProperties: false
                    }
                },
                weaknesses: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            description: { type: "string" },
                            category: {
                                type: "string",
                                enum: CATEGORY_ENUM
                            },
                            evidence: {
                                type: "array",
                                items: { type: "string" }
                            },
                            impact: {
                                type: "string",
                                enum: IMPACT_ENUM
                            },
                            confidence: {
                                type: "string",
                                enum: CONFIDENCE_ENUM
                            },
                            suggestion: { type: "string" }
                        },
                        required: ["id", "title", "description", "category", "evidence", "impact", "confidence", "suggestion"],
                        additionalProperties: false
                    }
                },
                missingInformation: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            field: { type: "string" },
                            reason: { type: "string" },
                            importance: {
                                type: "string",
                                enum: IMPORTANCE_ENUM
                            }
                        },
                        required: ["field", "reason", "importance"],
                        additionalProperties: false
                    }
                },
                analysisSummary: { type: "string" },
                limitations: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: ["strengths", "weaknesses", "missingInformation", "analysisSummary", "limitations"],
            additionalProperties: false
        }
    }
};

export default {
    CATEGORY_ENUM,
    IMPORTANCE_ENUM,
    IMPACT_ENUM,
    CONFIDENCE_ENUM,
    strengthFindingSchema,
    weaknessFindingSchema,
    missingInfoFindingSchema,
    strengthsWeaknessesResponseSchema,
    strengthsWeaknessesOpenAiFormatConfig
};
