import { apiClient } from "./client";

interface User {
  id: number;
  username: string;
  avatar: string | null;
}

// set by the AI enrichment service (song.enriched)
export type TranscriptionStatus = "pending" | "done" | "no_lyrics" | "failed";

export interface SongTags {
  mood: string[];
  topics: string[];
  energy: string;
  language: string;
}

export interface Song {
  id: number;
  name: string;
  user_id: number;
  description: string;
  text: string;
  audio: string;
  is_liked: boolean;
  cover_url: string;
  listens: number;
  transcription_status?: TranscriptionStatus;
  tags?: SongTags | null;
  created_at: Date;
  updated_at: Date;
  user: User;
}

export interface CreateSongRequest {
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
}

const songApi = {
  getAllSongs: async (): Promise<Song[]> => {
    const response = await apiClient.get("/song");
    return response.data.data.songs;
  },

  getSongById: async (id: number): Promise<Song> => {
    const response = await apiClient.get(`/song/${id}`);
    return response.data.data;
  },

  createSong: async (data: FormData): Promise<Song> => {
    const response = await apiClient.post("/song", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  likeSong: async (songId: number): Promise<void> => {
    await apiClient.post("/song-like", { songId });
  },

  getLikedSongs: async (): Promise<Song[]> => {
    const response = await apiClient.get("/user/liked-songs");
    return response.data.data.liked_songs;
  },

  incrementListens: async (songId: number): Promise<void> => {
    await apiClient.post(`/song/${songId}/listen`, {});
  },

  deleteSong: async (songId: number): Promise<void> => {
    await apiClient.delete(`/song/${songId}`);
  },
};

export default songApi;
