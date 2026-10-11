import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Typography,
  Box,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
  Link,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Favorite,
  FavoriteBorder,
  DeleteOutline,
  Edit,
  RemoveCircleOutline,
  GraphicEq,
  Person,
} from "@mui/icons-material";
import playlistApi, { Playlist } from "../api/playlist";
import songApi from "../api/song";
import { usePlayer } from "../player/usePlayer";
import type { PlayerSong } from "../player/usePlayer";
import BackButton from "../components/BackButton";
import CoverArt from "../components/CoverArt";
import { tokens } from "../theme/tokens";

type PlaylistSong = Playlist["songs"][number];

const toPlayerSong = (song: PlaylistSong): PlayerSong => ({
  id: song.id,
  name: song.name,
  author: song.user.username,
  audio: song.audio,
  is_liked: song.is_liked,
  cover_url: song.cover_url,
});

/** round icon button of the header (44px target) */
const actionSx = {
  width: 48,
  height: 48,
  bgcolor: tokens.surface2,
  color: tokens.textSecondary,
  "&:hover": { bgcolor: tokens.lineStrong, color: tokens.text },
} as const;

const PlaylistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentSong, isPlaying, playSong, pause, resume, source } =
    usePlayer();
  const [likingStates, setLikingStates] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    is_private: false,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [removingSongId, setRemovingSongId] = useState<number | null>(null);

  const currentUserId = Number(localStorage.getItem("user_id"));
  const isOwner = playlist && currentUserId === playlist.user.id;

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        if (!id) {
          setError("Playlist ID not found");
          setLoading(false);
          return;
        }

        const data = await playlistApi.getPlaylistById(parseInt(id));
        setPlaylist(data);
        setIsLiked(data.is_liked);
      } catch (err) {
        console.error("Error fetching playlist:", err);
        setError("Failed to load playlist");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  const songs: PlaylistSong[] = Array.isArray(playlist?.songs)
    ? playlist.songs
    : [];

  const handlePlayPause = (song: PlaylistSong, index: number) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong(toPlayerSong(song), songs.map(toPlayerSong), index, {
        type: "playlist",
        id: playlist?.id,
      });
    }
  };

  // the queue in the player came from this playlist
  const isQueueOfPlaylist =
    !!playlist &&
    source.type === "playlist" &&
    source.id === playlist.id &&
    songs.some((s) => s.id === currentSong?.id);

  const handlePlayAll = () => {
    if (isQueueOfPlaylist) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else if (songs.length > 0) {
      handlePlayPause(songs[0], 0);
    }
  };

  const handleLike = async (song: PlaylistSong) => {
    if (likingStates[song.id]) return;

    try {
      setLikingStates((prev) => ({ ...prev, [song.id]: true }));
      await songApi.likeSong(song.id);
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              songs: prev.songs.map((s) =>
                s.id === song.id ? { ...s, is_liked: !s.is_liked } : s
              ),
            }
          : null
      );
    } catch (error) {
      console.error("Error liking song:", error);
    } finally {
      setLikingStates((prev) => ({ ...prev, [song.id]: false }));
    }
  };

  const handlePlaylistLike = async () => {
    if (isLiking) return;

    try {
      setIsLiking(true);
      await playlistApi.likePlaylist(parseInt(id!));
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking playlist:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await playlistApi.deletePlaylist(playlist!.id);
      setDeleteSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      console.error("Error deleting playlist:", err);
      setDeleteError("Failed to delete playlist");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = () => {
    if (!playlist) return;
    setEditForm({
      title: playlist.title,
      description: playlist.description ?? "",
      is_private: playlist.is_private ?? false,
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!playlist || !editForm.title.trim()) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await playlistApi.updatePlaylist(playlist.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        is_private: editForm.is_private,
      });
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              title: updated.title,
              description: updated.description,
              is_private: updated.is_private,
            }
          : null
      );
      setEditOpen(false);
    } catch {
      setEditError("Failed to save the playlist");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSong = async (song: PlaylistSong) => {
    if (!playlist || removingSongId) return;
    setRemovingSongId(song.id);
    try {
      await playlistApi.removeSongFromPlaylist(playlist.id, song.id);
      setPlaylist((prev) =>
        prev
          ? { ...prev, songs: prev.songs.filter((s) => s.id !== song.id) }
          : null
      );
    } catch (error) {
      console.error("Error removing song from playlist:", error);
    } finally {
      setRemovingSongId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress aria-label="Loading playlist" />
      </Box>
    );
  }

  if (error || !playlist) {
    return (
      <Typography color="error">{error || "Playlist not found"}</Typography>
    );
  }

  const showPauseAll = isQueueOfPlaylist && isPlaying;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <BackButton />

      {/* header */}
      <Box
        component="header"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "flex-end" },
          gap: { xs: 3, sm: 4 },
          p: { xs: 2.5, sm: 4 },
          borderRadius: "24px",
          bgcolor: tokens.surface,
          border: `1px solid ${tokens.line}`,
        }}
      >
        <CoverArt
          id={playlist.id}
          src={playlist.cover_url}
          ring={22}
          sx={{ width: { xs: 180, sm: 220 }, borderRadius: "16px" }}
        />
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
              Playlist
            </Typography>
            {playlist.is_private && <Chip label="Private" variant="outlined" />}
          </Box>
          <Typography
            variant="h2"
            component="h1"
            sx={{ overflowWrap: "anywhere" }}
          >
            {playlist.title}
          </Typography>
          {playlist.description && (
            <Typography sx={{ color: tokens.muted, maxWidth: "60ch" }}>
              {playlist.description}
            </Typography>
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              columnGap: 1.5,
              color: tokens.muted,
              fontSize: 14,
            }}
          >
            <Link
              component={RouterLink}
              to={`/profile/${playlist.user.id}`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                minHeight: 44,
                "&, &:visited": { color: tokens.text },
                fontWeight: 600,
              }}
            >
              <Avatar
                src={playlist.user.avatar || undefined}
                alt=""
                sx={{ width: 28, height: 28, bgcolor: tokens.surface2 }}
              >
                <Person fontSize="small" />
              </Avatar>
              {playlist.user.username}
            </Link>
            <span aria-hidden>·</span>
            <span>
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </span>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
              mt: 1,
            }}
          >
            <Button
              variant="contained"
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              startIcon={showPauseAll ? <Pause /> : <PlayArrow />}
              sx={{ height: 48, px: 3, fontSize: 15 }}
            >
              {showPauseAll ? "Pause" : "Play all"}
            </Button>
            <IconButton
              onClick={handlePlaylistLike}
              disabled={isLiking}
              aria-label={isLiked ? "Unlike playlist" : "Like playlist"}
              aria-pressed={isLiked}
              sx={{
                ...actionSx,
                color: isLiked ? "primary.main" : actionSx.color,
              }}
            >
              {isLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            {isOwner && (
              <>
                <Tooltip title="Edit playlist">
                  <IconButton
                    onClick={openEdit}
                    aria-label="Edit playlist"
                    sx={actionSx}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete playlist">
                  <IconButton
                    onClick={() => setDeleteDialogOpen(true)}
                    aria-label="Delete playlist"
                    sx={{
                      ...actionSx,
                      "&:hover": {
                        bgcolor: tokens.lineStrong,
                        color: "error.main",
                      },
                    }}
                  >
                    <DeleteOutline />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* track list */}
      <Box component="section" aria-labelledby="tracks-heading">
        <Typography id="tracks-heading" variant="h5" component="h2" sx={{ mb: 1.5 }}>
          Songs
        </Typography>

        {songs.length === 0 ? (
          <Typography color="text.secondary">
            No songs in this playlist yet.
          </Typography>
        ) : (
          <Box
            component="ol"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0.75,
              borderRadius: "18px",
              bgcolor: tokens.card,
              border: `1px solid ${tokens.cardBorder}`,
            }}
          >
            {songs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              const showPause = isCurrent && isPlaying;
              return (
                <Box
                  component="li"
                  key={song.id}
                  aria-current={isCurrent ? "true" : undefined}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1, sm: 1.75 },
                    px: { xs: 0.75, sm: 1.5 },
                    py: 0.75,
                    borderRadius: "12px",
                    bgcolor: isCurrent ? tokens.surface2 : "transparent",
                    "&:hover": { bgcolor: tokens.surface2 },
                    "&:hover .track-index, & .track-play:focus-visible .track-index":
                      { display: "none" },
                    "&:hover .track-icon, & .track-play:focus-visible .track-icon":
                      { display: "flex" },
                  }}
                >
                  {/* index; the play icon on hover / keyboard focus */}
                  <IconButton
                    className="track-play"
                    onClick={() => handlePlayPause(song, idx)}
                    aria-label={`${showPause ? "Pause" : "Play"} ${song.name}`}
                    sx={{
                      width: 44,
                      height: 44,
                      flex: "none",
                      fontSize: 14,
                      fontVariantNumeric: "tabular-nums",
                      color: isCurrent ? "primary.main" : tokens.subtle,
                      "&:hover": { bgcolor: "transparent" },
                    }}
                  >
                    <Box
                      component="span"
                      className="track-index"
                      sx={{ display: "flex" }}
                    >
                      {isCurrent ? <GraphicEq fontSize="small" /> : idx + 1}
                    </Box>
                    <Box
                      component="span"
                      className="track-icon"
                      sx={{ display: "none", color: tokens.text }}
                    >
                      {showPause ? <Pause /> : <PlayArrow />}
                    </Box>
                  </IconButton>
                  <CoverArt
                    id={song.id}
                    src={song.cover_url}
                    ring={4}
                    sx={{ width: 44, borderRadius: "8px" }}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Link
                      component={RouterLink}
                      to={`/song/${song.id}`}
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: 15,
                        "&, &:visited": { color: isCurrent ? "primary.main" : tokens.text },
                      }}
                    >
                      {song.name}
                    </Link>
                    <Link
                      component={RouterLink}
                      to={`/profile/${song.user.id}`}
                      noWrap
                      sx={{ fontSize: 13, "&, &:visited": { color: tokens.muted } }}
                    >
                      {song.user.username}
                    </Link>
                  </Box>
                  {isOwner && (
                    <Tooltip title="Remove from playlist">
                      <IconButton
                        onClick={() => handleRemoveSong(song)}
                        disabled={removingSongId === song.id}
                        aria-label={`Remove ${song.name} from playlist`}
                        sx={{ width: 44, height: 44, color: tokens.subtle }}
                      >
                        <RemoveCircleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton
                    onClick={() => handleLike(song)}
                    disabled={likingStates[song.id]}
                    aria-label={
                      song.is_liked ? `Unlike ${song.name}` : `Like ${song.name}`
                    }
                    aria-pressed={song.is_liked}
                    sx={{
                      width: 44,
                      height: 44,
                      color: song.is_liked ? "primary.main" : tokens.subtle,
                    }}
                  >
                    {song.is_liked ? (
                      <Favorite fontSize="small" />
                    ) : (
                      <FavoriteBorder fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Edit Playlist Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="edit-playlist-title"
      >
        <DialogTitle id="edit-playlist-title">Edit playlist</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={editForm.title}
            onChange={(e) =>
              setEditForm((form) => ({ ...form, title: e.target.value }))
            }
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((form) => ({
                ...form,
                description: e.target.value,
              }))
            }
            fullWidth
            multiline
            minRows={2}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editForm.is_private}
                onChange={(e) =>
                  setEditForm((form) => ({
                    ...form,
                    is_private: e.target.checked,
                  }))
                }
              />
            }
            label="Private"
          />
          {editError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {editError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setEditOpen(false)}
            disabled={saving}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !editForm.title.trim()}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-playlist-title"
      >
        <DialogTitle id="delete-playlist-title">Delete playlist</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete this playlist? This action cannot
            be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
          {deleteSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Playlist deleted!
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

export default PlaylistDetails;
