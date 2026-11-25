import { z } from "zod";

/**
 * Zod Schema for Comprehensive Resume Analysis (Lesson 5.5)
 */

export const resumeOverviewSchema = z.object({
    summary: z.string().min(1, "Summary is required"),
    professionalProfile: z.string().default(""),
    detectedCareerLevel: z.string().default("Mid-Level"),
    targetRoles: z.array(z.string()).default([])
});

export const foundSkillSchema = z.object({
    skill: z.string().min(1, "Skill is required"),
    category: z.string().default("Technical"),
    evidence: z.string().default("")
});

export const skillGapSchema = z.object({
    skill: z.string().min(1, "Skill gap is required"),
    reason: z.string().default("")
});

export const skillsAnalysisSchema = z.object({
    foundSkills: z.array(foundSkillSchema).default([]),
    skillGaps: z.array(skillGapSchema).default([]),
    skillsSummary: z.string().default("")
});

export const sectionAnalysisSchema = z.object({
    summary: z.string().default(""),
    strengths: z.array(z.string()).default([]),
    improvements: z.array(z.string()).default([])
});

export const educationAnalysisSchema = z.object({
    summary: z.string().default(""),
    observations: z.array(z.string()).default([])
});

export const strengthItemSchema = z.object({
    title: z.string().min(1, "Strength title is required"),
    description: z.string().default(""),
    evidence: z.string().default("")
});

export const weaknessItemSchema = z.object({
    title: z.string().min(1, "Weakness title is required"),
    description: z.string().default(""),
    suggestion: z.string().default(""),
    evidence: z.string().default("")
});

export const missingInfoItemSchema = z.object({
    field: z.string().min(1, "Field name is required"),
    reason: z.string().default("")
});

export const improvementSuggestionSchema = z.object({
    area: z.string().min(1, "Area is required"),
    suggestion: z.string().min(1, "Suggestion is required"),
    priority: z.enum(["high", "medium", "low"]).default("medium")
});

export const completeResumeAnalysisZodSchema = z.object({
    resumeOverview: resumeOverviewSchema,
    skillsAnalysis: skillsAnalysisSchema,
    experienceAnalysis: sectionAnalysisSchema,
    educationAnalysis: educationAnalysisSchema,
    projectsAnalysis: sectionAnalysisSchema,
    strengths: z.array(strengthItemSchema).default([]),
    weaknesses: z.array(weaknessItemSchema).default([]),
    missingInformation: z.array(missingInfoItemSchema).default([]),
    improvementSuggestions: z.array(improvementSuggestionSchema).default([]),
    analysisLimitations: z.array(z.string()).default([])
});

/**
 * Strict JSON Schema definition for OpenAI Responses API
 * Must obey OpenAI strict schema mode:
 * 1. additionalProperties: false on all object types
 * 2. required array lists every property defined in properties
 */
export const completeResumeAnalysisFormatConfig = {
    type: "json_schema",
    name: "complete_resume_analysis",
    strict: true,
    schema: {
        type: "object",
        properties: {
            resumeOverview: {
                type: "object",
                properties: {
                    summary: { type: "string", description: "Executive summary of the candidate's career trajectory" },
                    professionalProfile: { type: "string", description: "Identified candidate persona and domain specialization" },
                    detectedCareerLevel: { type: "string", description: "Inferred career tier: Entry-Level, Mid-Level, Senior, Lead, or Executive" },
                    targetRoles: {
                        type: "array",
                        items: { type: "string" },
                        description: "Top recommended job titles suited for this candidate"
                    }
                },
                required: ["summary", "professionalProfile", "detectedCareerLevel", "targetRoles"],
                additionalProperties: false
            },
            skillsAnalysis: {
                type: "object",
                properties: {
                    foundSkills: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                skill: { type: "string" },
                                category: { type: "string", description: "Technical, Domain, Soft, or Tool" },
                                evidence: { type: "string", description: "Direct context or project from the resume validating this skill" }
                            },
                            required: ["skill", "category", "evidence"],
                            additionalProperties: false
                        }
                    },
                    skillGaps: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                skill: { type: "string" },
                                reason: { type: "string", description: "Why this skill is expected but missing or unverified" }
                            },
                            required: ["skill", "reason"],
                            additionalProperties: false
                        }
                    },
                    skillsSummary: { type: "string", description: "Holistic evaluation of technical competency and breadth" }
                },
                required: ["foundSkills", "skillGaps", "skillsSummary"],
                additionalProperties: false
            },
            experienceAnalysis: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    strengths: { type: "array", items: { type: "string" } },
                    improvements: { type: "array", items: { type: "string" } }
                },
                required: ["summary", "strengths", "improvements"],
                additionalProperties: false
            },
            educationAnalysis: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    observations: { type: "array", items: { type: "string" } }
                },
                required: ["summary", "observations"],
                additionalProperties: false
            },
            projectsAnalysis: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    strengths: { type: "array", items: { type: "string" } },
                    improvements: { type: "array", items: { type: "string" } }
                },
                required: ["summary", "strengths", "improvements"],
                additionalProperties: false
            },
            strengths: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        evidence: { type: "string" }
                    },
                    required: ["title", "description", "evidence"],
                    additionalProperties: false
                }
            },
            weaknesses: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        suggestion: { type: "string" },
                        evidence: { type: "string" }
                    },
                    required: ["title", "description", "suggestion", "evidence"],
                    additionalProperties: false
                }
            },
            missingInformation: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        field: { type: "string" },
                        reason: { type: "string" }
                    },
                    required: ["field", "reason"],
                    additionalProperties: false
                }
            },
            improvementSuggestions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        area: { type: "string" },
                        suggestion: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] }
                    },
                    required: ["area", "suggestion", "priority"],
                    additionalProperties: false
                }
            },
            analysisLimitations: {
                type: "array",
                items: { type: "string" },
                description: "Caveats regarding unverified claims or omitted resume dates/details"
            }
        },
        required: [
            "resumeOverview",
            "skillsAnalysis",
            "experienceAnalysis",
            "educationAnalysis",
            "projectsAnalysis",
            "strengths",
            "weaknesses",
            "missingInformation",
            "improvementSuggestions",
            "analysisLimitations"
        ],
        additionalProperties: false
    }
};

export default {
    completeResumeAnalysisZodSchema,
    completeResumeAnalysisFormatConfig
};
