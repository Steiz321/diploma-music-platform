import { Box, CircularProgress, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import searchApi from "../api/search";
import type { Song } from "../api/song";
import SongCard from "../components/SongCard";
import { handleApiError } from "../api/client";
import type { PlaybackSource } from "../tracking";

// "search" is not a playback source in the event contract; a result list
// is closest to the feed
const SOURCE: PlaybackSource = { type: "feed" };

// GET /song?search= only ranks name matches first and still returns every
// song, so the results are narrowed here: title or artist contains the query
const matches = (song: Song, query: string) => {
  const q = query.toLowerCase();
  return (
    song.name.toLowerCase().includes(q) ||
    (song.user?.username ?? "").toLowerCase().includes(q)
  );
};

function Search() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();

  const { data: songs = [], isLoading, error } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchApi.searchSongs(query),
    enabled: query.length > 0,
    select: (all) => all.filter((song) => matches(song, query)),
  });

  if (!query) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="h4" component="h1">
          Search
        </Typography>
        <Typography color="text.secondary">
          Find songs by title or artist using the search field above.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
      <Typography variant="h4" component="h1">
        Results for "{query}"
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{handleApiError(error)}</Typography>
      ) : songs.length === 0 ? (
        <Typography color="text.secondary">
          Nothing matches "{query}". Try another title or artist.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: 2.5,
          }}
        >
          {songs.map((song, index) => (
            <SongCard
              key={song.id}
              song={song}
              songs={songs}
              index={index}
              source={SOURCE}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default Search;
