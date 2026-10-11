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

export interface TastePreference {
  /** "group:value" tag key, like "mood:calm" */
  key: string;
  /** preference strength, above 0 */
  value: number;
}

export interface UserTaste {
  /** strongest first, up to 5 */
  moods: TastePreference[];
  /** strongest first, up to 3 */
  topics: TastePreference[];
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

  /** Null while the user has no profile yet */
  getTaste: async (): Promise<UserTaste | null> => {
    const response = await apiClient.get("/user/taste");
    return response.data.data.taste;
  },
};

export default userApi;
