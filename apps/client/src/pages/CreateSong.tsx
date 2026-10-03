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
import songApi from "../api/song";
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

interface CreateSongForm {
  name: string;
  cover: File | null;
  audio: File | null;
}

const CreateSong: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateSongForm>({
    name: "",
    cover: null,
    audio: null,
  });
  type CreateSongFormErrors = {
    name?: string;
    cover?: string;
    audio?: string;
  };

  const [errors, setErrors] = useState<CreateSongFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: CreateSongFormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.cover) newErrors.cover = "Cover image is required";
    if (!formData.audio) newErrors.audio = "Audio file is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      if (formData.cover) data.append("cover", formData.cover);
      if (formData.audio) data.append("audio", formData.audio);
      await songApi.createSong(data);
      navigate("/feed");
    } catch (error) {
      setErrors({ name: "Failed to create song. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Container maxWidth="md">
      <BackButton sx={{ mt: 4, mb: 2 }} />
      <StyledPaper elevation={6}>
        <Typography component="h1" variant="h4" gutterBottom>
          Create New Song
        </Typography>
        <StyledForm onSubmit={handleSubmit} encType="multipart/form-data">
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="name"
            label="Song Name"
            name="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
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
                {formData.cover ? formData.cover.name : "Upload Cover Image*"}
              </Button>
            </label>
            {errors.cover && (
              <Typography color="error">{errors.cover}</Typography>
            )}
          </Box>
          <Box sx={{ mt: 2, width: "100%" }}>
            <input
              accept="audio/mp3"
              style={{ display: "none" }}
              id="audio-upload"
              type="file"
              name="audio"
              onChange={handleChange}
            />
            <label htmlFor="audio-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                color={errors.audio ? "error" : "primary"}
              >
                {formData.audio
                  ? formData.audio.name
                  : "Upload Audio File (mp3)*"}
              </Button>
            </label>
            {errors.audio && (
              <Typography color="error">{errors.audio}</Typography>
            )}
          </Box>
          <StyledButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Song"}
          </StyledButton>
        </StyledForm>
      </StyledPaper>
    </Container>
  );
};

export default CreateSong;
