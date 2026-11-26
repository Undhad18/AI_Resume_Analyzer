import { z } from "zod";

/**
 * Supported scopes and sections for resume enhancement (Lesson 7.4)
 */
export const ENHANCEMENT_MODES_ENUM = ["free", "advanced"];
export const ENHANCEMENT_SCOPES_ENUM = ["full_resume", "single_section"];
export const ENHANCEMENT_SECTIONS_ENUM = [
    "professionalSummary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements"
];
export const DRAFT_STATUS_ENUM = ["draft", "approved", "discarded"];

/**
 * Input validation schema for POST /api/resumes/:resumeId/enhance
 */
export const enhanceResumeInputSchema = z.object({
    mode: z.enum(ENHANCEMENT_MODES_ENUM).default("free"),
    scope: z.enum(ENHANCEMENT_SCOPES_ENUM).default("full_resume"),
    section: z.enum(ENHANCEMENT_SECTIONS_ENUM).optional(),
    targetJobDescription: z.string().max(10000).optional().default("")
}).refine(
    (data) => {
        if (data.scope === "single_section" && !data.section) {
            return false;
        }
        return true;
    },
    {
        message: "When scope is 'single_section', a valid 'section' identifier is required.",
        path: ["section"]
    }
);

/**
 * Input validation schema for updating an existing enhanced draft
 */
export const updateDraftInputSchema = z.object({
    enhancedContent: z.record(z.any()),
    changesSummary: z.string().max(2000).optional()
});

/**
 * Section diff comparison schema
 */
export const sectionDiffItemSchema = z.object({
    sectionName: z.enum(ENHANCEMENT_SECTIONS_ENUM),
    original: z.any(),
    enhanced: z.any(),
    changes: z.array(z.string()),
    isModified: z.boolean()
});

/**
 * Schema for single enhanced section output from AI / Free Engine
 */
export const enhancedSectionSchema = z.object({
    sectionName: z.enum(ENHANCEMENT_SECTIONS_ENUM),
    enhancedContent: z.any(),
    changes: z.array(z.string()).default([])
});

/**
 * Full enhancement response schema
 */
export const resumeEnhancementResponseSchema = z.object({
    draftId: z.number().int().positive().optional(),
    resumeId: z.number().int().positive(),
    userId: z.number().int().positive(),
    enhancementMode: z.enum(ENHANCEMENT_MODES_ENUM),
    scope: z.enum(ENHANCEMENT_SCOPES_ENUM),
    sectionName: z.enum(ENHANCEMENT_SECTIONS_ENUM).nullable().optional(),
    originalContent: z.record(z.any()),
    enhancedContent: z.record(z.any()),
    sectionsDiff: z.array(sectionDiffItemSchema),
    changesSummary: z.string().min(1),
    status: z.enum(DRAFT_STATUS_ENUM).default("draft"),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

/**
 * OpenAI Structured Outputs JSON Schema config (Responses API)
 */
export const resumeEnhancementOpenAiFormatConfig = {
    type: "json_schema",
    json_schema: {
        name: "resume_enhancement_response",
        strict: true,
        schema: {
            type: "object",
            properties: {
                changesSummary: {
                    type: "string",
                    description: "High-level summary of professional wording, structure, and clarity improvements applied without altering factual reality."
                },
                enhancedSections: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            sectionName: {
                                type: "string",
                                enum: ENHANCEMENT_SECTIONS_ENUM
                            },
                            enhancedTextContent: {
                                type: "string",
                                description: "The enhanced section text or serialized content in clean, professional phrasing."
                            },
                            changesApplied: {
                                type: "array",
                                items: { type: "string" },
                                description: "Specific list of wording, flow, or action-verb enhancements made."
                            }
                        },
                        required: ["sectionName", "enhancedTextContent", "changesApplied"],
                        additionalProperties: false
                    }
                }
            },
            required: ["changesSummary", "enhancedSections"],
            additionalProperties: false
        }
    }
};

export default {
    ENHANCEMENT_MODES_ENUM,
    ENHANCEMENT_SCOPES_ENUM,
    ENHANCEMENT_SECTIONS_ENUM,
    DRAFT_STATUS_ENUM,
    enhanceResumeInputSchema,
    updateDraftInputSchema,
    sectionDiffItemSchema,
    enhancedSectionSchema,
    resumeEnhancementResponseSchema,
    resumeEnhancementOpenAiFormatConfig
};
