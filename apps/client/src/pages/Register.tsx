import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import authApi, { RegisterRequest } from "../api/auth";
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import AuthCard from "../components/AuthCard";
import FileDropzone from "../components/FileDropzone";
import { tokens } from "../theme/tokens";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterRequest>({
    username: "",
    email: "",
    password: "",
    description: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<
    Partial<RegisterRequest> & { general?: string }
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterRequest> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("description", formData.description);
      if (avatarFile) {
        data.append("avatar", avatarFile);
      }
      const response = await authApi.register(data);
      // Store the token and user info in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("refreshToken", response.refresh_token);
      localStorage.setItem("username", response.username);
      localStorage.setItem("avatar", response.avatar);
      localStorage.setItem("description", response.description);
      localStorage.setItem("user_id", response.id.toString());
      // Redirect to feed page
      navigate("/feed");
    } catch (error) {
      console.error("Registration failed:", error);
      // Show the specific error message from the backend
      const body = axios.isAxiosError(error) ? error.response?.data : undefined;
      let general = "Registration failed. Please try again.";
      if (body?.message) {
        general = Array.isArray(body.message)
          ? body.message.join(", ")
          : String(body.message);
      } else if (body) {
        general = JSON.stringify(body);
      }
      setErrors((prev) => ({ ...prev, general }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof RegisterRequest]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  return (
    <AuthCard title="Create an account" subtitle="Upload songs, build playlists.">
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          variant="outlined"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          autoFocus
          value={formData.username}
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          variant="outlined"
          required
          fullWidth
          id="email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          variant="outlined"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password ?? "At least 6 characters"}
        />
        <TextField
          variant="outlined"
          fullWidth
          name="description"
          label="About you"
          id="description"
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description}
        />
        <FileDropzone
          id="avatar-upload"
          name="avatar"
          accept="image/*"
          label="Avatar"
          hint="Optional"
          file={avatarFile}
          onChange={handleAvatarChange}
        />
        {errors.general && <Alert severity="error">{errors.general}</Alert>}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{ height: 48, mt: 1, fontSize: 15 }}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </Box>
      <Typography variant="body2" align="center" sx={{ color: tokens.muted }}>
        Already have an account?{" "}
        <Link
          component={RouterLink}
          to="/login"
          sx={{ "&, &:visited": { color: "primary.main" }, fontWeight: 600 }}
        >
          Sign in
        </Link>
      </Typography>
    </AuthCard>
  );
};

export default Register;
