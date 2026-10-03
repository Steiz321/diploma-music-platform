import { apiClient } from "./client";

export interface Playlist {
  id: number;
  title: string;
  description: string;
  cover_url: string;
  user_id: number;
  songs_count: number;
  is_liked: boolean;
  user: {
    id: number;
    username: string;
    avatar: string;
  };
  songs: Array<{
    id: number;
    name: string;
    audio: string;
    cover_url: string;
    is_liked: boolean;
    listens: number;
    user: {
      id: number;
      username: string;
    };
  }>;
}

const playlistApi = {
  createPlaylist: async (formData: FormData): Promise<Playlist> => {
    const response = await apiClient.post("/playlist", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getPlaylistById: async (id: number): Promise<Playlist> => {
    const response = await apiClient.get(`/playlist/${id}`);
    console.log("playlist", response.data.data);
    return response.data.data;
  },

  getAllPlaylists: async (): Promise<Playlist[]> => {
    const response = await apiClient.get("/playlist");
    return response.data.data.playlists;
  },

  likePlaylist: async (playlistId: number): Promise<void> => {
    await apiClient.post("/playlist-like", { playlistId });
  },

  getLikedPlaylists: async (): Promise<Playlist[]> => {
    const response = await apiClient.get("/user/liked-playlists");
    return response.data.data.liked_playlists;
  },

  addSongToPlaylist: async (
    playlistId: number,
    songId: number
  ): Promise<void> => {
    await apiClient.post(`/playlist/${playlistId}/song`, { songId });
  },

  getUserPlaylists: async (): Promise<Playlist[]> => {
    const userId = localStorage.getItem("user_id");
    if (!userId) throw new Error("User ID not found");

    const response = await apiClient.get(`/playlist/user/${userId}`);
    return response.data.data.playlists;
  },

  deletePlaylist: async (playlistId: number): Promise<void> => {
    await apiClient.delete(`/playlist/${playlistId}`);
  },
};

export default playlistApi;
