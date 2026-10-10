import React from "react";
import { Box, Typography } from "@mui/material";
import BackButton from "./BackButton";
import { tokens } from "../theme/tokens";

interface FormCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Page with a single form in a dark card (create song / playlist). */
const FormCard: React.FC<FormCardProps> = ({ title, subtitle, children }) => (
  <Box
    sx={{
      width: "100%",
      maxWidth: 640,
      mx: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}
  >
    <BackButton />
    <Box
      sx={{
        p: { xs: 2.5, sm: 4 },
        borderRadius: "24px",
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.line}`,
        display: "flex",
        flexDirection: "column",
        gap: 3,
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
);

export default FormCard;
