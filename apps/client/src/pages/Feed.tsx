import React, { useState } from "react";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import songApi from "../api/song";
import playlistApi from "../api/playlist";
import { handleApiError } from "../api/client";
import RecommendedSongsSection from "../recommendations/RecommendedSongsSection";
import MixHero, { MixHeroSkeleton } from "../recommendations/MixHero";
import SongCard from "../components/SongCard";
import PlaylistCard from "../components/PlaylistCard";
import { CardGrid, EmptyState } from "../components/CardGrid";

const TABS = ["Songs", "Playlists"] as const;

// read by screen readers, not shown
const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feed-tabpanel-${index}`}
      aria-labelledby={`feed-tab-${index}`}
    >
      {value === index && children}
    </div>
  );
}

const Loading = () => (
  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
    <CircularProgress />
  </Box>
);

const Feed: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const recommended = useQuery({
    queryKey: ["recommendations", "for-you"],
    queryFn: () => songApi.getRecommended(6),
  });
  const songs = useQuery({
    queryKey: ["feed", "songs"],
    queryFn: () => songApi.getAllSongs(),
    select: (data) => (Array.isArray(data) ? data : []),
  });
  const playlists = useQuery({
    queryKey: ["feed", "playlists"],
    queryFn: () => playlistApi.getAllPlaylists(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const mix = recommended.data;
  const hasMix = !!mix && mix.songs.length > 0;
  const displaySongs = songs.data ?? [];
  const displayPlaylists = playlists.data ?? [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {/* recommendations are optional: on an error the hero is hidden */}
      {recommended.isLoading ? (
        <MixHeroSkeleton />
      ) : hasMix ? (
        <MixHero data={mix} titleId="mix-h" />
      ) : null}
      {!hasMix && (
        <Typography component="h1" sx={visuallyHidden}>
          Feed
        </Typography>
      )}

      {hasMix && (
        <RecommendedSongsSection
          title="In your mix"
          fallbackTitle="Popular picks"
          kind="for-you"
          data={mix}
        />
      )}

      <Box
        component="section"
        aria-labelledby="fresh-h"
        sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography id="fresh-h" variant="h4" component="h2">
            Fresh in your feed
          </Typography>
          <Tabs
            value={tabValue}
            onChange={(_, value: number) => setTabValue(value)}
            aria-label="Show songs or playlists"
          >
            {TABS.map((label, i) => (
              <Tab
                key={label}
                label={label}
                id={`feed-tab-${i}`}
                aria-controls={`feed-tabpanel-${i}`}
              />
            ))}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {songs.isLoading ? (
            <Loading />
          ) : songs.error ? (
            <Typography color="error">{handleApiError(songs.error)}</Typography>
          ) : displaySongs.length === 0 ? (
            <EmptyState title="No songs yet">
              New uploads will show up here.
            </EmptyState>
          ) : (
            <CardGrid>
              {displaySongs.map((song, idx) => (
                <SongCard
                  key={song.id}
                  song={song}
                  songs={displaySongs}
                  index={idx}
                  source={{ type: "feed" }}
                />
              ))}
            </CardGrid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {playlists.isLoading ? (
            <Loading />
          ) : playlists.error ? (
            <Typography color="error">
              {handleApiError(playlists.error)}
            </Typography>
          ) : displayPlaylists.length === 0 ? (
            <EmptyState title="No playlists yet">
              Playlists people share will show up here.
            </EmptyState>
          ) : (
            <CardGrid>
              {displayPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </CardGrid>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Feed;
