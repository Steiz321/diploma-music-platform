import React from "react";
import { Box, Typography } from "@mui/material";
import { CloudUploadOutlined, CheckCircleOutline } from "@mui/icons-material";
import { tokens } from "../theme/tokens";

interface FileDropzoneProps {
  id: string;
  name: string;
  accept: string;
  /** e.g. "Cover image" */
  label: string;
  /** e.g. "PNG or JPG, square works best" */
  hint?: string;
  required?: boolean;
  file: File | null;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * A file input styled as a dashed upload area. The native input stays in the
 * page (visually hidden), so it is reachable with the keyboard and a dropped
 * file lands on it.
 */
const FileDropzone: React.FC<FileDropzoneProps> = ({
  id,
  name,
  accept,
  label,
  hint,
  required,
  file,
  error,
  onChange,
}) => {
  const errorId = `${id}-error`;
  return (
    <Box>
      <Box
        component="label"
        htmlFor={id}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 2,
          minHeight: 88,
          px: 2.5,
          py: 2,
          borderRadius: "16px",
          border: "1.5px dashed",
          borderColor: error ? "error.main" : file ? tokens.accent : tokens.dashed,
          bgcolor: tokens.bg,
          cursor: "pointer",
          transition: "border-color 0.2s, background-color 0.2s",
          "&:hover": { borderColor: tokens.accent, bgcolor: tokens.surface2 },
          "&:focus-within": {
            outline: `2px solid ${tokens.accent}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            flex: "none",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: tokens.surface2,
            color: file ? "primary.main" : tokens.muted,
          }}
        >
          {file ? <CheckCircleOutline /> : <CloudUploadOutlined />}
        </Box>
        <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontWeight: 600, color: tokens.text }}>
            {label}
            {required && (
              <Box component="span" aria-hidden sx={{ color: tokens.muted }}>
                {" *"}
              </Box>
            )}
          </Typography>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: file ? tokens.textSecondary : tokens.subtle }}
          >
            {file ? file.name : (hint ?? "Choose a file")}
          </Typography>
        </Box>
        <input
          id={id}
          name={name}
          type="file"
          accept={accept}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onChange={onChange}
          style={{
            // visually hidden, but focusable and still a drop target
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </Box>
      {error && (
        <Typography
          id={errorId}
          variant="caption"
          color="error"
          sx={{ display: "block", mt: 0.75, ml: 1.75 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileDropzone;
