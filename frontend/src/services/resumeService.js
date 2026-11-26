import api from "./api";

/**
 * Fetch paginated resumes for authenticated user
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @returns {Promise<object>}
 */
export const getAllResumes = async ({ page = 1, limit = 10 } = {}) => {
  const res = await api.get("/resumes", {
    params: { page, limit }
  });
  return res?.data ? res.data : res;
};

/**
 * Fetch a single resume by ID
 * @param {string|number} resumeId
 */
export const getResumeById = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}`);
  return res?.data ? res.data : res;
};

/**
 * Upload and store a resume document
 * @param {File|FormData} fileOrFormData - Selected resume File or FormData
 * @returns {Promise<object>} Upload response payload
 */
export const uploadResume = async (fileOrFormData) => {
  let formData;
  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else {
    formData = new FormData();
    formData.append("resume", fileOrFormData);
  }

  // Axios and the browser automatically construct multipart/form-data with the boundary parameter
  const res = await api.post("/resumes/upload", formData);
  return res;
};

/**
 * Fetch raw PDF blob for inline browser preview
 * @param {string|number} resumeId
 * @returns {Promise<Blob>}
 */
export const previewResumePdf = async (resumeId) => {
  // Use axios directly or configured api to request blob
  const res = await api.get(`/resumes/${resumeId}/preview`, {
    responseType: "blob"
  });
  return res instanceof Blob ? res : new Blob([res], { type: "application/pdf" });
};

/**
 * Download resume file attachment
 * @param {string|number} resumeId
 * @param {string} [fallbackFilename="resume.pdf"]
 */
export const downloadResume = async (resumeId, fallbackFilename = "resume.pdf") => {
  const res = await api.get(`/resumes/${resumeId}/download`, {
    responseType: "blob"
  });

  const blob = res instanceof Blob ? res : new Blob([res]);
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", fallbackFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

/**
 * Extract readable text from an uploaded PDF resume
 * @param {string|number} resumeId
 * @returns {Promise<object>} Extracted text data payload
 */
export const extractResumeText = async (resumeId) => {
  const res = await api.post(`/resumes/${resumeId}/extract-text`);
  return res?.data ? res.data : res;
};

/**
 * Extract readable text from an uploaded DOCX resume
 * @param {string|number} resumeId
 * @returns {Promise<object>} Extracted text data payload
 */
export const extractDocxResumeText = async (resumeId) => {
  const res = await api.post(`/resumes/${resumeId}/extract-docx-text`);
  return res?.data ? res.data : res;
};

/**
 * Convert extracted resume text to structured JSON schema
 * @param {string|number} resumeId
 * @returns {Promise<object>} Structured resume payload
 */
export const getStructuredResume = async (resumeId) => {
  const res = await api.post(`/resumes/${resumeId}/structure`);
  return res?.data ? res.data : res;
};

/**
 * Execute complete AI resume analysis engine workflow (Lesson 5.5)
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const analyzeResume = async (resumeId) => {
  const res = await api.post(`/resumes/${resumeId}/analyze`, {}, {
    timeout: 120000
  });
  return res?.data ? res.data : res;
};

/**
 * Execute free rule-based resume analysis (Zero OpenAI API calls)
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const analyzeResumeFree = async (resumeId) => {
  const res = await api.post(`/resumes/${resumeId}/analyze-free`);
  return res?.data ? res.data : res;
};

/**
 * Fetch latest completed or active analysis record for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getResumeAnalysis = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/analysis`);
  return res?.data ? res.data : res;
};

/**
 * Calculate deterministic ATS compatibility score (Lesson 6.2)
 * @param {string|number} resumeId
 * @param {object} [params]
 * @param {string} [params.jobDescription]
 * @returns {Promise<object>}
 */
export const calculateAtsScore = async (resumeId, { jobDescription } = {}) => {
  const res = await api.post(`/resumes/${resumeId}/ats-score`, { jobDescription });
  return res?.data ? res.data : res;
};

/**
 * Fetch latest ATS score record for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getAtsScore = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/ats-score`);
  return res?.data ? res.data : res;
};

/**
 * Calculate detailed Skills, Education, and Experience score (Lesson 6.3)
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const calculateDetailedScore = async (resumeId) => {
  const res = await api.post(`/resumes/${resumeId}/detailed-score`);
  return res?.data ? res.data : res;
};

/**
 * Fetch latest saved detailed score record for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getDetailedScore = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/detailed-score`);
  return res?.data ? res.data : res;
};

/**
 * Calculate formatting and grammar score (Lesson 6.4)
 * @param {string|number} resumeId
 * @param {object} [params]
 * @param {"free"|"ai"} [params.analysisMode="free"]
 * @returns {Promise<object>}
 */
export const calculateFormattingGrammarScore = async (resumeId, { analysisMode = "free" } = {}) => {
  const res = await api.post(`/resumes/${resumeId}/formatting-grammar-score`, { analysisMode });
  return res?.data ? res.data : res;
};

/**
 * Fetch latest saved formatting and grammar score record for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getFormattingGrammarScore = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/formatting-grammar-score`);
  return res?.data ? res.data : res;
};

/**
 * Calculate Strengths, Weaknesses, and Missing Information (Lesson 7.1)
 * @param {string|number} resumeId
 * @param {object} [params]
 * @param {"free"|"ai"} [params.analysisMode="free"]
 * @returns {Promise<object>}
 */
export const calculateResumeStrengthsWeaknesses = async (resumeId, { analysisMode = "free" } = {}) => {
  const res = await api.post(`/resumes/${resumeId}/strengths-weaknesses`, { analysisMode });
  return res?.data ? res.data : res;
};

