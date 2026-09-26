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
  Tooltip,
} from "@mui/material";
import {
  PlayArrow,
  Favorite,
  Pause,
  MusicNote,
  Person,
  Headphones,
} from "@mui/icons-material";
import songApi, { Song } from "../api/song";
import { usePlayer } from "../player/PlayerContext";

interface SongCardProps {
  song: Song;
  songs?: Song[];
  index?: number;
}

const SongCard: React.FC<SongCardProps> = ({ song, songs, index }) => {
  const navigate = useNavigate();
  const { playSong, currentSong, isPlaying, pause, resume } = usePlayer();
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(song.is_liked);
  const [listens, setListens] = useState(song.listens);

  const handleClick = () => {
    navigate(`/song/${song.id}`);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${song.user_id}`);
  };

  const isCurrent = currentSong && currentSong.id === song.id;

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong(
        {
          id: song.id,
          name: song.name,
          author: song.user.username,
          audio: song.audio,
          is_liked: song.is_liked,
        },
        songs?.map((s) => ({
          id: s.id,
          name: s.name,
          author: s.user.username,
          audio: s.audio,
          is_liked: s.is_liked,
        })) || [],
        index
      );
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;

    try {
      setIsLiking(true);
      await songApi.likeSong(song.id);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking song:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatListens = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
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
        display: "flex",
        flexDirection: "column",
      }}
      onClick={handleClick}
    >
      <CardMedia
        component="img"
        height="200"
        image={song.cover_url}
        alt={song.name}
        sx={{
          objectFit: "cover",
        }}
      />
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <MusicNote sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            {song.name}
          </Typography>
          <Box>
            <IconButton
              size="small"
              onClick={handlePlayPause}
              color="primary"
              sx={{ mr: 0.5 }}
            >
              {isCurrent && isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleLike}
              disabled={isLiking}
              color={isLiked ? "error" : "default"}
            >
              <Favorite />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
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
            {song.user.avatar ? (
              <Avatar
                src={song.user.avatar}
                alt={song.user.username}
                sx={{ width: 24, height: 24, mr: 1 }}
              />
            ) : (
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                <Person fontSize="small" />
              </Avatar>
            )}
            <Typography variant="body2" color="text.secondary">
              {song.user.username}
            </Typography>
          </Box>
          <Tooltip title="Listens">
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Headphones
                sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatListens(listens)}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
        {song.text && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {song.text}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default SongCard;
