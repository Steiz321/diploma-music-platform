import axios from "axios";
import { Song } from "./song";
import { Playlist } from "./playlist";

const API_URL = "http://localhost:3000";

export interface User {
  id: number;
  username: string;
  description: string | null;
  avatar: string | null;
  is_verified: boolean;
  songs: Song[];
  playlists: Playlist[];
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const userApi = {
  getUserById: async (id: number): Promise<User> => {
    const response = await axios.get(`${API_URL}/user/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  },

  getUserPlaylists: async (userId: number): Promise<Playlist[]> => {
    const response = await axios.get(`${API_URL}/playlist/user/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data.data.playlists;
  },
};

export default userApi;
