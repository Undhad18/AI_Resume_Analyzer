import { z } from "zod";

/**
 * Standard 10 Skill Categories
 */
export const SKILL_CATEGORIES_ENUM = [
    "programming_languages",
    "frontend",
    "backend",
    "database",
    "tools",
    "cloud",
    "devops",
    "testing",
    "soft_skills",
    "domain_skills"
];

/**
 * Match statuses for skills and keywords comparison
 */
export const MATCH_STATUS_ENUM = [
    "matched",
    "partial_match",
    "not_detected",
    "not_applicable"
];

/**
 * Importance levels for skills and keywords
 */
export const IMPORTANCE_ENUM = [
    "required",
    "preferred",
    "optional"
];

/**
 * Evidence verification status for detected skills
 */
export const EVIDENCE_STATUS_ENUM = [
    "explicit_and_applied",
    "explicit_only",
    "applied_only",
    "inferred"
];

/**
 * Detection mode
 */
export const DETECTION_MODE_ENUM = [
    "general",
    "job_specific"
];

/**
 * Source section in resume
 */
export const SOURCE_SECTION_ENUM = [
    "skills",
    "summary",
    "experience",
    "projects",
    "education",
    "certifications",
    "job_description"
];

/**
 * Single Detected Skill Schema
 */
export const detectedSkillSchema = z.object({
    skill: z.string().min(1),
    normalizedName: z.string().min(1),
    category: z.enum(SKILL_CATEGORIES_ENUM),
    sourceSection: z.enum(SOURCE_SECTION_ENUM),
    evidence: z.array(z.string()).default([]),
    evidenceStatus: z.enum(EVIDENCE_STATUS_ENUM)
});

/**
 * Missing Skill Item Schema (Job-Specific Mode)
 */
export const missingSkillSchema = z.object({
    skill: z.string().min(1),
    normalizedName: z.string().min(1),
    category: z.enum(SKILL_CATEGORIES_ENUM),
    importance: z.enum(IMPORTANCE_ENUM),
    reason: z.string().min(1),
    suggestion: z.string().min(1)
});

/**
 * Keyword Match Item Schema
 */
export const keywordMatchSchema = z.object({
    term: z.string().min(1),
    normalizedTerm: z.string().min(1),
    category: z.string().default("general"),
    source: z.string().default("resume"),
    evidence: z.array(z.string()).default([]),
    matchStatus: z.enum(MATCH_STATUS_ENUM),
    importance: z.enum(IMPORTANCE_ENUM).default("optional")
});

/**
 * Partial Match Item Schema
 */
export const partialMatchSchema = z.object({
    term: z.string().min(1),
    normalizedTerm: z.string().min(1),
    category: z.string().default("general"),
    partialEvidence: z.array(z.string()).min(1),
    gapReason: z.string().min(1),
    suggestion: z.string().min(1),
    importance: z.enum(IMPORTANCE_ENUM).default("preferred")
});

/**
 * Master Skills & Keywords Analysis Response Schema
 */
export const skillsKeywordsResponseSchema = z.object({
    resumeId: z.number(),
    userId: z.number(),
    analysisMode: z.enum(["free", "ai"]),
    detectionMode: z.enum(DETECTION_MODE_ENUM),
    detectedSkills: z.array(detectedSkillSchema),
    missingSkills: z.array(missingSkillSchema).default([]),
    matchedKeywords: z.array(keywordMatchSchema).default([]),
    missingKeywords: z.array(keywordMatchSchema).default([]),
    partialMatches: z.array(partialMatchSchema).default([]),
    skillCategories: z.record(z.array(z.string())).default({}),
    summary: z.string(),
    limitations: z.array(z.string()).default([]),
    jobDescriptionSnippet: z.string().nullable().optional(),
    analyzedAt: z.string().optional()
});

/**
 * Job Description Validation Schema
 */
