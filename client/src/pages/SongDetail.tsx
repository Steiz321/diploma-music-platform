import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  IconButton,
  Grid,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import {
  PlayArrow,
  Favorite,
  Pause,
  Person,
  Headphones,
  AccessTime,
  PlaylistAdd,
  Delete,
} from "@mui/icons-material";
import songApi, { Song } from "../api/song";
import { usePlayer } from "../player/PlayerContext";
import BackButton from "../components/BackButton";
import AddToPlaylistDialog from "../components/AddToPlaylistDialog";

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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !song) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error || "Song not found"}</Typography>
        </Box>
      </Container>
    );
  }

  const isOwner = currentUserId === song.user_id;

  const isCurrent = currentSong && currentSong.id === song.id;

  const handlePlayPause = () => {
    if (isCurrent) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      playSong({
        id: song.id,
        name: song.name,
        author: song.user.username,
        audio: song.audio,
        is_liked: song.is_liked,
      });
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

  const handleUserClick = () => {
    navigate(`/profile/${song.user_id}`);
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

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      setDeleteError("Failed to delete song");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <BackButton sx={{ mb: 2 }} />
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <Box sx={{ width: { xs: "100%", md: "30%" } }}>
              <img
                src={song.cover_url}
                alt={song.name}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              />
            </Box>
            <Box
              sx={{
                width: { xs: "100%", md: "calc(70% - 32px)" },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Song
                </Typography>
                <Typography variant="h3" component="h1" gutterBottom>
                  {song.name}
                </Typography>

                {/* User Info */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
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
                      sx={{ width: 40, height: 40, mr: 2 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                      <Person />
                    </Avatar>
                  )}
                  <Typography variant="h6">{song.user.username}</Typography>
                </Box>

                {/* Song Stats */}
                <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Headphones sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatListens(song.listens)} listens
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <AccessTime sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(song.created_at)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Song Description */}
                {song.text && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      mb: 3,
                      whiteSpace: "pre-wrap",
                      flex: 1,
                    }}
                  >
                    {song.text}
                  </Typography>
                )}

                {/* Controls */}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <IconButton
                    size="large"
                    color="primary"
                    onClick={handlePlayPause}
                    sx={{
                      width: 56,
                      height: 56,
                      backgroundColor: "primary.main",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    }}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause fontSize="large" />
                    ) : (
                      <PlayArrow fontSize="large" />
                    )}
                  </IconButton>
                  <IconButton
                    size="large"
                    onClick={handleLike}
                    disabled={isLiking}
                    sx={{
                      width: 56,
                      height: 56,
                      border: 1,
                      borderColor: song.is_liked ? "error.main" : "divider",
                    }}
                    color={song.is_liked ? "error" : "default"}
                  >
                    <Favorite fontSize="large" />
                  </IconButton>
                  <IconButton
                    size="large"
                    onClick={() => setAddToPlaylistOpen(true)}
                    sx={{
                      width: 56,
                      height: 56,
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <PlaylistAdd fontSize="large" />
                  </IconButton>
                  {isOwner && (
                    <IconButton
                      size="large"
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                      sx={{ width: 56, height: 56 }}
                    >
                      <Delete fontSize="large" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        songId={song.id}
      />
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Song</DialogTitle>
        <DialogContent>
          <Typography>
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
    </Container>
  );
};

export default SongDetail;
