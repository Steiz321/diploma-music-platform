import { createTamagui, createTokens } from "tamagui";
import { createInterFont } from "@tamagui/font-inter";
import { shorthands } from "@tamagui/shorthands";

const headingFont = createInterFont({
  size: {
    6: 15,
    7: 18,
    8: 20,
    9: 23,
    10: 27,
  },
  transform: {
    6: "uppercase",
    7: "none",
  },
  weight: {
    6: "400",
    7: "700",
  },
  color: {
    6: "$colorFocus",
    7: "$color",
  },
  letterSpacing: {
    5: 2,
    6: 1,
    7: 0,
    8: -1,
    9: -2,
    10: -3,
    12: -4,
    14: -5,
    15: -6,
  },
});

const tokens = createTokens({
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
  },
  radius: {
    0: 0,
    1: 3,
    2: 5,
    3: 7,
    4: 9,
    5: 10,
    6: 16,
    7: 20,
    8: 25,
  },
  color: {
    white: "#fff",
    black: "#000",
    primary: "#0066ff",
    secondary: "#0052cc",
    gray: "#666666",
    lightGray: "#999999",
    background: "#f5f5f5",
  },
});

const config = createTamagui({
  fonts: {
    heading: headingFont,
  },
  tokens,
  themes: {
    light: {
      background: tokens.color.background,
      color: tokens.color.black,
    },
    dark: {
      background: tokens.color.black,
      color: tokens.color.white,
    },
  },
  shorthands,
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
