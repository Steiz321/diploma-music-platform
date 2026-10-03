import React, { useEffect, useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import playlistApi, { Playlist } from "../api/playlist";
import PlaylistCard from "../components/PlaylistCard";

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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Liked Playlists
        </Typography>
        {playlists.length === 0 ? (
          <Typography color="text.secondary">
            You haven't liked any playlists yet.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {playlists.map((playlist) => (
              <Box
                key={playlist.id}
                sx={{
                  width: {
                    xs: "100%",
                    sm: "calc(50% - 12px)",
                    md: "calc(33.33% - 16px)",
                  },
                }}
              >
                <PlaylistCard playlist={playlist} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default LikedPlaylists;
