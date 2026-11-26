import { z } from "zod";

/**
 * Reusable parameter score schema for internal evaluation dimensions
 */
export const parameterScoreSchema = z.object({
    name: z.string(),
    weight: z.number().min(0).max(100),
    rating: z.number().min(0).max(100),
    earnedPoints: z.number().min(0).max(100),
    explanation: z.string(),
    evidence: z.array(z.string()).default([])
});

/**
 * Detailed Skills Scoring Schema
 * Overall Category Weight: 20 points
 * Internal Rating: 0–100
 */
export const skillsScoreSchema = z.object({
    category: z.literal("Skills"),
    rating: z.number().min(0).max(100),
    weight: z.literal(20),
    earnedPoints: z.number().min(0).max(20),
    status: z.enum(["evaluated", "needs_attention", "not_evaluable"]).default("evaluated"),
    parameters: z.object({
        identification: parameterScoreSchema,
        organization: parameterScoreSchema,
        evidence: parameterScoreSchema,
        clarity: parameterScoreSchema,
        coverage: parameterScoreSchema
    }),
    detectedSkills: z.array(z.string()).default([]),
    normalizedSkills: z.array(z.string()).default([]),
    categorizedSkills: z.record(z.array(z.string())).default({}),
    evidenceSupportedSkills: z.array(z.string()).default([]),
    listedOnlySkills: z.array(z.string()).default([]),
    findings: z.array(z.string()).default([]),
    evidence: z.array(z.string()).default([]),
    limitations: z.array(z.string()).default([])
});

/**
 * Detailed Education Scoring Schema
 * Overall Category Weight: 10 points
 * Internal Rating: 0–100
 */
export const educationScoreSchema = z.object({
    category: z.literal("Education"),
    rating: z.number().min(0).max(100),
    weight: z.literal(10),
    earnedPoints: z.number().min(0).max(10),
    status: z.enum(["evaluated", "needs_attention", "not_evaluable"]).default("evaluated"),
    parameters: z.object({
        qualificationDetails: parameterScoreSchema,
        institutionInformation: parameterScoreSchema,
        fieldOrSpecialization: parameterScoreSchema,
        graduationDates: parameterScoreSchema,
        sectionClarity: parameterScoreSchema
    }),
    qualifications: z.array(z.object({
        degree: z.string().nullable().default(null),
        institution: z.string().nullable().default(null),
        fieldOfStudy: z.string().nullable().default(null),
        startDate: z.string().nullable().default(null),
        endDate: z.string().nullable().default(null),
        grade: z.string().nullable().default(null),
        isComplete: z.boolean().default(true)
    })).default([]),
    findings: z.array(z.string()).default([]),
    evidence: z.array(z.string()).default([]),
    limitations: z.array(z.string()).default([])
});

/**
 * Detailed Experience Scoring Schema
 * Overall Category Weight: 20 points
 * Internal Rating: 0–100
 */
export const experienceScoreSchema = z.object({
    category: z.literal("Experience"),
    rating: z.number().min(0).max(100),
    weight: z.literal(20),
    earnedPoints: z.number().min(0).max(20),
    status: z.enum(["evaluated", "needs_attention", "not_evaluable", "not_applicable_fresher"]).default("evaluated"),
    fresherPolicyApplied: z.boolean().default(false),
    fresherPolicyDetails: z.object({
        isFresher: z.boolean(),
        hasInternships: z.boolean(),
        hasProjects: z.boolean(),
        policyNote: z.string()
    }),
    parameters: z.object({
        roleResponsibilityClarity: parameterScoreSchema,
        achievementImpactEvidence: parameterScoreSchema,
        descriptionQuality: parameterScoreSchema,
        relevantTechnologies: parameterScoreSchema,
        timelineClarity: parameterScoreSchema
    }),
    roles: z.array(z.object({
        title: z.string().nullable().default(null),
        company: z.string().nullable().default(null),
        duration: z.string().nullable().default(null),
        isCurrent: z.boolean().default(false),
        isInternship: z.boolean().default(false),
        technologies: z.array(z.string()).default([]),
        responsibilitiesCount: z.number().int().nonnegative().default(0),
        achievementsCount: z.number().int().nonnegative().default(0)
    })).default([]),
    findings: z.array(z.string()).default([]),
    evidence: z.array(z.string()).default([]),
    limitations: z.array(z.string()).default([])
});

/**
 * Master Detailed Resume Score Response Schema
 */
export const detailedResumeScoreResponseSchema = z.object({
    resumeId: z.number().int().positive(),
    userId: z.number().int().positive(),
    overallScore: z.number().min(0).max(100),
    scoringVersion: z.string().default("1.1.0"),
    scoredAt: z.string(),
    fresherPolicyApplied: z.boolean().default(false),
    categories: z.object({
        skills: skillsScoreSchema,
        education: educationScoreSchema,
        experience: experienceScoreSchema
    }),
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
    summaryNotes: z.array(z.string()).default([])
});

export default {
    parameterScoreSchema,
    skillsScoreSchema,
    educationScoreSchema,
    experienceScoreSchema,
    detailedResumeScoreResponseSchema
};
