import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  Alert,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import playlistApi, { Playlist } from "../api/playlist";
import CoverArt from "./CoverArt";
import { tokens } from "../theme/tokens";

interface AddToPlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  songId: number;
}

const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  open,
  onClose,
  songId,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await playlistApi.getUserPlaylists();
        setPlaylists(data);
      } catch (err) {
        console.error("Error fetching playlists:", err);
        setError("Failed to load your playlists");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchPlaylists();
    }
  }, [open]);

  const handleAddToPlaylist = async (playlist: Playlist) => {
    try {
      setAddingTo(playlist.id);
      setError(null);
      setSuccessMessage(null);

      await playlistApi.addSongToPlaylist(playlist.id, songId);
      setSuccessMessage(`Added to ${playlist.title}`);

      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error("Error adding song to playlist:", err);
      setError("Failed to add song to playlist");
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="add-to-playlist-title"
    >
      <DialogTitle
        id="add-to-playlist-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          pr: 1.5,
        }}
      >
        <Typography variant="h6" component="span">
          Add to playlist
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{ width: 44, height: 44, color: tokens.muted }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 1.5, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress aria-label="Loading playlists" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mx: 1.5 }}>
            {error}
          </Alert>
        ) : playlists.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ p: 2 }}>
            You don't have any playlists yet
          </Typography>
        ) : (
          <>
            {successMessage && (
              <Alert severity="success" sx={{ mx: 1.5, mb: 1 }} role="status">
                {successMessage}
              </Alert>
            )}
            <List disablePadding>
              {playlists.map((playlist) => (
                <ListItemButton
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist)}
                  disabled={addingTo === playlist.id}
                  sx={{ gap: 1.75, py: 1, px: 1.5 }}
                >
                  <CoverArt
                    id={playlist.id}
                    src={playlist.cover_url}
                    ring={4}
                    sx={{ width: 44, borderRadius: "8px" }}
                  />
                  <ListItemText
                    primary={playlist.title}
                    secondary={`${playlist.songs_count} songs`}
                    slotProps={{
                      primary: { sx: { color: tokens.text, fontWeight: 600 } },
                      secondary: { sx: { color: tokens.muted, fontSize: 13 } },
                    }}
                  />
                  {addingTo === playlist.id && (
                    <CircularProgress size={20} aria-label="Adding" />
                  )}
                </ListItemButton>
              ))}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistDialog;
