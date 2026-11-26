import { z } from "zod";

/**
 * Valid sections supported for content generation
 */
export const VALID_SECTIONS = [
  "professionalSummary",
  "experience",
  "project",
  "skills",
  "education",
  "achievement"
];

/**
 * Valid tones supported for content generation
 */
export const VALID_TONES = [
  "professional",
  "concise",
  "technical",
  "achievement_focused"
];

/**
 * Valid generation modes
 */
export const VALID_MODES = ["free", "advanced"];

/**
 * Maximum character bounds for request safety
 */
export const MAX_INPUT_DATA_CHARS = 10000;

/**
 * Request validation schema for POST /api/resume-builder/generate-content
 */
export const generateContentRequestSchema = z.object({
  mode: z.enum(VALID_MODES).default("free"),
  section: z.enum(VALID_SECTIONS),
  tone: z.enum(VALID_TONES).default("professional"),
  data: z.record(z.any()).refine((data) => {
    return Object.keys(data).length > 0;
  }, {
    message: "Section data object cannot be empty."
  })
});

/**
 * Custom validator for ensuring sufficient user input per section
 * Returns { valid: boolean, error?: string }
 */
export const validateSectionInputSufficiency = (section, data) => {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Input data must be an object." };
  }

  const stringified = JSON.stringify(data);
  if (stringified.length > MAX_INPUT_DATA_CHARS) {
    return {
      valid: false,
      error: `Input data exceeds character limit of ${MAX_INPUT_DATA_CHARS} characters.`
    };
  }

  switch (section) {
    case "professionalSummary": {
      const hasRole = Boolean(data.targetRole && String(data.targetRole).trim().length > 0);
      const hasSummary = Boolean(data.currentSummary && String(data.currentSummary).trim().length > 0);
      const hasSkills = Array.isArray(data.skills) && data.skills.length > 0;
      const hasExperience = Array.isArray(data.experience) && data.experience.length > 0;
      const hasBio = Boolean(data.background && String(data.background).trim().length > 0);

      if (!hasRole && !hasSummary && !hasSkills && !hasExperience && !hasBio) {
        return {
          valid: false,
          error: "Please provide a target role, key skills, or existing summary points to generate a professional summary."
        };
      }
      return { valid: true };
    }

    case "experience": {
      const hasTitle = Boolean(data.jobTitle || data.position);
      const hasCompany = Boolean(data.company);
      const hasResponsibilities = Boolean(data.responsibilities && String(data.responsibilities).trim().length > 0);
      const hasAchievements = Boolean(data.achievements && String(data.achievements).trim().length > 0);

      if (!hasTitle && !hasCompany && !hasResponsibilities && !hasAchievements) {
        return {
          valid: false,
          error: "Please provide a job title, company name, or responsibility notes to generate experience descriptions."
        };
      }
      return { valid: true };
    }

    case "project": {
      const hasName = Boolean(data.projectName || data.title);
      const hasTech = (Array.isArray(data.technologies) && data.technologies.length > 0) ||
                      (typeof data.technologies === "string" && data.technologies.trim().length > 0);
      const hasDesc = Boolean(data.description && String(data.description).trim().length > 0);

      if (!hasName && !hasTech && !hasDesc) {
        return {
          valid: false,
          error: "Please provide a project name, technologies used, or description notes to generate a project description."
        };
      }
      return { valid: true };
    }

    case "skills": {
      const skillsArray = Array.isArray(data.skills) ? data.skills : [];
      const rawText = typeof data.rawSkills === "string" ? data.rawSkills.trim() : "";

      if (skillsArray.length === 0 && rawText.length === 0) {
        return {
          valid: false,
          error: "Please provide at least one skill to format and organize skills."
        };
      }
      return { valid: true };
    }

    case "education": {
      const hasDegree = Boolean(data.degree);
      const hasInstitution = Boolean(data.institution);
      const hasField = Boolean(data.fieldOfStudy);
      const hasHonors = Boolean(data.honors || data.description);

      if (!hasDegree && !hasInstitution && !hasField && !hasHonors) {
        return {
          valid: false,
          error: "Please provide degree, institution, or field of study details to format education descriptions."
        };
      }
      return { valid: true };
    }

    case "achievement": {
      const hasTitle = Boolean(data.title || data.achievementTitle);
      const hasDesc = Boolean(data.description && String(data.description).trim().length > 0);
      const hasIssuer = Boolean(data.organization || data.issuer);

      if (!hasTitle && !hasDesc && !hasIssuer) {
        return {
          valid: false,
          error: "Please provide an achievement title, issuer, or description to format the achievement."
        };
      }
      return { valid: true };
    }

    default:
      return { valid: false, error: `Unsupported section: ${section}` };
  }
};

/**
 * OpenAI Structured Output JSON Schema for Advanced AI Content Generation
 */
export const aiGeneratedContentOpenAiFormatConfig = {
  type: "json_schema",
  json_schema: {
    name: "resume_builder_generated_content",
    strict: true,
    schema: {
      type: "object",
      properties: {
        generatedContent: {
          type: "string",
          description: "The primary generated/polished textual content tailored to the requested section and tone."
        },
        bullets: {
          type: "array",
          items: { type: "string" },
          description: "Structured bullet points (e.g. for experience or project descriptions). Empty array if not applicable."
        },
        toneApplied: {
          type: "string",
          description: "The tone applied during generation (professional, concise, technical, or achievement_focused)."
        },
        keyChangesMade: {
          type: "array",
          items: { type: "string" },
          description: "Summary of structural improvements, active verbs applied, and redundancies removed."
        },
        factPreservationNotice: {
          type: "string",
          description: "Statement affirming that no unverified claims, metrics, or technologies were fabricated."
        }
      },
      required: [
        "generatedContent",
        "bullets",
        "toneApplied",
        "keyChangesMade",
        "factPreservationNotice"
      ],
      additionalProperties: false
    }
  }
};

/**
 * Zod validation schema for parsing OpenAI response
 */
export const aiGeneratedContentZodSchema = z.object({
  generatedContent: z.string().min(1, "Generated content cannot be empty"),
  bullets: z.array(z.string()).default([]),
  toneApplied: z.string().default("professional"),
  keyChangesMade: z.array(z.string()).default([]),
  factPreservationNotice: z.string().default("Strict fact preservation applied: No unverified metrics or credentials added.")
});
