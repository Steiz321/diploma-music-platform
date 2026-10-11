import { Box, Button, Skeleton, Typography } from "@mui/material";
import { PlayArrow } from "@mui/icons-material";
import type { RecommendedSongs } from "../api/song";
import { usePlayer } from "../player/usePlayer";
import type { PlaybackSource } from "../tracking";
import { fonts, tokens } from "../theme/tokens";
import CoverArt from "../components/CoverArt";
import { WaveformIcon } from "../components/layout/Logo";
import { toPlayerSong } from "../components/playerSong";
import { describeMix } from "./mixTitle";
import { tagLabel } from "./reasons";

const SOURCE: PlaybackSource = { type: "recommendations" };

const COVER = 136;
const STACK = 168;

const heroSx = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "24px",
  p: { xs: 3, sm: 4 },
  bgcolor: tokens.heroBg,
  display: "flex",
  flexWrap: "wrap",
  gap: 3.5,
  alignItems: "flex-end",
} as const;

/** The big circle in the top right corner */
const Ring = () => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      right: -60,
      top: -60,
      width: 280,
      height: 280,
      borderRadius: "50%",
      border: `40px solid ${tokens.heroRing}`,
      pointerEvents: "none",
    }}
  />
);

/** "Made for you": the recommended songs as one mix to play. */
function MixHero({ data, titleId }: { data: RecommendedSongs; titleId: string }) {
  const { playSong } = usePlayer();
  const { title, subtitle, tags } = describeMix(data);
  const queue = data.songs.map(toPlayerSong);
  // back to front: the first song is the cover on top
  const covers = data.songs.slice(0, 3).reverse();
  const offset = (i: number) => (covers.length - 1 - i) * 16;

  return (
    <Box component="section" aria-labelledby={titleId} sx={heroSx}>
      <Ring />

      <Box
        aria-hidden
        sx={{ flex: "none", position: "relative", width: STACK, height: STACK }}
      >
        {covers.map((song, i) => (
          <CoverArt
            key={song.id}
            id={song.id}
            src={song.cover_url}
            ring={10}
            sx={{
              position: "absolute",
              width: COVER,
              left: offset(i),
              top: 32 - offset(i),
              borderRadius: "14px",
            }}
          />
        ))}
      </Box>

      <Box
        sx={{
          flex: "1 1 260px",
          minWidth: 0,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: 13,
            fontWeight: 600,
            color: tokens.accent,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <WaveformIcon size={16} />
          Made for you
        </Box>
        <Typography
          id={titleId}
          component="h1"
          sx={{
            m: 0,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: tokens.heroSub, fontSize: 15, maxWidth: "46ch" }}>
          {subtitle}
        </Typography>
        <Box
          sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mt: 1 }}
        >
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => playSong(queue[0], queue, 0, SOURCE)}
            sx={{ height: 48, px: 3, fontSize: 15 }}
          >
            Play mix
          </Button>
          {tags.map((key) => (
            <Box
              key={key}
              component="span"
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                bgcolor: tokens.heroRing,
                color: tokens.text,
                fontSize: 13,
              }}
            >
              {tagLabel(key)}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/** Placeholder of the hero while the mix loads */
export function MixHeroSkeleton() {
  return (
    <Box sx={heroSx} aria-busy="true" aria-label="Loading your mix">
      <Ring />
      <Skeleton
        variant="rounded"
        width={COVER}
        height={COVER}
        sx={{ borderRadius: "14px", mt: 4, bgcolor: tokens.heroRing }}
      />
      <Box
        sx={{
          flex: "1 1 260px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Skeleton width={120} sx={{ bgcolor: tokens.heroRing }} />
        <Skeleton width="60%" height={56} sx={{ bgcolor: tokens.heroRing }} />
        <Skeleton width="80%" sx={{ bgcolor: tokens.heroRing }} />
        <Skeleton
          variant="rounded"
          width={140}
          height={48}
          sx={{ borderRadius: 999, mt: 1, bgcolor: tokens.heroRing }}
        />
      </Box>
    </Box>
  );
}

export default MixHero;
