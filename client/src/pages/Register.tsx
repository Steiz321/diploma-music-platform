import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi, { RegisterRequest } from "../api/auth";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
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

    try {
      const data = new FormData();
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("description", formData.description);
      if (avatarFile) {
        data.append("avatar", avatarFile);
      }
      // Debug: log all FormData entries
      for (let pair of data.entries()) {
        console.log(pair[0], pair[1]);
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
    } catch (error: any) {
      console.error("Registration failed:", error);
      // Show the specific error message from the backend
      if (error.response?.data?.message) {
        setErrors({
          ...errors,
          general: error.response.data.message,
        });
      } else if (error.response?.data) {
        setErrors({
          ...errors,
          general: JSON.stringify(error.response.data),
        });
      } else {
        setErrors({
          ...errors,
          general: "Registration failed. Please try again.",
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={6}>
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <StyledForm onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
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
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
          <TextField
            variant="outlined"
            margin="normal"
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
            helperText={errors.password}
          />
          <TextField
            variant="outlined"
            margin="normal"
            fullWidth
            name="description"
            label="Description"
            id="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2, mb: 1 }}
          >
            Upload Avatar
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </Button>
          {avatarFile && (
            <Typography variant="body2" align="center" sx={{ mb: 1 }}>
              Selected: {avatarFile.name}
            </Typography>
          )}
          <StyledButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
          >
            Register
          </StyledButton>
          {errors.general && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {errors.general}
            </Typography>
          )}
          <Box mt={2}>
            <Typography variant="body2" align="center">
              Already have an account?{" "}
              <Button color="primary" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </Typography>
          </Box>
        </StyledForm>
      </StyledPaper>
    </Container>
  );
};

export default Register;
