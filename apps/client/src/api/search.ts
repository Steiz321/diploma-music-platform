import { apiClient } from "./client";
import type { Song } from "./song";

const searchApi = {
  /** GET /song?search=: name matches come first, then the other songs */
  searchSongs: async (query: string): Promise<Song[]> => {
    const response = await apiClient.get("/song", {
      params: { search: query },
    });
    return response.data.data.songs;
  },
};

export default searchApi;
