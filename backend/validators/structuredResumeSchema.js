import { z } from "zod";

/**
 * Personal Information Schema
 */
export const personalInfoSchema = z.object({
    fullName: z.string().nullable().default(null),
    email: z.string().email().nullable().default(null),
    phone: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    linkedin: z.string().url().nullable().default(null),
    github: z.string().url().nullable().default(null),
    portfolio: z.string().url().nullable().default(null)
});

/**
 * Work Experience Entry Schema
 */
export const experienceEntrySchema = z.object({
    jobTitle: z.string().nullable().default(null),
    company: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    startDate: z.string().nullable().default(null),
    endDate: z.string().nullable().default(null),
    isCurrent: z.boolean().default(false),
    description: z.string().nullable().default(null)
});

/**
 * Education Entry Schema
 */
export const educationEntrySchema = z.object({
    degree: z.string().nullable().default(null),
    fieldOfStudy: z.string().nullable().default(null),
    institution: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    startDate: z.string().nullable().default(null),
    endDate: z.string().nullable().default(null),
    grade: z.string().nullable().default(null)
});

/**
 * Project Entry Schema
 */
export const projectEntrySchema = z.object({
    projectName: z.string().nullable().default(null),
    description: z.string().nullable().default(null),
    technologies: z.array(z.string()).default([]),
    projectUrl: z.string().url().nullable().default(null)
});

/**
 * Certification Entry Schema
 */
export const certificationEntrySchema = z.object({
    name: z.string().nullable().default(null),
    issuingOrganization: z.string().nullable().default(null),
    issueDate: z.string().nullable().default(null),
    credentialUrl: z.string().url().nullable().default(null)
});

/**
 * Additional / Custom Unclassified Section Schema
 */
export const additionalSectionSchema = z.object({
    heading: z.string(),
    content: z.string()
});

/**
 * Metadata Schema
 */
export const resumeMetadataSchema = z.object({
    sourceType: z.enum(["pdf", "docx", "unknown"]).default("unknown"),
    characterCount: z.number().int().nonnegative().default(0),
    wordCount: z.number().int().nonnegative().default(0),
    parserVersion: z.string().nullable().default("1.0.0")
});

/**
 * Unified Structured Resume Master Schema
 */
export const structuredResumeSchema = z.object({
    personalInfo: personalInfoSchema.default({}),
    professionalSummary: z.string().nullable().default(null),
    skills: z.array(z.string()).default([]),
    experience: z.array(experienceEntrySchema).default([]),
    education: z.array(educationEntrySchema).default([]),
    projects: z.array(projectEntrySchema).default([]),
    certifications: z.array(certificationEntrySchema).default([]),
    languages: z.array(z.string()).default([]),
    achievements: z.array(z.string()).default([]),
    additionalSections: z.array(additionalSectionSchema).default([]),
    metadata: resumeMetadataSchema.default({})
});

export default structuredResumeSchema;
