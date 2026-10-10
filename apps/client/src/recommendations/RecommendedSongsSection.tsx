import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import type { RecommendedSongs } from "../api/song";
import SongCard from "../components/SongCard";
import { CardGrid } from "../components/CardGrid";
import { describeReasons } from "./reasons";

interface Props {
  title: string;
  /** title shown when the popular fallback is returned */
  fallbackTitle: string;
  kind: "for-you" | "similar";
  /** fetches the songs; not needed when `data` is given */
  load?: () => Promise<RecommendedSongs>;
  /** songs already loaded by the page (the feed shares them with its hero) */
  data?: RecommendedSongs;
  /** reload when this changes (e.g. the song on the page) */
  reloadKey?: string | number;
}

/** "For you" / "Similar tracks": a grid of songs with a reason under each. */
const RecommendedSongsSection: React.FC<Props> = ({
  title,
  fallbackTitle,
  kind,
  load,
  data,
  reloadKey,
}) => {
  const [loaded, setLoaded] = useState<RecommendedSongs | null>(null);

  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    load()
      .then((result) => !cancelled && setLoaded(result))
      // recommendations are optional: the page works without them
      .catch((err) => console.error("Error loading recommendations:", err));
    return () => {
      cancelled = true;
    };
    // load is recreated on every render of the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const result = data ?? loaded;
  if (!result || result.songs.length === 0) return null;

  const headingId = `recommended-${kind}-h`;

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
    >
      <Typography id={headingId} variant="h4" component="h2">
        {result.source === "recommendations" && !result.cold_start
          ? title
          : fallbackTitle}
      </Typography>
      <CardGrid>
        {result.songs.map((song, idx) => (
          <SongCard
            key={song.id}
            song={song}
            songs={result.songs}
            index={idx}
            source={{ type: "recommendations" }}
            caption={describeReasons(song.reasons, kind)}
          />
        ))}
      </CardGrid>
    </Box>
  );
};

export default RecommendedSongsSection;
