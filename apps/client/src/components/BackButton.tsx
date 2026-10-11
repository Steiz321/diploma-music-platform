import React from "react";
import { useNavigate } from "react-router-dom";
import { IconButton, Box, SxProps, Theme } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { tokens } from "../theme/tokens";

interface BackButtonProps {
  sx?: SxProps<Theme>;
}

const BackButton: React.FC<BackButtonProps> = ({ sx }) => {
  const navigate = useNavigate();

  return (
    <Box sx={sx}>
      <IconButton
        onClick={() => navigate(-1)}
        aria-label="Go back"
        sx={{
          width: 44,
          height: 44,
          bgcolor: tokens.surface,
          border: `1px solid ${tokens.inputBorder}`,
          color: tokens.textSecondary,
          "&:hover": {
            bgcolor: tokens.surface2,
            color: tokens.text,
          },
        }}
      >
        <ArrowBack fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default BackButton;