/**
 * Fetch latest Strengths and Weaknesses record for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getResumeStrengthsWeaknesses = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/strengths-weaknesses`);
  return res?.data ? res.data : res;
};

/**
 * Detect missing skills and keywords (Lesson 7.2)
 * @param {string|number} resumeId
 * @param {object} [params]
 * @param {"general"|"job_specific"} [params.mode="general"]
 * @param {string} [params.jobDescription=""]
 * @param {"free"|"ai"} [params.analysisMode="free"]
 * @returns {Promise<object>}
 */
export const detectResumeSkillsKeywords = async (
  resumeId,
  { mode = "general", jobDescription = "", analysisMode = "free" } = {}
) => {
  const res = await api.post(`/resumes/${resumeId}/skills-keywords`, {
    mode,
    jobDescription,
    analysisMode
  });
  return res?.data ? res.data : res;
};

/**
 * Fetch latest skills & keywords analysis record for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getResumeSkillsKeywords = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/skills-keywords`);
  return res?.data ? res.data : res;
};

/**
 * Generate improvement suggestions (Lesson 7.3)
 * @param {string|number} resumeId
 * @param {object} [params]
 * @param {"free"|"advanced"} [params.mode="free"]
 * @param {string} [params.jobDescription=""]
 * @returns {Promise<object>}
 */
export const generateResumeImprovementSuggestions = async (
  resumeId,
  { mode = "free", jobDescription = "" } = {}
) => {
  const res = await api.post(`/resumes/${resumeId}/improvement-suggestions`, {
    mode,
    jobDescription
  });
  return res?.data ? res.data : res;
};

/**
 * Fetch latest improvement suggestions for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getResumeImprovementSuggestions = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/improvement-suggestions`);
  return res?.data ? res.data : res;
};

/**
 * Update individual suggestion status (pending / accepted / completed / dismissed)
 * @param {string|number} resumeId
 * @param {string} suggestionId
 * @param {"pending"|"accepted"|"completed"|"dismissed"} status
 * @returns {Promise<object>}
 */
export const updateResumeSuggestionStatus = async (resumeId, suggestionId, status) => {
  const res = await api.patch(`/resumes/${resumeId}/improvement-suggestions/${suggestionId}/status`, {
    status
  });
  return res?.data ? res.data : res;
};

/**
 * Generate resume enhancement draft (Lesson 7.4)
 * @param {string|number} resumeId
 * @param {object} params
 * @param {"free"|"advanced"} [params.mode="free"]
 * @param {"full_resume"|"single_section"} [params.scope="full_resume"]
 * @param {string} [params.section]
 * @param {string} [params.targetJobDescription=""]
 * @returns {Promise<object>}
 */
export const enhanceResume = async (resumeId, { mode = "free", scope = "full_resume", section, targetJobDescription = "" } = {}) => {
  const res = await api.post(`/resumes/${resumeId}/enhance`, {
    mode,
    scope,
    section,
    targetJobDescription
  });
  return res?.data ? res.data : res;
};

/**
 * Fetch latest enhancement draft for resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const getEnhancementDraft = async (resumeId) => {
  const res = await api.get(`/resumes/${resumeId}/enhance/draft`);
  return res?.data ? res.data : res;
};

/**
 * Update editable draft content
 * @param {string|number} resumeId
 * @param {string|number} draftId
 * @param {object} params
 * @param {object} params.enhancedContent
 * @param {string} [params.changesSummary]
 * @returns {Promise<object>}
 */
export const updateEnhancementDraft = async (resumeId, draftId, { enhancedContent, changesSummary } = {}) => {
  const res = await api.put(`/resumes/${resumeId}/enhance/draft/${draftId}`, {
    enhancedContent,
    changesSummary
  });
  return res?.data ? res.data : res;
};

/**
 * Approve enhancement draft and create improved resume version
 * @param {string|number} resumeId
 * @param {string|number} draftId
 * @returns {Promise<object>}
 */
export const approveEnhancementDraft = async (resumeId, draftId) => {
  const res = await api.post(`/resumes/${resumeId}/enhance/draft/${draftId}/approve`);
  return res?.data ? res.data : res;
};

/**
 * Discard enhancement draft
 * @param {string|number} resumeId
 * @param {string|number} draftId
 * @returns {Promise<object>}
 */
export const discardEnhancementDraft = async (resumeId, draftId) => {
  const res = await api.post(`/resumes/${resumeId}/enhance/draft/${draftId}/discard`);
  return res?.data ? res.data : res;
};

/**
 * Soft delete resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const deleteResume = async (resumeId) => {
  return await api.delete(`/resumes/${resumeId}`);
};

/**
 * Generate resume builder content using Free Rule-Based or Advanced AI Mode (Lesson 8.3)
 * @param {object} params
 * @param {"free"|"advanced"} [params.mode="free"]
 * @param {"professionalSummary"|"experience"|"project"|"skills"|"education"|"achievement"} params.section
 * @param {"professional"|"concise"|"technical"|"achievement_focused"} [params.tone="professional"]
 * @param {object} params.data
 * @returns {Promise<object>}
 */
export const generateBuilderContent = async ({ mode = "free", section, tone = "professional", data = {} }) => {
  const res = await api.post("/resume-builder/generate-content", {
    mode,
    section,
    tone,
    data
  });
  return res?.data ? res.data : res;
};

export default {
  getAllResumes,
  getResumeById,
  uploadResume,
  previewResumePdf,
  downloadResume,
  deleteResume,
  extractResumeText,
  extractDocxResumeText,
  getStructuredResume,
  analyzeResume,
  getResumeAnalysis,
  enhanceResume,
  getEnhancementDraft,
  updateEnhancementDraft,
  approveEnhancementDraft,
  discardEnhancementDraft,
  generateBuilderContent
};
