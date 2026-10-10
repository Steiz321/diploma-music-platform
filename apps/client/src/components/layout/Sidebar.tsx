import { useEffect, useRef } from "react";
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  HomeOutlined,
  Search,
  FavoriteBorder,
  PlaylistPlay,
  FileUploadOutlined,
  Add,
  Logout,
  Person,
} from "@mui/icons-material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import authApi from "../../api/auth";
import playlistApi from "../../api/playlist";
import { coverColor, fonts, tokens } from "../../theme/tokens";
import Logo from "./Logo";

/** invalidate it after creating / renaming / deleting a playlist */
export const USER_PLAYLISTS_QUERY_KEY = "userPlaylists";

const mainNav = [
  { name: "Feed", path: "/feed", icon: <HomeOutlined /> },
  { name: "Search", path: "/search", icon: <Search /> },
  { name: "Liked Songs", path: "/liked", icon: <FavoriteBorder /> },
  { name: "Liked Playlists", path: "/liked-playlists", icon: <PlaylistPlay /> },
];

const sectionTitleSx = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.subtle,
  px: 1.75,
} as const;

const navItemSx = {
  gap: 1.5,
  px: 1.75,
  py: 1.5,
} as const;

interface SidebarProps {
  /** called after a navigation, closes the mobile drawer */
  onNavigate?: () => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Read user info from localStorage
  const username = localStorage.getItem("username") || "";
  const avatar = localStorage.getItem("avatar");
  const userId = localStorage.getItem("user_id");

  const { data: playlists = [], refetch } = useQuery({
    queryKey: [USER_PLAYLISTS_QUERY_KEY, userId],
    queryFn: playlistApi.getUserPlaylists,
    enabled: !!userId,
  });

  // the playlist pages don't use react-query yet: refresh the list when
  // leaving a page that may have created, renamed or deleted a playlist
  const prevPathname = useRef(pathname);
  useEffect(() => {
    const prev = prevPathname.current;
    prevPathname.current = pathname;
    if (
      prev !== pathname &&
      (prev === "/create-playlist" || prev.startsWith("/playlist/")) &&
      userId
    ) {
      refetch();
    }
  }, [pathname, refetch, userId]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await authApi.logout(token);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("avatar");
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        height: "100%",
        boxSizing: "border-box",
        px: 2.5,
        py: 3.5,
        display: "flex",
        flexDirection: "column",
        gap: 3.5,
        bgcolor: tokens.sidebar,
        overflowY: "auto",
      }}
    >
      <Logo onClick={onNavigate} />

      <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {mainNav.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={active}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              sx={navItemSx}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.name}
                slotProps={{
                  primary: { sx: { fontWeight: "inherit", fontSize: 15 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography sx={sectionTitleSx}>Create</Typography>
        <ListItemButton
          component={RouterLink}
          to="/create-song"
          selected={isActive("/create-song")}
          onClick={onNavigate}
          sx={{
            ...navItemSx,
            border: `1px dashed ${tokens.dashed}`,
            color: tokens.text,
          }}
        >
          <ListItemIcon>
            <FileUploadOutlined />
          </ListItemIcon>
          <ListItemText
            primary="Upload song"
            slotProps={{ primary: { sx: { fontSize: 15 } } }}
          />
        </ListItemButton>
        <ListItemButton
          component={RouterLink}
          to="/create-playlist"
          selected={isActive("/create-playlist")}
          onClick={onNavigate}
          sx={navItemSx}
        >
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText
            primary="New playlist"
            slotProps={{ primary: { sx: { fontSize: 15 } } }}
          />
        </ListItemButton>
      </Box>

      {playlists.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Typography sx={{ ...sectionTitleSx, pb: 1 }}>Your playlists</Typography>
          {playlists.map((playlist) => (
            <ListItemButton
              key={playlist.id}
              component={RouterLink}
              to={`/playlist/${playlist.id}`}
              selected={pathname === `/playlist/${playlist.id}`}
              onClick={onNavigate}
              sx={{
                gap: 1.5,
                px: 1.75,
                py: 1,
                borderRadius: "10px",
                color: tokens.textSecondary,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 28,
                  height: 28,
                  flex: "none",
                  borderRadius: "6px",
                  bgcolor: coverColor(playlist.id),
                  backgroundImage: playlist.cover_url
                    ? `url(${playlist.cover_url})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <ListItemText
                primary={playlist.title}
                slotProps={{ primary: { noWrap: true, sx: { fontSize: 14 } } }}
              />
            </ListItemButton>
          ))}
        </Box>
      )}

      {/* current user and log out */}
      <Box
        sx={{
          mt: "auto",
          pt: 2,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <ListItemButton
          component={RouterLink}
          to="/my-profile"
          selected={isActive("/my-profile")}
          onClick={onNavigate}
          sx={{ gap: 1.5, px: 1, py: 1, minWidth: 0 }}
        >
          <Avatar
            src={avatar || undefined}
            alt={username}
            sx={{ width: 32, height: 32, bgcolor: tokens.surface2 }}
          >
            {!avatar && <Person fontSize="small" />}
          </Avatar>
          <ListItemText
            primary={username || "Profile"}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { fontFamily: fonts.body, fontSize: 14, fontWeight: 500 },
              },
            }}
          />
        </ListItemButton>
        <Tooltip title="Log out">
          <IconButton
            onClick={handleLogout}
            aria-label="Log out"
            sx={{ color: tokens.muted }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default Sidebar;
