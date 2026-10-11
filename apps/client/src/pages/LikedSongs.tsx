import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import songApi, { Song } from "../api/song";
import SongCard from "../components/SongCard";
import { CardGrid, EmptyState } from "../components/CardGrid";

const LikedSongs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const data = await songApi.getLikedSongs();
        setSongs(data);
      } catch (err) {
        setError("Failed to load liked songs");
        console.error("Error fetching liked songs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h3" component="h1">
        Liked songs
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : songs.length === 0 ? (
        <EmptyState title="No liked songs yet">
          Tap the heart on a song you enjoy and it will be saved here.
        </EmptyState>
      ) : (
        <CardGrid>
          {songs.map((song, idx) => (
            <SongCard
              key={song.id}
              song={song}
              songs={songs}
              index={idx}
              source={{ type: "liked" }}
            />
          ))}
        </CardGrid>
      )}
    </Box>
  );
};

export default LikedSongs;
