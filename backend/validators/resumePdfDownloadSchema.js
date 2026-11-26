/**
 * Zod Validation Schema for Resume PDF Download (Lesson 8.5)
 */

import { z } from "zod";

export const ALLOWED_PDF_TEMPLATES = ["modern", "classic", "minimal", "ats"];

export const resumePdfDownloadRequestSchema = z.object({
  selectedTemplate: z.enum(ALLOWED_PDF_TEMPLATES).default("modern"),
  resumeData: z
    .object({
      resumeTitle: z.string().max(200).optional().nullable(),
      personalInfo: z
        .object({
          fullName: z.string().max(150).optional().nullable(),
          email: z.string().max(150).optional().nullable(),
          phone: z.string().max(50).optional().nullable(),
          location: z.string().max(150).optional().nullable(),
          linkedIn: z.string().max(300).optional().nullable(),
          gitHub: z.string().max(300).optional().nullable(),
          portfolio: z.string().max(300).optional().nullable()
        })
        .optional()
        .default({}),
      professionalSummary: z.string().max(10000).optional().nullable().default(""),
      skills: z
        .array(
          z.union([
            z.string().max(100),
            z.object({ name: z.string().max(100) }).passthrough()
          ])
        )
        .optional()
        .default([]),
      experience: z
        .array(
          z
            .object({
              id: z.string().optional().nullable(),
              jobTitle: z.string().max(150).optional().nullable(),
              position: z.string().max(150).optional().nullable(),
              company: z.string().max(150).optional().nullable(),
              location: z.string().max(150).optional().nullable(),
              startDate: z.string().max(50).optional().nullable(),
              endDate: z.string().max(50).optional().nullable(),
              currentlyWorking: z.boolean().optional().nullable(),
              responsibilities: z.string().max(5000).optional().nullable(),
              achievements: z.string().max(3000).optional().nullable()
            })
            .passthrough()
        )
        .optional()
        .default([]),
      education: z
        .array(
          z
            .object({
              id: z.string().optional().nullable(),
              institution: z.string().max(150).optional().nullable(),
              degree: z.string().max(150).optional().nullable(),
              fieldOfStudy: z.string().max(150).optional().nullable(),
              startDate: z.string().max(50).optional().nullable(),
              endDate: z.string().max(50).optional().nullable(),
              graduationYear: z.string().max(50).optional().nullable(),
              grade: z.string().max(50).optional().nullable(),
              description: z.string().max(3000).optional().nullable()
            })
            .passthrough()
        )
        .optional()
        .default([]),
      projects: z
        .array(
          z
            .object({
              id: z.string().optional().nullable(),
              projectName: z.string().max(150).optional().nullable(),
              title: z.string().max(150).optional().nullable(),
              name: z.string().max(150).optional().nullable(),
              technologies: z.union([z.string().max(300), z.array(z.string())]).optional().nullable(),
              description: z.string().max(5000).optional().nullable(),
              projectUrl: z.string().max(300).optional().nullable(),
              startDate: z.string().max(50).optional().nullable(),
              endDate: z.string().max(50).optional().nullable()
            })
            .passthrough()
        )
        .optional()
        .default([]),
      certifications: z
        .array(
          z
            .object({
              id: z.string().optional().nullable(),
              certificationName: z.string().max(150).optional().nullable(),
              name: z.string().max(150).optional().nullable(),
              issuingOrganization: z.string().max(150).optional().nullable(),
              issuer: z.string().max(150).optional().nullable(),
              issueDate: z.string().max(50).optional().nullable(),
              credentialUrl: z.string().max(300).optional().nullable()
            })
            .passthrough()
        )
        .optional()
        .default([]),
      achievements: z
        .array(
          z
            .object({
              id: z.string().optional().nullable(),
              title: z.string().max(150).optional().nullable(),
              description: z.string().max(3000).optional().nullable(),
              date: z.string().max(50).optional().nullable()
            })
            .passthrough()
        )
        .optional()
        .default([])
    })
    .passthrough()
});
