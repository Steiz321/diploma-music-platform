import React, { useEffect, useMemo, useRef } from "react";
import { Box, ButtonBase, Skeleton, Typography } from "@mui/material";
import type { Song, StructuredLyrics, VerseKind } from "../api/song";
import { usePlayer, usePlayerProgress } from "../player/usePlayer";
import { fonts, tokens } from "../theme/tokens";
import { findActiveLine, flattenLyrics, FlatLine } from "./activeLine";

const VERSE_LABELS: Record<VerseKind, string | null> = {
  verse: "Verse",
  chorus: "Chorus",
  bridge: "Bridge",
  intro: "Intro",
  outro: "Outro",
  other: null,
};

const sectionLabelSx = {
  m: 0,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: tokens.subtle,
} as const;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface LyricsLinesProps {
  lines: FlatLine[];
  /** -1: nothing is highlighted (the song is not playing or not started) */
  activeIndex: number;
  /** follow the player: dim the other lines, scroll to the active one */
  synced: boolean;
  onSeek?: (seconds: number) => void;
}

/** Verses with their kind label; scrolls only inside its own box. */
const LyricsLines: React.FC<LyricsLinesProps> = ({
  lines,
  activeIndex,
  synced,
  onSeek,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLElement | null)[]>([]);

  // keep the active line in the middle of the panel (never scrolls the page)
  useEffect(() => {
    const box = scrollRef.current;
    const line = lineRefs.current[activeIndex];
    if (!synced || !box || !line) return;
    const top = line.offsetTop - box.clientHeight / 2 + line.offsetHeight / 2;
    box.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [activeIndex, synced]);

  return (
    <Box
      ref={scrollRef}
      sx={{
        position: "relative",
        maxHeight: { xs: 420, md: 560 },
        overflowY: "auto",
        mx: -1,
        px: 1,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {groupByVerse(lines).map(({ verseIndex, kind, items }) => (
        <Box
          key={verseIndex}
          sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
        >
          {VERSE_LABELS[kind] && (
            <Typography component="h3" sx={{ ...sectionLabelSx, mb: 0.5 }}>
              {VERSE_LABELS[kind]}
            </Typography>
          )}
          {items.map(({ line, index }) => {
            const active = index === activeIndex;
            const color = !synced
              ? tokens.textSecondary
              : active
                ? tokens.text
                : tokens.subtle;
            const lineSx = {
              display: "block",
              width: "100%",
              textAlign: "left",
              m: 0,
              py: 0.75,
              pl: 1.5,
              pr: 1,
              minHeight: onSeek ? 44 : undefined,
              borderLeft: "3px solid",
              borderColor: active ? tokens.accent : "transparent",
              borderRadius: "0 8px 8px 0",
              fontFamily: fonts.heading,
              fontSize: 18,
              lineHeight: 1.4,
              fontWeight: active ? 600 : 500,
              color,
              transition: "color 0.2s, border-color 0.2s",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            } as const;
            const setRef = (el: HTMLElement | null) => {
              lineRefs.current[index] = el;
            };

            return onSeek ? (
              <ButtonBase
                key={index}
                ref={setRef}
                onClick={() => onSeek(line.start)}
                aria-current={active ? "true" : undefined}
                sx={{
                  ...lineSx,
                  "&:hover": { color: tokens.text, bgcolor: tokens.surface2 },
                }}
              >
                {line.text}
              </ButtonBase>
            ) : (
              <Box
                key={index}
                ref={setRef}
                component="p"
                aria-current={active ? "true" : undefined}
                sx={lineSx}
              >
                {line.text}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

const groupByVerse = (lines: FlatLine[]) => {
  const groups: {
    verseIndex: number;
    kind: VerseKind;
    items: { line: FlatLine; index: number }[];
  }[] = [];
  lines.forEach((line, index) => {
    const last = groups[groups.length - 1];
    if (last && last.verseIndex === line.verseIndex) {
      last.items.push({ line, index });
    } else {
      groups.push({
        verseIndex: line.verseIndex,
        kind: line.kind,
        items: [{ line, index }],
      });
    }
  });
  return groups;
};

/** Rendered only while this song is in the player: re-renders with progress. */
const LiveLyrics: React.FC<{ lines: FlatLine[] }> = ({ lines }) => {
  const { currentTime } = usePlayerProgress();
  const { seek } = usePlayer();
  return (
    <LyricsLines
      lines={lines}
      activeIndex={findActiveLine(lines, currentTime)}
      synced
      onSeek={seek}
    />
  );
};

const SyncedLyrics: React.FC<{
  lyrics: StructuredLyrics;
  isCurrent: boolean;
}> = ({ lyrics, isCurrent }) => {
  const lines = useMemo(() => flattenLyrics(lyrics), [lyrics]);
  return isCurrent ? (
    <LiveLyrics lines={lines} />
  ) : (
    <LyricsLines lines={lines} activeIndex={-1} synced={false} />
  );
};

const Message: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body2" color="text.secondary">
    {children}
  </Typography>
);

interface LyricsPanelProps {
  song: Song;
  /** the song is the one loaded in the player */
  isCurrent: boolean;
}

/**
 * Lyrics of the song page: synced verses when the transcription has timings,
 * plain text otherwise, or the state of the AI enrichment.
 */
const LyricsPanel: React.FC<LyricsPanelProps> = ({ song, isCurrent }) => {
  const hasSynced =
    !!song.lyrics &&
    song.lyrics.verses.some((verse) => verse.lines.length > 0);

  let hint: string | null = null;
  if (hasSynced) {
    hint = isCurrent
      ? "Synced with the player · select a line to jump to it"
      : "Play the song to follow along";
  }

  let content: React.ReactNode;
  if (hasSynced && song.lyrics) {
    content = <SyncedLyrics lyrics={song.lyrics} isCurrent={isCurrent} />;
  } else if (song.transcription_status === "pending") {
    content = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Message>Lyrics are being processed…</Message>
        <Box aria-hidden>
          {[78, 64, 86, 52, 70].map((width, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={`${width}%`}
              sx={{ fontSize: 18, bgcolor: tokens.surface2 }}
            />
          ))}
        </Box>
      </Box>
    );
  } else if (song.text) {
    content = (
      <Typography
        sx={{
          whiteSpace: "pre-wrap",
          color: tokens.textSecondary,
          fontSize: 16,
          lineHeight: 1.7,
          maxHeight: { xs: 420, md: 560 },
          overflowY: "auto",
        }}
      >
        {song.text}
      </Typography>
    );
  } else if (song.transcription_status === "no_lyrics") {
    content = <Message>Instrumental — no lyrics</Message>;
  } else if (song.transcription_status === "failed") {
    content = <Message>Lyrics are not available</Message>;
  } else {
    content = <Message>No lyrics yet</Message>;
  }

  return (
    <Box
      component="section"
      aria-labelledby="lyrics-heading"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: { xs: 2.5, sm: 3 },
        borderRadius: "20px",
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.line}`,
        minWidth: 0,
      }}
    >
      <Box>
        <Typography id="lyrics-heading" component="h2" sx={sectionLabelSx}>
          Lyrics
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ color: tokens.subtle }}>
            {hint}
          </Typography>
        )}
      </Box>
      {content}
    </Box>
  );
};

export default LyricsPanel;
