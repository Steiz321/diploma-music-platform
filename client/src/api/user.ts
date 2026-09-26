import { apiClient } from "./client";
import { Song } from "./song";
import { Playlist } from "./playlist";

export interface User {
  id: number;
  username: string;
  description: string | null;
  avatar: string | null;
  is_verified: boolean;
  songs: Song[];
  playlists: Playlist[];
}

const userApi = {
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/user/${id}`);
    return response.data.data;
  },

  getUserPlaylists: async (userId: number): Promise<Playlist[]> => {
    const response = await apiClient.get(`/playlist/user/${userId}`);
    return response.data.data.playlists;
  },
};

export default userApi;
