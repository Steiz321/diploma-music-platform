import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Alert } from "@mui/material";
import playlistApi from "../api/playlist";
import FormCard from "../components/FormCard";
import FileDropzone from "../components/FileDropzone";

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
        setErrors((prev) => ({ ...prev, cover: undefined }));
      }
    } else if (name !== "cover") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
    <FormCard title="New playlist">
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
          id="title"
          label="Playlist name"
          name="title"
          autoFocus
          value={formData.title}
          onChange={handleChange}
          error={!!errors.title}
          helperText={errors.title}
        />
        <TextField
          variant="outlined"
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
          {isLoading ? "Creating..." : "Create playlist"}
        </Button>
      </Box>
    </FormCard>
  );
};

export default CreatePlaylist;