export const jobDescriptionInputSchema = z.object({
    mode: z.enum(DETECTION_MODE_ENUM).default("general"),
    jobDescription: z.string().max(50000, "Job description exceeds 50,000 character bound").optional(),
    analysisMode: z.enum(["free", "ai"]).default("free")
});

/**
 * OpenAI Responses API format configuration
 */
export const skillsKeywordsOpenAiFormatConfig = {
    type: "json_schema",
    json_schema: {
        name: "skills_and_keywords_detection",
        strict: true,
        schema: {
            type: "object",
            properties: {
                detectedSkills: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            skill: { type: "string" },
                            normalizedName: { type: "string" },
                            category: { type: "string", enum: SKILL_CATEGORIES_ENUM },
                            sourceSection: { type: "string", enum: SOURCE_SECTION_ENUM },
                            evidence: { type: "array", items: { type: "string" } },
                            evidenceStatus: { type: "string", enum: EVIDENCE_STATUS_ENUM }
                        },
                        required: ["skill", "normalizedName", "category", "sourceSection", "evidence", "evidenceStatus"],
                        additionalProperties: false
                    }
                },
                missingSkills: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            skill: { type: "string" },
                            normalizedName: { type: "string" },
                            category: { type: "string", enum: SKILL_CATEGORIES_ENUM },
                            importance: { type: "string", enum: IMPORTANCE_ENUM },
                            reason: { type: "string" },
                            suggestion: { type: "string" }
                        },
                        required: ["skill", "normalizedName", "category", "importance", "reason", "suggestion"],
                        additionalProperties: false
                    }
                },
                matchedKeywords: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            term: { type: "string" },
                            normalizedTerm: { type: "string" },
                            category: { type: "string" },
                            source: { type: "string" },
                            evidence: { type: "array", items: { type: "string" } },
                            matchStatus: { type: "string", enum: MATCH_STATUS_ENUM },
                            importance: { type: "string", enum: IMPORTANCE_ENUM }
                        },
                        required: ["term", "normalizedTerm", "category", "source", "evidence", "matchStatus", "importance"],
                        additionalProperties: false
                    }
                },
                missingKeywords: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            term: { type: "string" },
                            normalizedTerm: { type: "string" },
                            category: { type: "string" },
                            source: { type: "string" },
                            evidence: { type: "array", items: { type: "string" } },
                            matchStatus: { type: "string", enum: MATCH_STATUS_ENUM },
                            importance: { type: "string", enum: IMPORTANCE_ENUM }
                        },
                        required: ["term", "normalizedTerm", "category", "source", "evidence", "matchStatus", "importance"],
                        additionalProperties: false
                    }
                },
                partialMatches: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            term: { type: "string" },
                            normalizedTerm: { type: "string" },
                            category: { type: "string" },
                            partialEvidence: { type: "array", items: { type: "string" } },
                            gapReason: { type: "string" },
                            suggestion: { type: "string" },
                            importance: { type: "string", enum: IMPORTANCE_ENUM }
                        },
                        required: ["term", "normalizedTerm", "category", "partialEvidence", "gapReason", "suggestion", "importance"],
                        additionalProperties: false
                    }
                },
                summary: { type: "string" },
                limitations: { type: "array", items: { type: "string" } }
            },
            required: ["detectedSkills", "missingSkills", "matchedKeywords", "missingKeywords", "partialMatches", "summary", "limitations"],
            additionalProperties: false
        }
    }
};

export default {
    SKILL_CATEGORIES_ENUM,
    MATCH_STATUS_ENUM,
    IMPORTANCE_ENUM,
    EVIDENCE_STATUS_ENUM,
    DETECTION_MODE_ENUM,
    SOURCE_SECTION_ENUM,
    detectedSkillSchema,
    missingSkillSchema,
    keywordMatchSchema,
    partialMatchSchema,
    skillsKeywordsResponseSchema,
    jobDescriptionInputSchema,
    skillsKeywordsOpenAiFormatConfig
};
