import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  timeout: 60000,
  withCredentials: true
});

// Request Interceptor: Attach CSRF token from non-HttpOnly cookie if present
api.interceptors.request.use(
  (config) => {
    config.headers["X-Requested-With"] = "XMLHttpRequest";

    // When uploading FormData, delete Content-Type so Axios/Browser automatically generates
    // multipart/form-data with the correct boundary parameter
    if (config.data instanceof FormData) {
      if (config.headers.delete) {
        config.headers.delete("Content-Type");
        config.headers.delete("content-type");
      } else {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)(?:csrfToken|XSRF-TOKEN)=([^;]+)/);
      if (match && match[1]) {
        config.headers["X-CSRF-Token"] = decodeURIComponent(match[1]);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize data unwrapping and error payloads
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    const errors = error.response?.data?.errors || null;

    return Promise.reject({
      status,
      message,
      errors,
      raw: error
    });
  }
);

export default api;
