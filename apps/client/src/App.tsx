import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import theme from "./theme/theme";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import LikedSongs from "./pages/LikedSongs";
import LikedPlaylists from "./pages/LikedPlaylists";
import CreateSong from "./pages/CreateSong";
import CreatePlaylist from "./pages/CreatePlaylist";
import SongDetail from "./pages/SongDetail";
import Search from "./pages/Search";
import PlayerProvider from "./player/PlayerContext";
import PlaylistDetails from "./pages/PlaylistDetails";
import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// all signed-in pages share the layout (sidebar, top bar, player)
const PrivateRoute = () => {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <PlayerProvider>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/my-profile" element={<Profile />} />
                  <Route path="/liked" element={<LikedSongs />} />
                  <Route path="/liked-playlists" element={<LikedPlaylists />} />
                  <Route path="/create-song" element={<CreateSong />} />
                  <Route path="/create-playlist" element={<CreatePlaylist />} />
                  <Route path="/song/:id" element={<SongDetail />} />
                  <Route path="/playlist/:id" element={<PlaylistDetails />} />
                </Route>
              </Route>
              <Route path="/" element={<Navigate to="/feed" replace />} />
            </Routes>
          </PlayerProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
