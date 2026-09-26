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

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "An error occurred";
  }
  return "An unexpected error occurred";
};
