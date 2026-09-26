import React, { useRef, useEffect, useState } from "react";
import { Box, Typography, IconButton, Slider } from "@mui/material";
import { PlayArrow, Pause, Favorite } from "@mui/icons-material";
import { usePlayer } from "./PlayerContext";
import songApi from "../api/song";
import { useNavigate } from "react-router-dom";

const BottomPlayer: React.FC = () => {
  const { currentSong, isPlaying, pause, resume, playNext } = usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (_: any, value: number | number[]) => {
    if (audioRef.current && typeof value === "number") {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleLike = async () => {
    if (!currentSong || isLiking) return;

    try {
      setIsLiking(true);
      await songApi.likeSong(currentSong.id);
    } catch (error) {
      console.error("Error liking song:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSongEnd = async () => {
    if (currentSong) {
      try {
        await songApi.incrementListens(currentSong.id);
      } catch (error) {
        console.error("Error incrementing listens:", error);
      }
    }
    playNext();
  };

  if (!currentSong) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "background.paper",
        boxShadow: 3,
        px: 3,
        py: 2,
        display: "flex",
        alignItems: "center",
        zIndex: 1300,
      }}
    >
      <Box
        sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
        onClick={() => navigate(`/song/${currentSong.id}`)}
      >
        <Typography variant="subtitle1" noWrap>
          {currentSong.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {currentSong.author}
        </Typography>
      </Box>
      <IconButton onClick={isPlaying ? pause : resume} sx={{ mx: 2 }}>
        {isPlaying ? <Pause /> : <PlayArrow />}
      </IconButton>
      <audio
        ref={audioRef}
        src={currentSong.audio}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ display: "none" }}
        autoPlay={isPlaying}
        onEnded={handleSongEnd}
      />
      <Slider
        min={0}
        max={duration}
        value={currentTime}
        onChange={handleSliderChange}
        sx={{ width: 200, mx: 2 }}
      />
      <Typography variant="caption" sx={{ minWidth: 50, textAlign: "right" }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </Typography>
      <IconButton
        sx={{ ml: 2 }}
        onClick={handleLike}
        disabled={isLiking}
        color={currentSong.is_liked ? "error" : "default"}
      >
        <Favorite />
      </IconButton>
    </Box>
  );
};

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default BottomPlayer;
