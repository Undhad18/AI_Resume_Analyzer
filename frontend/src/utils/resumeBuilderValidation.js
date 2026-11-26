/**
 * Validation utilities and default state for Resume Builder (Module 8 Lesson 8.2)
 */

export const generateUniqueId = (prefix = "id") => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const createEmptyExperience = () => ({
  id: generateUniqueId("exp"),
  jobTitle: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  currentlyWorking: false,
  responsibilities: "",
  achievements: ""
});

export const createEmptyEducation = () => ({
  id: generateUniqueId("edu"),
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  graduationYear: "",
  grade: "",
  description: ""
});

export const createEmptyProject = () => ({
  id: generateUniqueId("proj"),
  projectName: "",
  name: "", // backwards compatibility
  technologies: "",
  description: "",
  projectUrl: "",
  startDate: "",
  endDate: ""
});

export const createEmptyCertification = () => ({
  id: generateUniqueId("cert"),
  certificationName: "",
  name: "", // backwards compatibility
  issuingOrganization: "",
  issuer: "", // backwards compatibility
  issueDate: "",
  credentialUrl: ""
});

export const createEmptyAchievement = () => ({
  id: generateUniqueId("ach"),
  title: "",
  description: "",
  date: ""
});

export const INITIAL_RESUME_DATA = {
  resumeTitle: "My Professional Resume",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedIn: "",
    gitHub: "",
    portfolio: ""
  },
  professionalSummary: "",
  skills: [],
  experience: [createEmptyExperience()],
  education: [createEmptyEducation()],
  projects: [createEmptyProject()],
  certifications: [createEmptyCertification()],
  achievements: [createEmptyAchievement()]
};

export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidUrl = (url) => {
  if (!url || typeof url !== "string") return true; // Optional fields can be empty
  const trimmed = url.trim();
  if (!trimmed) return true;
  return /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i.test(trimmed);
};

/**
 * Validates that end date does not precede start date when not currently working
 * Supports formats like "YYYY-MM", "YYYY", or "Mon YYYY"
 */
export const validateDateRange = (startDate, endDate, currentlyWorking = false) => {
  if (currentlyWorking) return { isValid: true };
  if (!startDate || !endDate) return { isValid: true };

  const parseYearMonth = (val) => {
    if (!val || typeof val !== "string") return null;
    const clean = val.trim();
    // YYYY-MM
    const ymMatch = clean.match(/^(\d{4})[-/](0?[1-9]|1[0-2])$/);
    if (ymMatch) return parseInt(ymMatch[1], 10) * 12 + parseInt(ymMatch[2], 10);
    // YYYY
    const yMatch = clean.match(/^(\d{4})$/);
    if (yMatch) return parseInt(yMatch[1], 10) * 12 + 1;
    // Date object parse fallback
    const parsed = Date.parse(clean);
    return isNaN(parsed) ? null : parsed;
  };

  const startVal = parseYearMonth(startDate);
  const endVal = parseYearMonth(endDate);

  if (startVal !== null && endVal !== null && endVal < startVal) {
    return {
      isValid: false,
      error: "End date cannot be earlier than start date."
    };
  }

  return { isValid: true };
};

export const validatePersonalInfo = (info = {}) => {
  const errors = {};

  if (!info.fullName || !info.fullName.trim()) {
    errors.fullName = "Full Name is required.";
  }

  if (!info.email || !info.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(info.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (info.linkedIn && !isValidUrl(info.linkedIn)) {
    errors.linkedIn = "Please enter a valid LinkedIn URL.";
  }

  if (info.gitHub && !isValidUrl(info.gitHub)) {
    errors.gitHub = "Please enter a valid GitHub URL.";
  }

  if (info.portfolio && !isValidUrl(info.portfolio)) {
    errors.portfolio = "Please enter a valid portfolio URL.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  generateUniqueId,
  createEmptyExperience,
  createEmptyEducation,
  createEmptyProject,
  createEmptyCertification,
  createEmptyAchievement,
  INITIAL_RESUME_DATA,
  isValidEmail,
  isValidUrl,
  validateDateRange,
  validatePersonalInfo
};
