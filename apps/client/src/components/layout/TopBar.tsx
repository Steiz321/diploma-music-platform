import React, { useState } from "react";
import { Avatar, Box, IconButton, InputBase } from "@mui/material";
import { Menu as MenuIcon, Person, Search } from "@mui/icons-material";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { tokens } from "../../theme/tokens";

interface TopBarProps {
  /** opens the sidebar drawer below the md breakpoint */
  onMenuClick: () => void;
}

const pillSx = {
  bgcolor: tokens.surface,
  border: `1px solid ${tokens.inputBorder}`,
  borderRadius: 999,
} as const;

function SearchField() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  // keep the text of the current search while on the results page
  const [value, setValue] = useState(
    pathname === "/search" ? searchParams.get("q") ?? "" : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <Box
      component="form"
      role="search"
      onSubmit={handleSubmit}
      sx={{
        ...pillSx,
        flex: "1 1 320px",
        maxWidth: 520,
        minWidth: 0,
        height: 48,
        px: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        color: tokens.subtle,
        "&:focus-within": { borderColor: "primary.main" },
      }}
    >
      <Search fontSize="small" />
      <InputBase
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search songs, artists or a mood"
        inputProps={{ "aria-label": "Search" }}
        sx={{ flex: 1, minWidth: 0, fontSize: 15 }}
      />
    </Box>
  );
}

function TopBar({ onMenuClick }: TopBarProps) {
  const [searchParams] = useSearchParams();
  const username = localStorage.getItem("username") || "";
  const avatar = localStorage.getItem("avatar");

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: "1 1 320px", minWidth: 0 }}>
        <IconButton
          onClick={onMenuClick}
          aria-label="Open navigation"
          sx={{ display: { xs: "inline-flex", md: "none" }, color: tokens.text }}
        >
          <MenuIcon />
        </IconButton>
        {/* remount on a new query so the field shows it */}
        <SearchField key={searchParams.get("q") ?? ""} />
      </Box>
      <Box
        component={RouterLink}
        to="/my-profile"
        aria-label="Your profile"
        sx={{
          ...pillSx,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          py: 0.5,
          pl: 0.5,
          pr: 1.75,
          color: tokens.text,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 500,
          "&:hover": { borderColor: tokens.lineStrong },
        }}
      >
        <Avatar
          src={avatar || undefined}
          alt={username}
          sx={{ width: 36, height: 36, bgcolor: tokens.surface2, color: tokens.text }}
        >
          {username ? username[0].toUpperCase() : <Person fontSize="small" />}
        </Avatar>
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          {username}
        </Box>
      </Box>
    </Box>
  );
}

export default TopBar;
