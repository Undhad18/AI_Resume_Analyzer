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
  const res = await api.post(`/resumes/${resumeId}/analyze`);
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
 * Soft delete resume
 * @param {string|number} resumeId
 * @returns {Promise<object>}
 */
export const deleteResume = async (resumeId) => {
  return await api.delete(`/resumes/${resumeId}`);
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
  getResumeAnalysis
};
