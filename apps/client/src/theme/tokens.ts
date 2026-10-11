// Design tokens of the "Nocturne" dark theme (purple accent).
// Components should prefer theme palette keys; these are for the few places
// MUI has no palette slot (sidebar, card border, hero, ...).
export const tokens = {
  bg: "#0D0E11",
  sidebar: "#0A0B0E",
  player: "#121418",
  surface: "#16181D",
  /** hovered / active nav item, chips */
  surface2: "#1A1D23",
  card: "#14161A",
  cardBorder: "#1F2228",
  line: "#22252C",
  lineStrong: "#2A2E37",
  /** border of inputs and pills on the surface */
  inputBorder: "#262A32",
  /** dashed border of the "Upload song" nav item */
  dashed: "#343843",
  text: "#F2F3F5",
  textSecondary: "#C9CDD4",
  muted: "#A3A8B3",
  subtle: "#8A909C",
  accent: "#A98BFF",
  onAccent: "#0D0E11",
  heroBg: "#1D1830",
  heroRing: "#2A2244",
  heroSub: "#CEC6E4",
} as const;

export const fonts = {
  heading: "'Space Grotesk', system-ui, sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
} as const;

/** Layout sizes shared by the shell and the pages */
export const layout = {
  sidebarWidth: 240,
  contentMaxWidth: 1200,
} as const;

// Placeholder covers for items without an image, picked by id
const COVER_COLORS = [
  "#3B4A6B",
  "#2F5E55",
  "#5A4A7A",
  "#7A5A2E",
  "#4A2F3A",
  "#2E5A7A",
];

export const coverColor = (id: number) =>
  COVER_COLORS[Math.abs(id) % COVER_COLORS.length];
