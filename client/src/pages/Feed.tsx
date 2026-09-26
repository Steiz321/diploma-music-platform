import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Grid, Tabs, Tab } from "@mui/material";
import songApi, { Song } from "../api/song";
import playlistApi, { Playlist } from "../api/playlist";
import SongCard from "../components/SongCard";
import PlaylistCard from "../components/PlaylistCard";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Feed: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [songsData, playlistsData] = await Promise.all([
          songApi.getAllSongs(),
          playlistApi.getAllPlaylists(),
        ]);

        // Ensure we have arrays before setting state
        setSongs(Array.isArray(songsData) ? songsData : []);
        setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);

        // Log the data for debugging
        console.log("Songs data:", songsData);
        console.log("Playlists data:", playlistsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

  const displaySongs = Array.isArray(songs) ? songs : [];
  const displayPlaylists = Array.isArray(playlists) ? playlists : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Discover
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="feed tabs"
          >
            <Tab label={`Songs (${displaySongs.length})`} />
            <Tab label={`Playlists (${displayPlaylists.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {displaySongs.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No songs available
            </Typography>
          ) : (
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
              {displaySongs.map((song, idx) => (
                <SongCard
                  key={song.id}
                  song={song}
                  songs={displaySongs}
                  index={idx}
                />
              ))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {displayPlaylists.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No playlists available
            </Typography>
          ) : (
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
              {displayPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </Box>
          )}
        </TabPanel>
      </Box>
    </Container>
  );
};

export default Feed;
