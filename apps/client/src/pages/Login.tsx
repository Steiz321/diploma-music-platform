import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import authApi, { LoginRequest } from "../api/auth";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import AuthCard from "../components/AuthCard";
import { tokens } from "../theme/tokens";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginRequest>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginRequest> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
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
      const response = await authApi.login(formData);
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
      console.error("Login failed:", error);
      setErrors({
        password: "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof LoginRequest]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Welcome back to Musilizer.">
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
          id="email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
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
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{ height: 48, mt: 1, fontSize: 15 }}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </Box>
      <Typography variant="body2" align="center" sx={{ color: tokens.muted }}>
        Don't have an account?{" "}
        <Link
          component={RouterLink}
          to="/register"
          sx={{ "&, &:visited": { color: "primary.main" }, fontWeight: 600 }}
        >
          Sign up
        </Link>
      </Typography>
    </AuthCard>
  );
};

export default Login;
