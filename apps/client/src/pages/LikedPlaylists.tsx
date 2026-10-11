import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import playlistApi, { Playlist } from "../api/playlist";
import PlaylistCard from "../components/PlaylistCard";
import { CardGrid, EmptyState } from "../components/CardGrid";

const LikedPlaylists: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedPlaylists = async () => {
      try {
        const data = await playlistApi.getLikedPlaylists();
        setPlaylists(data);
      } catch (err) {
        console.error("Error fetching liked playlists:", err);
        setError("Failed to load liked playlists");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPlaylists();
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h3" component="h1">
        Liked playlists
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : playlists.length === 0 ? (
        <EmptyState title="No liked playlists yet">
          Like a playlist and it will be saved here.
        </EmptyState>
      ) : (
        <CardGrid>
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </CardGrid>
      )}
    </Box>
  );
};

export default LikedPlaylists;
