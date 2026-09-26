import axios from "axios";

const API_URL = "http://localhost:3000"; // Update this with your server URL

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
    const response = await axios.post(`${API_URL}/register`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/login`, data);
    return response.data.data;
  },

  logout: async (token: string): Promise<void> => {
    await axios.post(
      `${API_URL}/logout`,
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
