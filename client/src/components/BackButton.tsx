import React from "react";
import { useNavigate } from "react-router-dom";
import { IconButton, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

interface BackButtonProps {
  sx?: object;
}

const BackButton: React.FC<BackButtonProps> = ({ sx }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ ...sx }}>
      <IconButton
        onClick={() => navigate(-1)}
        size="large"
        sx={{
          backgroundColor: "background.paper",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <ArrowBack />
      </IconButton>
    </Box>
  );
};

export default BackButton;
