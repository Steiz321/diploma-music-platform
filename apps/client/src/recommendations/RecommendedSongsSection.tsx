import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import type { RecommendedSongs } from "../api/song";
import SongCard from "../components/SongCard";
import { describeReasons } from "./reasons";

interface Props {
  title: string;
  /** title shown when the popular fallback is returned */
  fallbackTitle: string;
  kind: "for-you" | "similar";
  load: () => Promise<RecommendedSongs>;
  /** reload when this changes (e.g. the song on the page) */
  reloadKey?: string | number;
}

/** "For you" / "Similar tracks": a grid of songs with a reason under each. */
const RecommendedSongsSection: React.FC<Props> = ({
  title,
  fallbackTitle,
  kind,
  load,
  reloadKey,
}) => {
  const [result, setResult] = useState<RecommendedSongs | null>(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setResult(data))
      // recommendations are optional: the page works without them
      .catch((err) => console.error("Error loading recommendations:", err));
    return () => {
      cancelled = true;
    };
    // load is recreated on every render of the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  if (!result || result.songs.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {result.source === "recommendations" ? title : fallbackTitle}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 3,
        }}
      >
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
      </Box>
    </Box>
  );
};

export default RecommendedSongsSection;
