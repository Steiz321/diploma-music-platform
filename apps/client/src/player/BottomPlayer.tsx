import React, { useRef, useEffect, useState } from "react";
import { Box, Typography, IconButton, Slider, Button, Link } from "@mui/material";
import {
  PlayArrow,
  Pause,
  Favorite,
  FavoriteBorder,
  SkipNext,
  SkipPrevious,
  Notes,
  VolumeUp,
  VolumeOff,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { usePlayer, usePlayerProgress } from "./usePlayer";
import { usePlaybackTracking } from "./usePlaybackTracking";
import { useSongLike } from "../likes/useSongLike";
import songApi from "../api/song";
import { coverColor, tokens } from "../theme/tokens";

const BottomPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    pause,
    resume,
    playNext,
    playPrev,
    hasNext,
    hasPrev,
    playId,
    source,
    setProgress,
    registerSeek,
  } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracking = usePlaybackTracking({
    audioRef,
    playId,
    songId: currentSong?.id ?? null,
    source,
  });
  // the queued song is a copy taken when it started; the store has the
  // likes toggled anywhere since
  const {
    isLiked,
    isLiking,
    toggle: handleLike,
  } = useSongLike(currentSong?.id ?? null, currentSong?.is_liked ?? false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
    tracking.onTimeUpdate();
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime, audioRef.current.duration);
    }
  };

  const handleSliderChange = (_: Event, value: number | number[]) => {
    if (audioRef.current && typeof value === "number") {
      tracking.onSeekChange();
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  // seek requested from outside the player (a click on a lyrics line):
  // reported like one drag of the slider
  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    tracking.onSeekChange();
    audio.currentTime = seconds;
    setProgress(seconds);
    tracking.onSeekCommitted(seconds);
  };
  const seekToRef = useRef(seekTo);
  useEffect(() => {
    seekToRef.current = seekTo;
  });
  useEffect(() => {
    registerSeek((seconds) => seekToRef.current(seconds));
    return () => registerSeek(null);
  }, [registerSeek]);

  const handleSliderCommitted = (
    _: React.SyntheticEvent | Event,
    value: number | number[]
  ) => {
    if (typeof value === "number") {
      tracking.onSeekCommitted(value);
    }
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    if (typeof value === "number") {
      setVolume(value);
      setMuted(value === 0);
    }
  };

  const handleSongEnd = async () => {
    tracking.onEnded();
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

  const songPath = `/song/${currentSong.id}`;
  // streams without a known length report Infinity
  const seekMax = Number.isFinite(duration) ? duration : 0;

  return (
    <Box
      component="footer"
      aria-label="Player"
      sx={{
        flex: "none",
        zIndex: (theme) => theme.zIndex.appBar,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 4,
        rowGap: 1.5,
        px: "clamp(16px, 3vw, 28px)",
        py: 1.75,
        bgcolor: tokens.player,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {/* now playing: cover, title / artist, like */}
      <Box
        sx={{
          flex: "1 1 240px",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 1.75,
        }}
      >
        <Box
          component={RouterLink}
          to={songPath}
          aria-hidden
          tabIndex={-1}
          sx={{
            width: 56,
            height: 56,
            flex: "none",
            borderRadius: "10px",
            bgcolor: coverColor(currentSong.id),
            backgroundImage: currentSong.cover_url
              ? `url(${currentSong.cover_url})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: `0 0 0 3px ${tokens.accent}33`,
          }}
        />
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Link
            component={RouterLink}
            to={songPath}
            noWrap
            sx={{ fontWeight: 600, fontSize: 15 }}
          >
            {currentSong.name}
          </Link>
          <Typography variant="body2" color="text.secondary" noWrap>
            {currentSong.author}
          </Typography>
        </Box>
        <IconButton
          onClick={handleLike}
          disabled={isLiking}
          aria-label={isLiked ? "Unlike" : "Like"}
          sx={{ color: isLiked ? "primary.main" : "text.secondary" }}
        >
          {isLiked ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
      </Box>

      {/* transport and progress */}
      <Box
        sx={{
          flex: "2 1 360px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.25,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={playPrev}
            disabled={!hasPrev}
            aria-label="Previous"
            sx={{ color: tokens.textSecondary }}
          >
            <SkipPrevious />
          </IconButton>
          <IconButton
            onClick={isPlaying ? pause : resume}
            aria-label={isPlaying ? "Pause" : "Play"}
            sx={{
              width: 48,
              height: 48,
              bgcolor: tokens.text,
              color: tokens.bg,
              "&:hover": { bgcolor: tokens.textSecondary },
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          {/* a skip is the negative signal for recommendations */}
          <IconButton
            onClick={playNext}
            disabled={!hasNext}
            aria-label="Next"
            sx={{ color: tokens.textSecondary }}
          >
            <SkipNext />
          </IconButton>
        </Box>
        <Box
          sx={{
            width: "100%",
            maxWidth: 560,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            fontSize: 12,
            color: tokens.subtle,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <Slider
            min={0}
            max={seekMax}
            value={Math.min(currentTime, seekMax)}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderCommitted}
            aria-label="Seek"
            size="small"
            sx={{ flex: 1 }}
          />
          <span>{formatTime(seekMax)}</span>
        </Box>
      </Box>

      {/* lyrics and volume */}
      <Box
        sx={{
          flex: "1 1 240px",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        <Button
          component={RouterLink}
          to={songPath}
          variant="outlined"
          size="small"
          startIcon={<Notes fontSize="small" />}
          sx={{ height: 40 }}
        >
          Lyrics
        </Button>
        <IconButton
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          sx={{ color: tokens.textSecondary }}
        >
          {muted ? <VolumeOff /> : <VolumeUp />}
        </IconButton>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
          size="small"
          sx={{ width: 96, display: { xs: "none", sm: "block" } }}
        />
      </Box>

      <audio
        ref={audioRef}
        src={currentSong.audio}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ display: "none" }}
        autoPlay={isPlaying}
        onEnded={handleSongEnd}
        onPlaying={tracking.onPlaying}
        onPause={tracking.onPause}
      />
    </Box>
  );
};

function formatTime(time: number) {
  if (!Number.isFinite(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default BottomPlayer;
