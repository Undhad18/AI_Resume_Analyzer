import { z } from "zod";

/**
 * 10 Standard Suggestion Categories (Lesson 7.3)
 */
export const SUGGESTION_CATEGORIES_ENUM = [
    "professional_summary",
    "skills",
    "work_experience",
    "education",
    "projects",
    "certifications",
    "keywords",
    "formatting",
    "grammar",
    "completeness"
];

export const SUGGESTION_PRIORITY_ENUM = ["high", "medium", "low"];
export const SUGGESTION_SOURCE_ENUM = ["rule_based", "ai_generated"];
export const SUGGESTION_STATUS_ENUM = ["pending", "accepted", "completed", "dismissed"];

/**
 * Optional concrete Before / After transformation example
 */
export const suggestionExampleSchema = z.object({
    before: z.string().nullable().optional(),
    after: z.string().nullable().optional()
}).nullable().optional();

/**
 * Single Improvement Suggestion Schema
 */
export const singleSuggestionSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(3).max(250),
    category: z.enum(SUGGESTION_CATEGORIES_ENUM),
    priority: z.enum(SUGGESTION_PRIORITY_ENUM),
    problem: z.string().min(5),
    whyItMatters: z.string().min(5),
    recommendedAction: z.string().min(5),
    evidence: z.union([
        z.string().min(1),
        z.array(z.string().min(1))
    ]),
    example: suggestionExampleSchema,
    source: z.enum(SUGGESTION_SOURCE_ENUM).default("rule_based"),
    confidence: z.number().min(0).max(1),
    status: z.enum(SUGGESTION_STATUS_ENUM).default("pending")
});

/**
 * Input request validation schema for generating suggestions
 */
export const generateSuggestionsInputSchema = z.object({
    mode: z.enum(["free", "advanced"]).default("free"),
    jobDescription: z.string().max(10000).optional().default("")
});

/**
 * Input request schema for updating suggestion status
 */
export const updateSuggestionStatusSchema = z.object({
    status: z.enum(SUGGESTION_STATUS_ENUM)
});

/**
 * Complete Response Schema for Improvement Suggestions
 */
export const improvementSuggestionsResponseSchema = z.object({
    resumeId: z.number().int().positive(),
    userId: z.number().int().positive(),
    generationMode: z.enum(["free", "advanced"]),
    totalSuggestions: z.number().int().nonnegative(),
    highPriorityCount: z.number().int().nonnegative(),
    mediumPriorityCount: z.number().int().nonnegative(),
    lowPriorityCount: z.number().int().nonnegative(),
    categoryCounts: z.record(z.string(), z.number().int().nonnegative()),
    priorityCounts: z.record(z.string(), z.number().int().nonnegative()),
    suggestions: z.array(singleSuggestionSchema),
    summary: z.string().min(1),
    generatedAt: z.string().datetime().optional()
});

/**
 * OpenAI Structured Outputs JSON Schema config (Responses API / Tools)
 */
export const improvementSuggestionsOpenAiFormatConfig = {
    type: "json_schema",
    json_schema: {
        name: "resume_improvement_suggestions_response",
        strict: true,
        schema: {
            type: "object",
            properties: {
                summary: {
                    type: "string",
                    description: "High-level constructive executive summary of top improvement areas"
                },
                suggestions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            category: {
                                type: "string",
                                enum: SUGGESTION_CATEGORIES_ENUM
                            },
                            priority: {
                                type: "string",
                                enum: SUGGESTION_PRIORITY_ENUM
                            },
                            problem: { type: "string" },
                            whyItMatters: { type: "string" },
                            recommendedAction: { type: "string" },
                            evidence: {
                                type: "array",
                                items: { type: "string" }
                            },
                            example: {
                                type: "object",
                                properties: {
                                    before: { type: ["string", "null"] },
                                    after: { type: ["string", "null"] }
                                },
                                required: ["before", "after"],
                                additionalProperties: false
                            },
                            source: {
                                type: "string",
                                enum: ["ai_generated"]
                            },
                            confidence: {
                                type: "number",
                                description: "Confidence score between 0.0 and 1.0"
                            },
                            status: {
                                type: "string",
                                enum: ["pending"]
                            }
                        },
                        required: [
                            "id",
                            "title",
                            "category",
                            "priority",
                            "problem",
                            "whyItMatters",
                            "recommendedAction",
                            "evidence",
                            "example",
                            "source",
                            "confidence",
                            "status"
                        ],
                        additionalProperties: false
                    }
                }
            },
            required: ["summary", "suggestions"],
            additionalProperties: false
        }
    }
};

export default {
    SUGGESTION_CATEGORIES_ENUM,
    SUGGESTION_PRIORITY_ENUM,
    SUGGESTION_SOURCE_ENUM,
    SUGGESTION_STATUS_ENUM,
    singleSuggestionSchema,
    generateSuggestionsInputSchema,
    updateSuggestionStatusSchema,
    improvementSuggestionsResponseSchema,
    improvementSuggestionsOpenAiFormatConfig
};
