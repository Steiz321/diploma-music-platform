import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import LikedSongs from "./pages/LikedSongs";
import LikedPlaylists from "./pages/LikedPlaylists";
import Header from "./components/Header";
import { Box } from "@mui/material";
import CreateSong from "./pages/CreateSong";
import CreatePlaylist from "./pages/CreatePlaylist";
import SongDetail from "./pages/SongDetail";
import PlayerProvider from "./player/PlayerContext";
import BottomPlayer from "./player/BottomPlayer";
import PlaylistDetails from "./pages/PlaylistDetails";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#000000",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          "&:focus": {
            outline: "none",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus": {
            outline: "none",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          "&:focus": {
            outline: "none",
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "inherit",
          textDecoration: "none",
          "&:visited": {
            color: "inherit",
          },
          "&:hover": {
            textDecoration: "underline",
          },
        },
      },
    },
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <PlayerProvider>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              width: "100%",
            }}
          >
            <Header />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                py: 3,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box sx={{ width: "100%", maxWidth: "1200px", px: 2 }}>
                <Routes>
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/feed"
                    element={
                      <PrivateRoute>
                        <Feed />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile/:id"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/my-profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/liked"
                    element={
                      <PrivateRoute>
                        <LikedSongs />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/liked-playlists"
                    element={
                      <PrivateRoute>
                        <LikedPlaylists />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/create-song"
                    element={
                      <PrivateRoute>
                        <CreateSong />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/create-playlist"
                    element={
                      <PrivateRoute>
                        <CreatePlaylist />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/song/:id"
                    element={
                      <PrivateRoute>
                        <SongDetail />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/playlist/:id"
                    element={
                      <PrivateRoute>
                        <PlaylistDetails />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/feed" replace />} />
                </Routes>
              </Box>
            </Box>
            <BottomPlayer />
          </Box>
        </PlayerProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
