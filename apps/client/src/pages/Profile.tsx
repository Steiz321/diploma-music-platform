import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Avatar,
  Paper,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import { VerifiedUser } from "@mui/icons-material";
import userApi, { User } from "../api/user";
import SongCard from "../components/SongCard";
import PlaylistCard from "../components/PlaylistCard";
import { Playlist } from "../api/playlist";

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

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let userId: number;

        if (location.pathname === "/my-profile") {
          // For /my-profile route, get ID from localStorage
          const storedId = localStorage.getItem("user_id");
          const token = localStorage.getItem("token");

          if (!storedId || !token) {
            // If no user ID or token, redirect to login
            navigate("/login");
            return;
          }
          userId = parseInt(storedId);
        } else {
          // For /profile/:id route, get ID from URL params
          if (!id) {
            setError("User ID not found");
            setLoading(false);
            return;
          }
          userId = parseInt(id);
        }

        // Fetch user and playlists in parallel
        const [userData, userPlaylists] = await Promise.all([
          userApi.getUserById(userId),
          userApi.getUserPlaylists(userId),
        ]);

        setUser(userData);
        setPlaylists(userPlaylists);
      } catch (err) {
        // an expired session is handled by the apiClient interceptor (-> /login)
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, location.pathname, navigate]);

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

  if (error || !user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || "User not found"}</Typography>
        </Box>
      </Container>
    );
  }

  const displaySongs = Array.isArray(user.songs) ? user.songs : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar
              src={user.avatar || undefined}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h4" component="h1">
                  {user.username}
                </Typography>
                {user.is_verified && <VerifiedUser color="primary" />}
              </Box>
              {user.description && (
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {user.description}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="profile content tabs"
          >
            <Tab label={`Songs (${displaySongs.length})`} />
            <Tab label={`Playlists (${playlists.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {displaySongs.length === 0 ? (
            <Typography color="text.secondary">
              No songs uploaded yet.
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
          {playlists.length === 0 ? (
            <Typography color="text.secondary">
              No playlists created yet.
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
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </Box>
          )}
        </TabPanel>
      </Box>
    </Container>
  );
};

export default Profile;
