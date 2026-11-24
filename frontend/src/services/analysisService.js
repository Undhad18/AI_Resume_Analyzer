import api from "./api";

export const analyzeResume = async (resumeId) => {
  return await api.post(`/analysis/${resumeId}`);
};

export const getAnalysisById = async (analysisId) => {
  return await api.get(`/analysis/${analysisId}`);
};