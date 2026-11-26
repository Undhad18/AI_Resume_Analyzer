/**
 * PDF Data Extraction, Normalization & Text Sanitization Utilities (Lesson 8.5)
 */

/**
 * Sanitizes plain text for PDFKit's standard WinAnsi / Latin-1 font encodings.
 * Replaces fancy typographical quotes, curly apostrophes, dashes, and bullet marks
 * with their standard ASCII equivalents to prevent encoding crashes.
 */
export const sanitizePdfText = (str) => {
  if (str === null || str === undefined) return "";
  let text = String(str);

  // Normalize Unicode
  text = text.normalize("NFKD");

  // Common Unicode typographical replacements
  text = text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Single quotes / apostrophes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Double quotes
    .replace(/[\u2013\u2014\u2015]/g, "-")       // En-dash, em-dash, horizontal bar
    .replace(/[\u2026]/g, "...")                 // Ellipsis
    .replace(/[\u00A0]/g, " ")                   // Non-breaking space
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "-"); // Various bullet symbols to standard dash

  // Filter out exotic non-printable or unsupported characters (> U+00FF except safe whitespace/control)
  // PDFKit built-in fonts (Helvetica, Times, Courier) support Latin-1 characters (0x00 - 0xFF)
  text = text.replace(/[^\x00-\xFF]/g, "");

  return text;
};

/**
 * Extracts and normalizes valid, non-empty resume sections from resumeData.
 */
export const extractValidPdfSections = (resumeData = {}) => {
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

  const fullName = sanitizePdfText(personalInfo.fullName?.trim() || "");
  const email = sanitizePdfText(personalInfo.email?.trim() || "");
  const phone = sanitizePdfText(personalInfo.phone?.trim() || "");
  const location = sanitizePdfText(personalInfo.location?.trim() || "");
  const linkedIn = sanitizePdfText(personalInfo.linkedIn?.trim() || "");
  const gitHub = sanitizePdfText(personalInfo.gitHub?.trim() || "");
  const portfolio = sanitizePdfText(personalInfo.portfolio?.trim() || "");

  const hasPersonalInfo = Boolean(fullName || email || phone || location);
  const hasLinks = Boolean(linkedIn || gitHub || portfolio);
  const cleanedSummary = sanitizePdfText(professionalSummary?.trim() || "");
  const hasSummary = cleanedSummary.length > 0;

  // Normalize skills array (handle string items and { name: string } objects)
  const normalizedSkills = Array.isArray(skills)
    ? skills
        .map((s) => sanitizePdfText(typeof s === "string" ? s.trim() : s?.name?.trim() || ""))
        .filter((s) => s.length > 0)
    : [];
  const hasSkills = normalizedSkills.length > 0;

  // Normalize and filter work experience entries
  const validExperience = (Array.isArray(experience) ? experience : [])
    .map((exp) => ({
      jobTitle: sanitizePdfText(exp.jobTitle?.trim() || exp.position?.trim() || ""),
      company: sanitizePdfText(exp.company?.trim() || ""),
      location: sanitizePdfText(exp.location?.trim() || ""),
      startDate: sanitizePdfText(exp.startDate?.trim() || ""),
      endDate: sanitizePdfText(exp.endDate?.trim() || ""),
      currentlyWorking: Boolean(exp.currentlyWorking),
      responsibilities: sanitizePdfText(exp.responsibilities?.trim() || ""),
      achievements: sanitizePdfText(exp.achievements?.trim() || "")
    }))
    .filter(
      (exp) =>
        exp.jobTitle ||
        exp.company ||
        exp.responsibilities ||
        exp.achievements
    );

  // Normalize and filter education entries
  const validEducation = (Array.isArray(education) ? education : [])
    .map((edu) => ({
      institution: sanitizePdfText(edu.institution?.trim() || ""),
      degree: sanitizePdfText(edu.degree?.trim() || ""),
      fieldOfStudy: sanitizePdfText(edu.fieldOfStudy?.trim() || ""),
      startDate: sanitizePdfText(edu.startDate?.trim() || ""),
      endDate: sanitizePdfText(edu.endDate?.trim() || ""),
      graduationYear: sanitizePdfText(edu.graduationYear?.trim() || ""),
      grade: sanitizePdfText(edu.grade?.trim() || ""),
      description: sanitizePdfText(edu.description?.trim() || "")
    }))
    .filter(
      (edu) =>
        edu.institution ||
        edu.degree ||
        edu.fieldOfStudy ||
        edu.description
    );

  // Normalize and filter project entries
  const validProjects = (Array.isArray(projects) ? projects : [])
    .map((proj) => ({
      projectName: sanitizePdfText(proj.projectName?.trim() || proj.title?.trim() || proj.name?.trim() || ""),
      technologies: sanitizePdfText(
        Array.isArray(proj.technologies)
          ? proj.technologies.join(", ")
          : proj.technologies?.trim() || ""
      ),
      description: sanitizePdfText(proj.description?.trim() || ""),
      projectUrl: sanitizePdfText(proj.projectUrl?.trim() || ""),
      startDate: sanitizePdfText(proj.startDate?.trim() || ""),
      endDate: sanitizePdfText(proj.endDate?.trim() || "")
    }))
    .filter(
      (proj) =>
        proj.projectName ||
        proj.technologies ||
        proj.description
    );

  // Normalize and filter certification entries
  const validCertifications = (Array.isArray(certifications) ? certifications : [])
    .map((cert) => ({
      certificationName: sanitizePdfText(cert.certificationName?.trim() || cert.name?.trim() || ""),
      issuingOrganization: sanitizePdfText(cert.issuingOrganization?.trim() || cert.issuer?.trim() || ""),
      issueDate: sanitizePdfText(cert.issueDate?.trim() || ""),
      credentialUrl: sanitizePdfText(cert.credentialUrl?.trim() || "")
    }))
    .filter(
      (cert) =>
        cert.certificationName ||
        cert.issuingOrganization
    );

  // Normalize and filter achievement entries
  const validAchievements = (Array.isArray(achievements) ? achievements : [])
    .map((ach) => ({
      title: sanitizePdfText(ach.title?.trim() || ""),
      description: sanitizePdfText(ach.description?.trim() || ""),
      date: sanitizePdfText(ach.date?.trim() || "")
    }))
    .filter((ach) => ach.title || ach.description);

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
    professionalSummary: cleanedSummary,
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

/**
 * Checks remaining space on page and triggers a page break if needed
 * to avoid orphan headings or awkward section cuts.
 */
export const ensureSpace = (doc, requiredPoints = 60) => {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + requiredPoints > bottomLimit) {
    doc.addPage();
    return true;
  }
  return false;
};

/**
 * Sanitizes candidate full name into a safe, alphanumeric attachment filename
 */
export const sanitizeFilename = (fullName, templateId = "modern") => {
  const raw = String(fullName || "resume").trim();
  const safe = raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const prefix = safe || "resume";
  const validTemplate = ["modern", "classic", "minimal", "ats"].includes(templateId)
    ? templateId
    : "modern";

  return `${prefix}_${validTemplate}.pdf`;
};
