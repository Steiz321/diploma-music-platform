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

// Mirrors StructuredLyrics of @platform/contracts (the client does not depend
// on the contracts package)
export type VerseKind =
  | "verse"
  | "chorus"
  | "bridge"
  | "intro"
  | "outro"
  | "other";

export interface LyricsLine {
  /** seconds from the start of the track */
  start: number;
  end: number;
  text: string;
}

export interface LyricsVerse {
  kind: VerseKind;
  lines: LyricsLine[];
}

/** Lyrics split into verses, every line with its timing. */
export interface StructuredLyrics {
  verses: LyricsVerse[];
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
  /** detected language of the lyrics, e.g. "en" (GET /song/:id only) */
  language?: string | null;
  /** timed lyrics (GET /song/:id only); null when not transcribed */
  lyrics?: StructuredLyrics | null;
  created_at: Date;
  updated_at: Date;
  user: User;
}

export interface RecommendationReasons {
  /** "group:value" tags of the track, e.g. "mood:melancholic" */
  tags: string[];
  similar_listeners: boolean;
  popular: boolean;
}

export type RecommendedSong = Song & { reasons: RecommendationReasons | null };

export interface RecommendedSongs {
  songs: RecommendedSong[];
  /** popular: the recommendations service is unavailable or has nothing yet */
  source: "recommendations" | "popular";
  cold_start: boolean;
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

  /** "For you" (popular songs when there are no recommendations) */
  getRecommended: async (limit = 6): Promise<RecommendedSongs> => {
    const response = await apiClient.get("/song/recommended", {
      params: { limit },
    });
    return response.data.data;
  },

  getSimilar: async (id: number, limit = 6): Promise<RecommendedSongs> => {
    const response = await apiClient.get(`/song/${id}/similar`, {
      params: { limit },
    });
    return response.data.data;
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
