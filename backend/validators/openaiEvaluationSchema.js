import { z } from "zod";

/**
 * Zod validation schema for Lesson 5.4 AI Resume Evaluation response contract
 */
export const resumeAiEvaluationZodSchema = z.object({
    summary: z
        .string()
        .min(1, "Summary must be a non-empty string"),
    identifiedSkills: z
        .array(z.string().min(1, "Skill name cannot be empty"))
        .default([]),
    missingInformation: z
        .array(z.string().min(1, "Missing info item cannot be empty"))
        .default([]),
    observations: z
        .array(z.string().min(1, "Observation cannot be empty"))
        .default([])
});

/**
 * Strict JSON Schema definition for OpenAI Responses API structured output
 * In Responses API, format object contains type: 'json_schema', name, strict, and schema.
 */
export const resumeAiEvaluationFormatConfig = {
    type: "json_schema",
    name: "resume_ai_evaluation",
    strict: true,
    schema: {
        type: "object",
        properties: {
            summary: {
                type: "string",
                description: "Concise 2-3 sentence overview of the resume candidate's background and core qualifications"
            },
            identifiedSkills: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "List of technical and professional skills clearly identified in the resume"
            },
            missingInformation: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Key resume sections or details that are missing, incomplete, or unverified"
            },
            observations: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Objective observations on document clarity, layout, and presentation"
            }
        },
        required: ["summary", "identifiedSkills", "missingInformation", "observations"],
        additionalProperties: false
    }
};

// Backward-compatible alias
export const resumeAiEvaluationJsonSchema = resumeAiEvaluationFormatConfig;

export default {
    resumeAiEvaluationZodSchema,
    resumeAiEvaluationFormatConfig,
    resumeAiEvaluationJsonSchema
};
