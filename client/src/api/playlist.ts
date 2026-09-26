import axios from "axios";

const BASE_URL = "http://localhost:3000";

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
    const token = localStorage.getItem("token");
    const response = await axios.post(`${BASE_URL}/playlist`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getPlaylistById: async (id: number): Promise<Playlist> => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${BASE_URL}/playlist/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("playlist", response.data.data);
    return response.data.data;
  },

  getAllPlaylists: async (): Promise<Playlist[]> => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${BASE_URL}/playlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data.playlists;
  },

  likePlaylist: async (playlistId: number): Promise<void> => {
    const token = localStorage.getItem("token");
    await axios.post(
      `${BASE_URL}/playlist-like`,
      { playlistId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  getLikedPlaylists: async (): Promise<Playlist[]> => {
    const response = await axios.get(`${BASE_URL}/user/liked-playlists`, {
      headers: getAuthHeader(),
    });
    return response.data.data.liked_playlists;
  },

  addSongToPlaylist: async (
    playlistId: number,
    songId: number
  ): Promise<void> => {
    await axios.post(
      `${BASE_URL}/playlist/${playlistId}/song`,
      { songId },
      {
        headers: getAuthHeader(),
      }
    );
  },

  getUserPlaylists: async (): Promise<Playlist[]> => {
    const userId = localStorage.getItem("user_id");
    if (!userId) throw new Error("User ID not found");

    const response = await axios.get(`${BASE_URL}/playlist/user/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data.data.playlists;
  },

  deletePlaylist: async (playlistId: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/playlist/${playlistId}`, {
      headers: getAuthHeader(),
    });
  },
};

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default playlistApi;
