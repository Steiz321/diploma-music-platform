import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Avatar,
} from "@mui/material";
import { QueueMusic, Favorite } from "@mui/icons-material";
import { Playlist } from "../api/playlist";
import playlistApi from "../api/playlist";

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

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${playlist.user_id}`);
  };

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

  return (
    <Card
      sx={{
        maxWidth: 345,
        cursor: "pointer",
        transition: "transform 0.2s",
        "&:hover": {
          transform: "scale(1.02)",
        },
      }}
      onClick={handleClick}
    >
      <CardMedia
        component="img"
        height="200"
        image={playlist.cover_url}
        alt={playlist.title}
      />
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <QueueMusic sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            {playlist.title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleLike}
            disabled={isLiking}
            color={isLiked ? "error" : "default"}
          >
            <Favorite />
          </IconButton>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
          onClick={handleUserClick}
        >
          <Avatar
            src={playlist.user.avatar}
            alt={playlist.user.username}
            sx={{ width: 24, height: 24, mr: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {playlist.user.username}
          </Typography>
        </Box>
        {playlist.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {playlist.description}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {playlist.songs_count} {playlist.songs_count === 1 ? "song" : "songs"}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PlaylistCard;
