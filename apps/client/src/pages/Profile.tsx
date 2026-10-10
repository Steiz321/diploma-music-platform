import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import { Verified } from "@mui/icons-material";
import userApi, { User } from "../api/user";
import SongCard from "../components/SongCard";
import PlaylistCard from "../components/PlaylistCard";
import { Playlist } from "../api/playlist";
import { coverColor, tokens } from "../theme/tokens";

const gridSx = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
  gap: 2.5,
} as const;

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress aria-label="Loading profile" />
      </Box>
    );
  }

  if (error || !user) {
    return <Typography color="error">{error || "User not found"}</Typography>;
  }

  const displaySongs = Array.isArray(user.songs) ? user.songs : [];
  const counts = [
    `${displaySongs.length} ${displaySongs.length === 1 ? "song" : "songs"}`,
    `${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"}`,
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box
        component="header"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 2.5, sm: 4 },
          p: { xs: 2.5, sm: 4 },
          borderRadius: "24px",
          bgcolor: tokens.heroBg,
          border: `1px solid ${tokens.heroRing}`,
        }}
      >
        <Avatar
          src={user.avatar || undefined}
          alt=""
          sx={{
            width: 112,
            height: 112,
            fontSize: 44,
            fontWeight: 700,
            bgcolor: coverColor(user.id),
            color: tokens.text,
            boxShadow: `0 0 0 6px ${tokens.heroRing}`,
          }}
        >
          {user.username.charAt(0).toUpperCase()}
        </Avatar>
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: tokens.heroSub,
            }}
          >
            Profile
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{ overflowWrap: "anywhere" }}
            >
              {user.username}
            </Typography>
            {user.is_verified && (
              <Verified color="primary" titleAccess="Verified" />
            )}
          </Box>
          {user.description && (
            <Typography sx={{ color: tokens.heroSub, maxWidth: "60ch" }}>
              {user.description}
            </Typography>
          )}
          <Typography sx={{ color: tokens.heroSub, fontSize: 14 }}>
            {counts.join(" · ")}
          </Typography>
        </Box>
      </Box>

      <Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Profile content"
        >
          <Tab
            label={`Songs (${displaySongs.length})`}
            id="profile-tab-0"
            aria-controls="profile-tabpanel-0"
          />
          <Tab
            label={`Playlists (${playlists.length})`}
            id="profile-tab-1"
            aria-controls="profile-tabpanel-1"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {displaySongs.length === 0 ? (
            <Typography color="text.secondary">
              No songs uploaded yet.
            </Typography>
          ) : (
            <Box sx={gridSx}>
              {displaySongs.map((song, idx) => (
                <SongCard
                  key={song.id}
                  song={song}
                  songs={displaySongs}
                  index={idx}
                  source={{ type: "profile", id: user?.id }}
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
            <Box sx={gridSx}>
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </Box>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Profile;
