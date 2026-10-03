import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Session keys written by the Login / Register pages
const SESSION_KEYS = [
  "token",
  "refreshToken",
  "user_id",
  "username",
  "avatar",
  "description",
];
// 401 from these requests means wrong credentials, not an expired session
const AUTH_ENDPOINTS = ["/login", "/register"];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = AUTH_ENDPOINTS.includes(error.config?.url);

    if (error.response?.status === 401 && !isAuthRequest) {
      SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "An error occurred";
  }
  return "An unexpected error occurred";
};
