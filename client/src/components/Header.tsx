import React, { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Person,
  Logout,
  Add,
  QueueMusic,
  Favorite,
  LibraryMusic,
  Home,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import authApi from "../api/auth";

const pages = [
  { name: "Feed", path: "/feed", icon: <Home /> },
  { name: "Liked Songs", path: "/liked", icon: <Favorite /> },
  { name: "Liked Playlists", path: "/liked-playlists", icon: <QueueMusic /> },
];

const settings = [
  { name: "Profile", path: "/my-profile", icon: <Person /> },
  { name: "Create Song", path: "/create-song", icon: <Add /> },
  { name: "Create Playlist", path: "/create-playlist", icon: <LibraryMusic /> },
];

function Header() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  // Read user info from localStorage
  const username = localStorage.getItem("username") || "";
  const avatar = localStorage.getItem("avatar");
  const isLoggedIn = !!localStorage.getItem("token");

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    handleCloseNavMenu();
  };

  const handleSettingClick = (path: string) => {
    navigate(path);
    handleCloseUserMenu();
  };

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

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            onClick={() => navigate("/feed")}
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Musilizer
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={() => handleMenuClick(page.path)}
                >
                  <ListItemIcon>{page.icon}</ListItemIcon>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            onClick={() => navigate("/feed")}
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            MUSIC APP
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={() => handleMenuClick(page.path)}
                sx={{
                  my: 2,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                }}
                startIcon={page.icon}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            {isLoggedIn ? (
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar src={avatar || undefined} alt={username}>
                      {!avatar && <Person />}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem disabled>
                    <ListItemIcon>
                      <Avatar
                        src={avatar || undefined}
                        alt={username}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      >
                        {!avatar && <Person />}
                      </Avatar>
                    </ListItemIcon>
                    <Typography textAlign="center">{username}</Typography>
                  </MenuItem>
                  {settings.map((setting) => (
                    <MenuItem
                      key={setting.name}
                      onClick={() => handleSettingClick(setting.path)}
                    >
                      <ListItemIcon>{setting.icon}</ListItemIcon>
                      <Typography textAlign="center">{setting.name}</Typography>
                    </MenuItem>
                  ))}
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout />
                    </ListItemIcon>
                    <Typography textAlign="center">Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Avatar src={avatar || undefined} alt={username}>
                {!avatar && <Person />}
              </Avatar>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
