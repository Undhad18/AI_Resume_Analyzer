import { z } from "zod";

/**
 * Finding item schema for individual formatting or grammar issues
 */
export const findingItemSchema = z.object({
    type: z.enum(["spelling", "grammar", "formatting", "readability", "style", "artifact"]),
    issue: z.string(),
    explanation: z.string(),
    evidence: z.string().default(""),
    suggestion: z.string().default(""),
    severity: z.enum(["high", "medium", "low", "info"]).default("medium")
});

/**
 * Parameter score breakdown schema
 */
export const scoringParameterSchema = z.object({
    name: z.string(),
    weight: z.number().min(0).max(100),
    rating: z.number().min(0).max(100),
    earnedPoints: z.number().min(0).max(100),
    explanation: z.string(),
    findings: z.array(findingItemSchema).default([])
});

/**
 * Formatting Evaluation Schema (0–100)
 * Internal weights:
 * 1. Heading Consistency: 20%
 * 2. Section Organization: 20%
 * 3. Bullet Point Structure: 15%
 * 4. Date and Text Consistency: 15%
 * 5. Readability: 20%
 * 6. Special Characters and Extraction Issues: 10%
 * Total = 100%
 */
export const formattingScoreSchema = z.object({
    category: z.literal("Formatting & Layout"),
    rating: z.number().min(0).max(100),
    status: z.enum(["evaluated", "needs_attention", "not_evaluable"]).default("evaluated"),
    parameters: z.object({
        headingConsistency: scoringParameterSchema,
        sectionOrganization: scoringParameterSchema,
        bulletStructure: scoringParameterSchema,
        dateConsistency: scoringParameterSchema,
        readability: scoringParameterSchema,
        specialCharacters: scoringParameterSchema
    }),
    findings: z.array(findingItemSchema).default([]),
    limitations: z.array(z.string()).default([])
});

/**
 * Grammar & Language Evaluation Schema (0–100)
 * Internal weights:
 * 1. Spelling Accuracy: 25%
 * 2. Grammar Correctness: 25%
 * 3. Sentence Structure: 20%
 * 4. Professional Language: 15%
 * 5. Clarity and Conciseness: 15%
 * Total = 100%
 */
export const grammarScoreSchema = z.object({
    category: z.literal("Grammar & Language"),
    rating: z.number().min(0).max(100),
    status: z.enum(["evaluated", "needs_attention", "not_evaluable"]).default("evaluated"),
    parameters: z.object({
        spelling: scoringParameterSchema,
        grammar: scoringParameterSchema,
        sentenceStructure: scoringParameterSchema,
        professionalLanguage: scoringParameterSchema,
        clarity: scoringParameterSchema
    }),
    findings: z.array(findingItemSchema).default([]),
    limitations: z.array(z.string()).default([])
});

/**
 * Master Formatting & Grammar API Response Schema
 */
export const formattingGrammarScoreResponseSchema = z.object({
    resumeId: z.number().int().positive(),
    userId: z.number().int().positive(),
    analysisMode: z.enum(["free", "ai"]).default("free"),
    scoringVersion: z.string().default("1.2.0"),
    formattingScore: z.number().min(0).max(100),
    grammarScore: z.number().min(0).max(100),
    overallScore: z.number().min(0).max(100),
    formatting: formattingScoreSchema,
    grammar: grammarScoreSchema,
    integratedOverallBreakdown: z.object({
        contentQuality: z.number().min(0).max(25),
        skills: z.number().min(0).max(20),
        experience: z.number().min(0).max(20),
        projects: z.number().min(0).max(15),
        education: z.number().min(0).max(10),
        clarity: z.number().min(0).max(10),
        totalScore: z.number().min(0).max(100),
        isNormalized: z.boolean().default(false)
    }),
    summaryNotes: z.array(z.string()).default([]),
    scoredAt: z.string()
});

export default {
    findingItemSchema,
    scoringParameterSchema,
    formattingScoreSchema,
    grammarScoreSchema,
    formattingGrammarScoreResponseSchema
};
