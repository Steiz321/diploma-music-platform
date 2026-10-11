import { Box, Link, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowForward } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { fonts, tokens } from "../theme/tokens";
import type { TasteSummary } from "./taste";

const cardSx = {
  borderRadius: "24px",
  border: `1px solid ${tokens.cardBorder}`,
  bgcolor: tokens.card,
  p: { xs: 3, sm: 3.5 },
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
} as const;

const rowSx = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 0.8fr) 2fr 40px",
  alignItems: "center",
  columnGap: 2,
} as const;

const trackSx = {
  height: 10,
  borderRadius: 999,
  bgcolor: tokens.surface2,
  overflow: "hidden",
} as const;

/** the strongest mood is the brightest bar */
const BAR_ALPHA = [1, 0.82, 0.66, 0.52, 0.4];

/** "Your taste": the moods the profile likes most, as shares. */
function TasteCard({ taste, titleId }: { taste: TasteSummary; titleId: string }) {
  return (
    <Box component="section" aria-labelledby={titleId} sx={cardSx}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 1.5,
        }}
      >
        <Typography
          id={titleId}
          component="h2"
          sx={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
          }}
        >
          Your taste
        </Typography>
        <Link
          component={RouterLink}
          to="/my-profile"
          underline="hover"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: tokens.muted,
            fontSize: 14,
            flex: "none",
          }}
        >
          Profile
          <ArrowForward sx={{ fontSize: 16 }} />
        </Link>
      </Box>

      <Box
        component="ul"
        sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}
      >
        {taste.moods.map((mood, i) => (
          <Box component="li" key={mood.key} sx={rowSx}>
            <Typography sx={{ fontSize: 15, color: tokens.textSecondary }} noWrap>
              {mood.label}
            </Typography>
            <Box aria-hidden sx={trackSx}>
              <Box
                sx={{
                  width: `${mood.percent}%`,
                  height: "100%",
                  borderRadius: 999,
                  bgcolor: alpha(tokens.accent, BAR_ALPHA[i] ?? 0.4),
                }}
              />
            </Box>
            <Typography
              sx={{
                fontSize: 15,
                color: tokens.muted,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {mood.percent}%
            </Typography>
          </Box>
        ))}
      </Box>

      {taste.topics.length > 0 && (
        <Box
          sx={{
            borderTop: `1px solid ${tokens.line}`,
            pt: 2.5,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            columnGap: 1,
            rowGap: 0.5,
            fontSize: 14,
          }}
        >
          <Box component="span" sx={{ color: tokens.subtle }}>
            Top topics:
          </Box>
          {taste.topics.map((topic, i) => (
            <Box component="span" key={topic} sx={{ color: tokens.text }}>
              {i > 0 && (
                <Box component="span" aria-hidden sx={{ color: tokens.subtle, mr: 1 }}>
                  ·
                </Box>
              )}
              {topic}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/** Placeholder of the card while the taste loads */
export function TasteCardSkeleton() {
  return (
    <Box sx={cardSx} aria-busy="true" aria-label="Loading your taste">
      <Skeleton width="55%" height={32} />
      {BAR_ALPHA.map((_, i) => (
        <Box key={i} sx={rowSx}>
          <Skeleton width="80%" />
          <Skeleton variant="rounded" height={10} sx={{ borderRadius: 999 }} />
          <Skeleton />
        </Box>
      ))}
    </Box>
  );
}

export default TasteCard;
