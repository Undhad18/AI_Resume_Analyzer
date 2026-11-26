/**
 * Template Configuration and Section Extraction Utilities (Lesson 8.4)
 */

export const TEMPLATE_IDS = {
  MODERN: "modern",
  CLASSIC: "classic",
  MINIMAL: "minimal",
  ATS: "ats"
};

export const DEFAULT_TEMPLATE = TEMPLATE_IDS.MODERN;

export const TEMPLATE_CONFIGS = [
  {
    id: TEMPLATE_IDS.MODERN,
    name: "Modern",
    displayName: "Modern Professional",
    description: "Clean layout with subtle accents, balanced spacing, and modern typography.",
    badge: "Popular",
    accent: "blue",
    tagline: "Contemporary & Polished",
    previewThumbnail: "modern"
  },
  {
    id: TEMPLATE_IDS.CLASSIC,
    name: "Classic",
    displayName: "Professional Classic",
    description: "Traditional corporate design with formal serif typography and full-width rules.",
    badge: "Corporate",
    accent: "slate",
    tagline: "Formal & Executive",
    previewThumbnail: "classic"
  },
  {
    id: TEMPLATE_IDS.MINIMAL,
    name: "Minimal",
    displayName: "Minimalist",
    description: "Refined aesthetic with generous whitespace, light typography, and clean hierarchy.",
    badge: "Clean",
    accent: "neutral",
    tagline: "Simple & Elegant",
    previewThumbnail: "minimal"
  },
  {
    id: TEMPLATE_IDS.ATS,
    name: "ATS-Friendly",
    displayName: "ATS-Friendly Clean",
    description: "Strict single-column text structure with standard headings for automated parsers.",
    badge: "ATS-Safe",
    accent: "emerald",
    tagline: "Single-Column Plain Text",
    previewThumbnail: "ats"
  }
];

export const getTemplateConfig = (templateId) => {
  return (
    TEMPLATE_CONFIGS.find((t) => t.id === templateId) ||
    TEMPLATE_CONFIGS.find((t) => t.id === DEFAULT_TEMPLATE)
  );
};

/**
 * Extracts and filters valid non-empty sections from resumeData.
 * Ensures consistent safe extraction and empty section suppression across all templates.
 */
export const extractValidResumeSections = (resumeData = {}) => {
  const {
    personalInfo = {},
    professionalSummary = "",
    skills = [],
    experience = [],
    education = [],
    projects = [],
    certifications = [],
    achievements = []
  } = resumeData;

  const fullName = personalInfo.fullName?.trim() || "";
  const email = personalInfo.email?.trim() || "";
  const phone = personalInfo.phone?.trim() || "";
  const location = personalInfo.location?.trim() || "";
  const linkedIn = personalInfo.linkedIn?.trim() || "";
  const gitHub = personalInfo.gitHub?.trim() || "";
  const portfolio = personalInfo.portfolio?.trim() || "";

  const hasPersonalInfo = Boolean(fullName || email || phone || location);
  const hasLinks = Boolean(linkedIn || gitHub || portfolio);
  const hasSummary = Boolean(professionalSummary && professionalSummary.trim().length > 0);

  // Normalize skills array (handle both string items and { name: string } objects)
  const normalizedSkills = Array.isArray(skills)
    ? skills
        .map((s) => (typeof s === "string" ? s.trim() : s?.name?.trim() || ""))
        .filter((s) => s.length > 0)
    : [];
  const hasSkills = normalizedSkills.length > 0;

  // Filter valid non-empty experience entries
  const validExperience = (experience || []).filter(
    (exp) =>
      Boolean(exp.jobTitle?.trim()) ||
      Boolean(exp.position?.trim()) ||
      Boolean(exp.company?.trim()) ||
      Boolean(exp.responsibilities?.trim())
  );

  // Filter valid non-empty education entries
  const validEducation = (education || []).filter(
    (edu) =>
      Boolean(edu.institution?.trim()) ||
      Boolean(edu.degree?.trim()) ||
      Boolean(edu.fieldOfStudy?.trim())
  );

  // Filter valid non-empty project entries
  const validProjects = (projects || []).filter(
    (proj) =>
      Boolean(proj.projectName?.trim()) ||
      Boolean(proj.title?.trim()) ||
      Boolean(proj.name?.trim()) ||
      Boolean(proj.description?.trim()) ||
      Boolean(proj.technologies?.trim())
  );

  // Filter valid non-empty certification entries
  const validCertifications = (certifications || []).filter(
    (cert) =>
      Boolean(cert.certificationName?.trim()) ||
      Boolean(cert.name?.trim()) ||
      Boolean(cert.issuingOrganization?.trim()) ||
      Boolean(cert.issuer?.trim())
  );

  // Filter valid non-empty achievement entries
  const validAchievements = (achievements || []).filter(
    (ach) => Boolean(ach.title?.trim()) || Boolean(ach.description?.trim())
  );

  const isCompletelyEmpty =
    !hasPersonalInfo &&
    !hasLinks &&
    !hasSummary &&
    !hasSkills &&
    validExperience.length === 0 &&
    validEducation.length === 0 &&
    validProjects.length === 0 &&
    validCertifications.length === 0 &&
    validAchievements.length === 0;

  return {
    personalInfo: {
      fullName,
      email,
      phone,
      location,
      linkedIn,
      gitHub,
      portfolio
    },
    hasPersonalInfo,
    hasLinks,
    professionalSummary: professionalSummary?.trim() || "",
    hasSummary,
    skills: normalizedSkills,
    hasSkills,
    validExperience,
    validEducation,
    validProjects,
    validCertifications,
    validAchievements,
    isCompletelyEmpty
  };
};
