import api from "./api";

export const getAllResumes = async () => {
  return await api.get("/resumes");
};

export const getResumeById = async (resumeId) => {
  return await api.get(`/resumes/${resumeId}`);
};

export const uploadResume = async (formData) => {
  return await api.post("/resumes/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};