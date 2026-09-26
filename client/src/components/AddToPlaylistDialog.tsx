import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  CircularProgress,
  Box,
  Alert,
  IconButton,
} from "@mui/material";
import { QueueMusic, Close } from "@mui/icons-material";
import playlistApi, { Playlist } from "../api/playlist";

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" color="text.primary">
            Add to Playlist
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ color: "text.primary" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : playlists.length === 0 ? (
          <Typography color="text.primary" align="center">
            You don't have any playlists yet
          </Typography>
        ) : (
          <>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
            <List>
              {playlists.map((playlist) => (
                <ListItem
                  key={playlist.id}
                  component="button"
                  onClick={() => handleAddToPlaylist(playlist)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "none",
                    padding: 2,
                  }}
                  disabled={addingTo === playlist.id}
                >
                  <ListItemAvatar>
                    {playlist.cover_url ? (
                      <Avatar
                        src={playlist.cover_url}
                        alt={playlist.title}
                        variant="rounded"
                      />
                    ) : (
                      <Avatar variant="rounded">
                        <QueueMusic />
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography color="text.primary">
                        {playlist.title}
                      </Typography>
                    }
                    secondary={
                      <Typography color="text.secondary">
                        {playlist.songs_count} songs
                      </Typography>
                    }
                  />
                  {addingTo === playlist.id && (
                    <CircularProgress size={24} sx={{ ml: 1 }} />
                  )}
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistDialog;
