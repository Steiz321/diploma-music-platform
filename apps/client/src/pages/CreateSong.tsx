import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Alert } from "@mui/material";
import songApi from "../api/song";
import FormCard from "../components/FormCard";
import FileDropzone from "../components/FileDropzone";

interface CreateSongForm {
  name: string;
  cover: File | null;
  audio: File | null;
}

type CreateSongFormErrors = {
  name?: string;
  cover?: string;
  audio?: string;
  submit?: string;
};

const CreateSong: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateSongForm>({
    name: "",
    cover: null,
    audio: null,
  });
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
      console.error("Error creating song:", error);
      setErrors({ submit: "Failed to create song. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] ?? null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
  };

  return (
    <FormCard
      title="Upload a song"
      subtitle="Lyrics and tags are added automatically after the upload."
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <TextField
          variant="outlined"
          required
          fullWidth
          id="name"
          label="Song name"
          name="name"
          autoFocus
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
        />
        <FileDropzone
          id="audio-upload"
          name="audio"
          accept="audio/mp3"
          label="Audio file"
          hint="MP3"
          required
          file={formData.audio}
          error={errors.audio}
          onChange={handleChange}
        />
        <FileDropzone
          id="cover-upload"
          name="cover"
          accept="image/*"
          label="Cover image"
          hint="An image, square works best"
          required
          file={formData.cover}
          error={errors.cover}
          onChange={handleChange}
        />
        {errors.submit && <Alert severity="error">{errors.submit}</Alert>}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{ height: 48, fontSize: 15 }}
        >
          {isLoading ? "Uploading..." : "Upload song"}
        </Button>
      </Box>
    </FormCard>
  );
};

export default CreateSong;
