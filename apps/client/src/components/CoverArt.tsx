import { useState, type ReactNode } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { lighten } from "@mui/material/styles";
import { coverColor } from "../theme/tokens";

interface CoverArtProps {
  /** picks the placeholder color */
  id: number;
  src?: string | null;
  /** ring thickness of the placeholder, px */
  ring?: number;
  sx?: SxProps<Theme>;
  children?: ReactNode;
}

/**
 * A square cover: the image, or a colored square with a ring when there is
 * no image (or it fails to load). Decorative: the title next to it names it.
 */
function CoverArt({ id, src, ring = 12, sx, children }: CoverArtProps) {
  const [failed, setFailed] = useState(false);
  const color = coverColor(id);
  const showImage = Boolean(src) && !failed;

  return (
    <Box
      sx={[
        {
          position: "relative",
          aspectRatio: "1",
          borderRadius: "12px",
          overflow: "hidden",
          bgcolor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {showImage ? (
        <Box
          component="img"
          src={src!}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Box
          component="span"
          aria-hidden
          sx={{
            width: "44%",
            aspectRatio: "1",
            borderRadius: "50%",
            border: `${ring}px solid ${lighten(color, 0.14)}`,
            boxSizing: "border-box",
          }}
        />
      )}
      {children}
    </Box>
  );
}

export default CoverArt;
