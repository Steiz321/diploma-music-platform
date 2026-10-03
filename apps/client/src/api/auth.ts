import { apiClient } from "./client";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  description: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  description: string;
  avatar: string;
  type: string;
  is_verified: boolean;
  email: string;
  token: string;
  refresh_token: string;
  created_at: Date;
  deleted_at: Date | null;
}

const authApi = {
  register: async (data: FormData): Promise<AuthResponse> => {
    const response = await apiClient.post("/register", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post("/login", data);
    return response.data.data;
  },

  logout: async (token: string): Promise<void> => {
    await apiClient.post(
      "/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};

export default authApi;
