import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Typography,
  Box,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Link,
  Tooltip,
} from "@mui/material";
import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  Pause,
  Person,
  PlaylistAdd,
  DeleteOutline,
} from "@mui/icons-material";
import songApi, { Song } from "../api/song";
import { usePlayer } from "../player/usePlayer";
import BackButton from "../components/BackButton";
import AddToPlaylistDialog from "../components/AddToPlaylistDialog";
import CoverArt from "../components/CoverArt";
import { WaveformIcon } from "../components/layout/Logo";
import LyricsPanel from "../lyrics/LyricsPanel";
import RecommendedSongsSection from "../recommendations/RecommendedSongsSection";
import { fonts, tokens } from "../theme/tokens";

const LYRICS_POLL_INTERVAL_MS = 5000;

const formatTag = (tag: string) =>
  (tag.charAt(0).toUpperCase() + tag.slice(1)).replace(/_/g, " ");

const formatListens = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const formatDate = (date: Date): string =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/** round icon button of the action row (44px target) */
const actionSx = {
  width: 48,
  height: 48,
  bgcolor: tokens.surface2,
  color: tokens.textSecondary,
  "&:hover": { bgcolor: tokens.lineStrong, color: tokens.text },
} as const;

const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const { playSong, currentSong, isPlaying, pause, resume } = usePlayer();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const currentUserId = Number(localStorage.getItem("user_id"));

  useEffect(() => {
    const fetchSong = async () => {
      try {
        if (!id) return;
        const data = await songApi.getSongById(parseInt(id));
        setSong(data);
      } catch (err) {
        setError("Failed to load song");
        console.error("Error fetching song:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [id]);

  // lyrics and tags arrive asynchronously from the AI enrichment service
  const isProcessing = song?.transcription_status === "pending";
  useEffect(() => {
    if (!id || !isProcessing) return;

    const timer = setInterval(async () => {
      try {
        const data = await songApi.getSongById(parseInt(id));
        if (data.transcription_status !== "pending") {
          setSong((prev) =>
            prev
              ? {
                  ...prev,
                  text: data.text,
                  tags: data.tags,
                  language: data.language,
                  lyrics: data.lyrics,
                  transcription_status: data.transcription_status,
                }
              : data
          );
        }
      } catch (err) {
        console.error("Error refreshing song:", err);
      }
    }, LYRICS_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [id, isProcessing]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress aria-label="Loading song" />
      </Box>
    );
  }

  if (error || !song) {
    return <Typography color="error">{error || "Song not found"}</Typography>;
  }

  const isOwner = currentUserId === song.user_id;

  const isCurrent = currentSong?.id === song.id;
  const showPause = isCurrent && isPlaying;

  const handlePlayPause = () => {
    if (isCurrent) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      const playerSong = {
        id: song.id,
        name: song.name,
        author: song.user.username,
        audio: song.audio,
        is_liked: song.is_liked,
        cover_url: song.cover_url,
      };
      playSong(playerSong, [playerSong], 0, { type: "song_page" });
    }
  };

  const handleLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      await songApi.likeSong(song.id);
      setSong((prev) => (prev ? { ...prev, is_liked: !prev.is_liked } : null));
    } catch (error) {
      console.error("Error liking song:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await songApi.deleteSong(song.id);
      setDeleteSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      console.error("Error deleting song:", err);
      setDeleteError("Failed to delete song");
    } finally {
      setDeleting(false);
    }
  };

  const tags = song.tags;
  const language = song.language ?? tags?.language ?? null;
  const listensLabel = `${formatListens(song.listens)} ${
    song.listens === 1 ? "listen" : "listens"
  }`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BackButton />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 5fr) minmax(0, 6fr)",
            },
            gap: { xs: 3, md: 5 },
            alignItems: "start",
          }}
        >
          {/* cover and info */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <CoverArt
              id={song.id}
              src={song.cover_url}
              ring={28}
              sx={{
                width: "100%",
                borderRadius: "20px",
                maxWidth: { xs: 320, md: 440 },
                boxShadow: `0 0 0 1px ${tokens.cardBorder}`,
              }}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                component="span"
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: tokens.subtle,
                }}
              >
                Song
              </Typography>
              <Typography
                variant="h2"
                component="h1"
                sx={{ fontFamily: fonts.heading, overflowWrap: "anywhere" }}
              >
                {song.name}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  columnGap: 1.5,
                  rowGap: 1,
                  color: tokens.muted,
                  fontSize: 14,
                }}
              >
                <Link
                  component={RouterLink}
                  to={`/profile/${song.user_id}`}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    minHeight: 44,
                    "&, &:visited": { color: tokens.text },
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  <Avatar
                    src={song.user.avatar ?? undefined}
                    alt=""
                    sx={{ width: 32, height: 32, bgcolor: tokens.surface2 }}
                  >
                    <Person fontSize="small" />
                  </Avatar>
                  {song.user.username}
                </Link>
                <span aria-hidden>·</span>
                <span>{listensLabel}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(song.created_at)}</span>
              </Box>
            </Box>

            {/* actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconButton
                onClick={handlePlayPause}
                aria-label={showPause ? "Pause" : "Play"}
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.light" },
                }}
              >
                {showPause ? (
                  <Pause fontSize="large" />
                ) : (
                  <PlayArrow fontSize="large" />
                )}
              </IconButton>
              <IconButton
                onClick={handleLike}
                disabled={isLiking}
                aria-label={song.is_liked ? "Unlike" : "Like"}
                aria-pressed={song.is_liked}
                sx={{
                  ...actionSx,
                  color: song.is_liked ? "primary.main" : actionSx.color,
                }}
              >
                {song.is_liked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <Tooltip title="Add to playlist">
                <IconButton
                  onClick={() => setAddToPlaylistOpen(true)}
                  aria-label="Add to playlist"
                  sx={actionSx}
                >
                  <PlaylistAdd />
                </IconButton>
              </Tooltip>
              {isOwner && (
                <Tooltip title="Delete song">
                  <IconButton
                    onClick={() => setDeleteDialogOpen(true)}
                    aria-label="Delete song"
                    sx={{
                      ...actionSx,
                      "&:hover": { bgcolor: tokens.lineStrong, color: "error.main" },
                    }}
                  >
                    <DeleteOutline />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* tags from the AI analysis of the lyrics */}
            {(tags || isProcessing) && (
              <Box
                component="section"
                aria-labelledby="about-heading"
                sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
              >
                <Typography
                  id="about-heading"
                  component="h2"
                  sx={{
                    m: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "primary.main",
                  }}
                >
                  <WaveformIcon size={14} />
                  What this song is about
                </Typography>
                {tags ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {tags.mood.map((tag) => (
                      <Chip key={`mood-${tag}`} label={formatTag(tag)} />
                    ))}
                    {tags.topics.map((tag) => (
                      <Chip
                        key={`topic-${tag}`}
                        label={formatTag(tag)}
                        variant="outlined"
                      />
                    ))}
                    {tags.energy && (
                      <Chip
                        label={`${formatTag(tags.energy)} energy`}
                        variant="outlined"
                      />
                    )}
                    {language && (
                      <Chip
                        label={language.toUpperCase()}
                        variant="outlined"
                        aria-label={`Language: ${language}`}
                      />
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Tags will appear once the song is analysed.
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <LyricsPanel song={song} isCurrent={isCurrent} />
        </Box>
      </Box>

      <RecommendedSongsSection
        title="Similar tracks"
        fallbackTitle="You may also like"
        kind="similar"
        load={() => songApi.getSimilar(song.id, 6)}
        reloadKey={song.id}
      />

      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        songId={song.id}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-song-title"
      >
        <DialogTitle id="delete-song-title">Delete song</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete this song? This action cannot be
            undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
          {deleteSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Song deleted!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SongDetail;
