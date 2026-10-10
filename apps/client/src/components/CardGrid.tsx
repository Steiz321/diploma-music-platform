import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { tokens } from "../theme/tokens";

/** Responsive grid of song / playlist cards */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: 2.5,
      }}
    >
      {children}
    </Box>
  );
}

/** A dashed box in place of an empty grid */
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: `1px dashed ${tokens.dashed}`,
        borderRadius: "18px",
        px: 3,
        py: 5,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {children && (
        <Typography color="text.secondary" sx={{ maxWidth: "46ch" }}>
          {children}
        </Typography>
      )}
    </Box>
  );
}
