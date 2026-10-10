import React from "react";
import { Box, Typography } from "@mui/material";
import Logo from "./layout/Logo";
import { tokens } from "../theme/tokens";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Full-viewport page of the sign-in / sign-up forms (outside the shell). */
const AuthCard: React.FC<AuthCardProps> = ({ title, subtitle, children }) => (
  <Box
    component="main"
    sx={{
      minHeight: "100dvh",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
      py: 4,
      bgcolor: "background.default",
      backgroundImage: `radial-gradient(circle at 50% 0%, ${tokens.heroBg} 0%, transparent 60%)`,
      color: "text.primary",
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <Logo />
      <Box
        sx={{
          width: "100%",
          boxSizing: "border-box",
          p: { xs: 3, sm: 4 },
          borderRadius: "24px",
          bgcolor: tokens.surface,
          border: `1px solid ${tokens.line}`,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: tokens.muted }}>{subtitle}</Typography>
          )}
        </Box>
        {children}
      </Box>
    </Box>
  </Box>
);

export default AuthCard;
