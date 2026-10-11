import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Card, IconButton, Link, Typography } from "@mui/material";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { Playlist } from "../api/playlist";
import playlistApi from "../api/playlist";
import { tokens } from "../theme/tokens";
import CoverArt from "./CoverArt";

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(playlist.is_liked);

  const handleClick = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  // links inside the card navigate themselves
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;

    try {
      setIsLiking(true);
      await playlistApi.likePlaylist(playlist.id);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking playlist:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const count = playlist.songs_count;

  return (
    <Card
      component="article"
      onClick={handleClick}
      sx={{
        cursor: "pointer",
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minWidth: 0,
        transition: "border-color 0.2s",
        "&:hover": { borderColor: tokens.lineStrong },
      }}
    >
      <CoverArt id={playlist.id} src={playlist.cover_url} />

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, px: 0.5, pb: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Link
            component={RouterLink}
            to={`/playlist/${playlist.id}`}
            onClick={stop}
            sx={{
              fontWeight: 600,
              fontSize: 15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {playlist.title}
          </Link>
          <Typography
            variant="body2"
            sx={{
              fontSize: 13,
              color: tokens.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <Link component={RouterLink} to={`/profile/${playlist.user_id}`} onClick={stop}>
              {playlist.user.username}
            </Link>
            {typeof count === "number" &&
              ` · ${count} ${count === 1 ? "song" : "songs"}`}
          </Typography>
        </Box>
        <IconButton
          onClick={handleLike}
          disabled={isLiking}
          aria-label={isLiked ? `Unlike ${playlist.title}` : `Like ${playlist.title}`}
          aria-pressed={isLiked}
          sx={{
            width: 44,
            height: 44,
            mt: -0.75,
            mr: -0.75,
            color: isLiked ? "primary.main" : tokens.subtle,
          }}
        >
          {isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
        </IconButton>
      </Box>
    </Card>
  );
};

export default PlaylistCard;
