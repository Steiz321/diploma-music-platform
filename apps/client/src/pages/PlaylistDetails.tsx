import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Avatar,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
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
} from "@mui/material";
import {
  PlayArrow,
  QueueMusic,
  Person,
  AccessTime,
  Pause,
  Favorite,
  Delete,
  Edit,
  RemoveCircleOutline,
} from "@mui/icons-material";
import playlistApi, { Playlist } from "../api/playlist";
import songApi, { Song } from "../api/song";
import { usePlayer } from "../player/PlayerContext";
import BackButton from "../components/BackButton";

const PlaylistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentSong, isPlaying, playSong, pause, resume } = usePlayer();
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
        console.log("Playlist data:", data);
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

  const handleUserClick = () => {
    if (playlist) {
      navigate(`/profile/${playlist.user.id}`);
    }
  };

  const handleSongClick = (song: Song, index: number, songs: Song[]) => {
    navigate(`/song/${song.id}`);
  };

  const handlePlayPause = (
    e: React.MouseEvent,
    song: Song,
    index: number,
    songs: Song[]
  ) => {
    e.stopPropagation();
    if (currentSong?.id === song.id) {
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
        songs.map((s) => ({
          id: s.id,
          name: s.name,
          author: s.user.username,
          audio: s.audio,
          is_liked: s.is_liked,
        })),
        index,
        { type: "playlist", id: playlist?.id }
      );
    }
  };

  const handleLike = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (likingStates[song.id]) return;

    try {
      setLikingStates((prev) => ({ ...prev, [song.id]: true }));
      await songApi.likeSong(song.id);
      // Update the song's is_liked status in the local state
      const updatedSongs = songs.map((s) =>
        s.id === song.id ? { ...s, is_liked: !s.is_liked } : s
      );
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

  const handlePlaylistLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleRemoveSong = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
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

  // Transform playlist songs to match the Song type
  const transformSongs = (playlistSongs: Playlist["songs"]): Song[] => {
    if (!Array.isArray(playlistSongs)) {
      console.warn("playlistSongs is not an array:", playlistSongs);
      return [];
    }

    return playlistSongs.map((song) => ({
      id: song.id,
      name: song.name,
      user_id: song.user.id,
      description: "",
      text: "",
      audio: song.audio,
      listens: song.listens,
      is_liked: song.is_liked || false,
      cover_url: song.cover_url,
      created_at: new Date(),
      updated_at: new Date(),
      user: {
        id: song.user.id,
        username: song.user.username,
        description: null,
        avatar: null,
        is_verified: false,
        songs: [],
        playlists: [],
      },
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !playlist) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || "Playlist not found"}</Typography>
        </Box>
      </Container>
    );
  }

  const songs = transformSongs(playlist.songs);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <BackButton sx={{ mb: 2 }} />
        {/* Playlist Header */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
            }}
          >
            {/* Playlist Cover */}
            <Box
              sx={{ flex: { md: "0 0 33.33%" }, maxWidth: { md: "33.33%" } }}
            >
              <Box
                component="img"
                src={playlist.cover_url}
                alt={playlist.title}
                sx={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              />
            </Box>

            {/* Playlist Info */}
            <Box sx={{ flex: "1 1 auto" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography variant="overline">Playlist</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
                    {playlist.title}
                  </Typography>
                  <IconButton
                    size="large"
                    onClick={handlePlaylistLike}
                    disabled={isLiking}
                    color={isLiked ? "error" : "default"}
                    sx={{ mt: -1 }}
                  >
                    <Favorite fontSize="large" />
                  </IconButton>
                </Box>

                {playlist.description && (
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {playlist.description}
                  </Typography>
                )}

                {/* Creator Info */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    cursor: "pointer",
                  }}
                  onClick={handleUserClick}
                >
                  <Avatar
                    src={playlist.user.avatar}
                    alt={playlist.user.username}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  />
                  <Typography variant="body2">
                    Created by {playlist.user.username}
                  </Typography>
                  {isOwner && (
                    <>
                      <Tooltip title="Edit playlist">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit();
                          }}
                          sx={{ ml: 1 }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </Box>

                {/* Stats */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <QueueMusic sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {playlist.songs.length} songs
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Songs List */}
        <Typography variant="h5" sx={{ mb: 3 }}>
          Songs
        </Typography>

        {songs.length === 0 ? (
          <Typography color="text.secondary">
            No songs in this playlist yet.
          </Typography>
        ) : (
          <Paper>
            <List>
              {songs.map((song, idx) => (
                <ListItem
                  key={song.id}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                    bgcolor:
                      currentSong?.id === song.id
                        ? "action.selected"
                        : "transparent",
                  }}
                  onClick={() => handleSongClick(song, idx, songs)}
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={song.cover_url}
                      alt={song.name}
                    >
                      <QueueMusic />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={song.name}
                    secondary={song.user.username}
                  />
                  <ListItemSecondaryAction>
                    {isOwner && (
                      <Tooltip title="Remove from playlist">
                        <IconButton
                          onClick={(e) => handleRemoveSong(e, song)}
                          disabled={removingSongId === song.id}
                          sx={{ mr: 1 }}
                        >
                          <RemoveCircleOutline />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton
                      onClick={(e) => handleLike(e, song)}
                      disabled={likingStates[song.id]}
                      color={song.is_liked ? "error" : "default"}
                      sx={{ mr: 1 }}
                    >
                      <Favorite />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPause(e, song, idx, songs);
                      }}
                    >
                      {currentSong?.id === song.id && isPlaying ? (
                        <Pause />
                      ) : (
                        <PlayArrow />
                      )}
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Edit Playlist Dialog */}
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Playlist</DialogTitle>
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
          <DialogActions>
            <Button onClick={() => setEditOpen(false)} disabled={saving}>
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
        >
          <DialogTitle>Delete Playlist</DialogTitle>
          <DialogContent>
            <Typography>
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
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default PlaylistDetails;
