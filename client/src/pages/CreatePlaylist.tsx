import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import playlistApi from "../api/playlist";
import BackButton from "../components/BackButton";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const StyledForm = styled("form")(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(1),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

interface CreatePlaylistForm {
  title: string;
  description: string;
  cover: File | null;
}

type CreatePlaylistFormErrors = {
  title?: string;
  description?: string;
  cover?: string;
  submit?: string;
};

const CreatePlaylist: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreatePlaylistForm>({
    title: "",
    description: "",
    cover: null,
  });
  const [errors, setErrors] = useState<CreatePlaylistFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: CreatePlaylistFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Playlist name is required";
    }

    if (!formData.cover) {
      newErrors.cover = "Cover image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    if (
      name === "cover" &&
      event.target instanceof HTMLInputElement &&
      event.target.files
    ) {
      const files = event.target.files;
      if (files.length > 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: files[0],
        }));
      }
    } else if (name !== "cover") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      if (formData.cover) {
        formDataToSend.append("cover", formData.cover);
      }

      await playlistApi.createPlaylist(formDataToSend);
      navigate("/feed");
    } catch (error) {
      console.error("Error creating playlist:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to create playlist. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <BackButton sx={{ mt: 4, mb: 2 }} />
      <StyledPaper elevation={6}>
        <Typography component="h1" variant="h4" gutterBottom>
          Create New Playlist
        </Typography>
        <StyledForm onSubmit={handleSubmit} encType="multipart/form-data">
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="title"
            label="Playlist Name"
            name="title"
            autoFocus
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
          />
          <TextField
            variant="outlined"
            margin="normal"
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
          />
          <Box sx={{ mt: 2, width: "100%" }}>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="cover-upload"
              type="file"
              name="cover"
              onChange={handleChange}
            />
            <label htmlFor="cover-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                color={errors.cover ? "error" : "primary"}
              >
                {formData.cover
                  ? `Selected: ${formData.cover.name}`
                  : "Upload Cover Image*"}
              </Button>
            </label>
            {errors.cover && (
              <Typography color="error">{errors.cover}</Typography>
            )}
          </Box>
          {errors.submit && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {errors.submit}
            </Typography>
          )}
          <StyledButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Playlist"}
          </StyledButton>
        </StyledForm>
      </StyledPaper>
    </Container>
  );
};

export default CreatePlaylist;
