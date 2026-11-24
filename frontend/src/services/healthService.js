import api from "./api";

export const checkServerHealth = async () => {
  return await api.get("/health");
}; 