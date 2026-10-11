import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Card, Chip, IconButton, Link, Typography } from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  Pause,
  PlayArrow,
} from "@mui/icons-material";
import songApi, { Song } from "../api/song";
import { usePlayer } from "../player/usePlayer";
import type { PlaybackSource } from "../tracking";
import { tokens } from "../theme/tokens";
import CoverArt from "./CoverArt";
import { toPlayerSong } from "./playerSong";

interface SongCardProps {
  song: Song;
  songs?: Song[];
  index?: number;
  /** where the card is shown, for player events */
  source: PlaybackSource;
  /** a line under the title, e.g. why the song is recommended */
  caption?: string;
}

const formatListens = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const SongCard: React.FC<SongCardProps> = ({
  song,
  songs,
  index,
  source,
  caption,
}) => {
  const navigate = useNavigate();
  const { playSong, currentSong, isPlaying, pause, resume } = usePlayer();
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(song.is_liked);

  const handleClick = () => {
    navigate(`/song/${song.id}`);
  };

  // links inside the card navigate themselves
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const isCurrent = currentSong?.id === song.id;
  const showPause = isCurrent && isPlaying;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong(
        toPlayerSong(song),
        songs?.map(toPlayerSong) || [],
        index,
        source
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

  const tags = song.tags;
  const listens = `${formatListens(song.listens)} ${song.listens === 1 ? "listen" : "listens"}`;

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
      <CoverArt id={song.id} src={song.cover_url}>
        {tags?.language && (
          <Box
            component="span"
            sx={{
              position: "absolute",
              left: 10,
              top: 10,
              px: 1,
              py: "3px",
              borderRadius: "6px",
              bgcolor: `${tokens.bg}CC`,
              color: tokens.text,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {tags.language}
          </Box>
        )}
        <IconButton
          onClick={handlePlayPause}
          aria-label={`${showPause ? "Pause" : "Play"} ${song.name}`}
          sx={{
            position: "absolute",
            right: 10,
            bottom: 10,
            width: 44,
            height: 44,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { bgcolor: "primary.light" },
          }}
        >
          {showPause ? <Pause /> : <PlayArrow />}
        </IconButton>
      </CoverArt>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, px: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Link
            component={RouterLink}
            to={`/song/${song.id}`}
            onClick={stop}
            sx={{
              fontWeight: 600,
              fontSize: 15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {song.name}
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
            <Link component={RouterLink} to={`/profile/${song.user_id}`} onClick={stop}>
              {song.user.username}
            </Link>
            {` · ${listens}`}
          </Typography>
        </Box>
        <IconButton
          onClick={handleLike}
          disabled={isLiking}
          aria-label={isLiked ? `Unlike ${song.name}` : `Like ${song.name}`}
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

      {caption && (
        <Typography sx={{ px: 0.5, fontSize: 12, color: tokens.muted, mt: -0.5 }}>
          {caption}
        </Typography>
      )}

      {tags && (tags.mood.length > 0 || tags.energy) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, px: 0.5, pb: 0.5 }}>
          {tags.mood.slice(0, 2).map((mood) => (
            <Chip key={mood} label={mood.replace(/_/g, " ")} />
          ))}
          {tags.energy && (
            <Chip variant="outlined" label={`${tags.energy} energy`} />
          )}
        </Box>
      )}
    </Card>
  );
};

export default SongCard;
