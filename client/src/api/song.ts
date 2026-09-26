import axios from "axios";

const API_URL = "http://localhost:3000";

interface User {
  id: number;
  username: string;
  avatar: string | null;
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

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const songApi = {
  getAllSongs: async (): Promise<Song[]> => {
    const response = await axios.get(`${API_URL}/song`, {
      headers: getAuthHeader(),
    });
    return response.data.data.songs;
  },

  getSongById: async (id: number): Promise<Song> => {
    const response = await axios.get(`${API_URL}/song/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  },

  createSong: async (data: FormData): Promise<Song> => {
    const response = await axios.post(`${API_URL}/song`, data, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },

  likeSong: async (songId: number): Promise<void> => {
    await axios.post(
      `${API_URL}/song-like`,
      { songId },
      {
        headers: getAuthHeader(),
      }
    );
  },

  getLikedSongs: async (): Promise<Song[]> => {
    const response = await axios.get(`${API_URL}/user/liked-songs`, {
      headers: getAuthHeader(),
    });
    return response.data.data.liked_songs;
  },

  incrementListens: async (songId: number): Promise<void> => {
    await axios.post(
      `${API_URL}/song/${songId}/listen`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
  },

  deleteSong: async (songId: number): Promise<void> => {
    await axios.delete(`${API_URL}/song/${songId}`, {
      headers: getAuthHeader(),
    });
  },
};

export default songApi;
