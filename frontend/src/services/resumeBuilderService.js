/**
 * Resume Builder Frontend API Services (Lessons 8.3 & 8.5)
 */

import api from "./api";

/**
 * Generates tailored resume section content (Lesson 8.3)
 */
export const generateBuilderContent = async ({ mode, section, tone, data }) => {
  return await api.post("/resume-builder/generate-content", {
    mode,
    section,
    tone,
    data
  });
};

/**
 * Generates and triggers browser download of the resume as a formatted PDF (Lesson 8.5)
 * @param {Object} resumeData - Current complete resume state
 * @param {string} selectedTemplate - Selected presentation template ("modern" | "classic" | "minimal" | "ats")
 * @returns {Promise<{ success: boolean, filename: string }>}
 */
export const downloadResumePdf = async (resumeData, selectedTemplate = "modern") => {
  try {
    const blob = await api.post(
      "/resume-builder/download-pdf",
      { resumeData, selectedTemplate },
      {
        responseType: "blob",
        headers: {
          Accept: "application/pdf"
        }
      }
    );

    // Verify received payload is a Blob
    if (!(blob instanceof Blob)) {
      throw new Error("Invalid response received from PDF download service.");
    }

    // Generate safe alphanumeric filename
    const candidateName = (resumeData.personalInfo?.fullName || "resume")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const filename = `${candidateName || "resume"}_${selectedTemplate}.pdf`;

    // Trigger browser file save
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke temporary object URL
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 2000);

    return {
      success: true,
      filename
    };
  } catch (error) {
    let resolvedMessage = error.message || "Failed to download resume PDF.";

    // When responseType is 'blob', Axios error response is also a Blob
    if (error.raw?.response?.data instanceof Blob) {
      try {
        const text = await error.raw.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed?.message) {
          resolvedMessage = parsed.message;
        }
      } catch {
        // Keep resolvedMessage
      }
    }

    throw new Error(resolvedMessage, { cause: error });
  }
};

export default {
  generateBuilderContent,
  downloadResumePdf
};
