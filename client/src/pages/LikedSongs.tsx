import React, { useEffect, useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import songApi, { Song } from "../api/song";
import SongCard from "../components/SongCard";

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

  if (songs.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Liked Songs
          </Typography>
          <Typography color="text.secondary">
            You haven't liked any songs yet. Start exploring and like some
            songs!
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Liked Songs
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr",
            },
            gap: 3,
          }}
        >
          {songs.map((song, idx) => (
            <SongCard key={song.id} song={song} songs={songs} index={idx} />
          ))}
        </Box>
      </Box>
    </Container>
  );
};

export default LikedSongs;
