import { createTheme } from "@mui/material/styles";
import { fonts, tokens } from "./tokens";

const headingFont = {
  fontFamily: fonts.heading,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: tokens.accent,
      contrastText: tokens.onAccent,
    },
    background: {
      default: tokens.bg,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.text,
      secondary: tokens.muted,
      disabled: tokens.subtle,
    },
    divider: tokens.line,
    action: {
      hover: tokens.surface2,
      selected: tokens.surface2,
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: fonts.body,
    h1: { ...headingFont, fontSize: "3rem", lineHeight: 1.05, letterSpacing: "-0.03em" },
    h2: { ...headingFont, fontSize: "2.25rem", lineHeight: 1.1, letterSpacing: "-0.03em" },
    h3: { ...headingFont, fontSize: "1.875rem", lineHeight: 1.15 },
    h4: { ...headingFont, fontSize: "1.625rem", lineHeight: 1.2 },
    h5: { ...headingFont, fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.3, letterSpacing: "-0.01em" },
    h6: { ...headingFont, fontWeight: 600, fontSize: "1.0625rem", lineHeight: 1.35, letterSpacing: "-0.01em" },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.bg,
        },
        // a visible keyboard focus ring everywhere; mouse focus stays clean
        "*:focus-visible": {
          outline: `2px solid ${tokens.accent}`,
          outlineOffset: 2,
        },
        // text fields show focus through their own border
        "input:focus-visible, textarea:focus-visible": {
          outline: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingLeft: 18,
          paddingRight: 18,
        },
        containedPrimary: {
          color: tokens.onAccent,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        outlined: {
          borderColor: tokens.lineStrong,
          color: tokens.text,
          "&:hover": {
            borderColor: tokens.subtle,
            backgroundColor: tokens.surface2,
          },
        },
      },
    },
    MuiChip: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: tokens.surface2,
          color: tokens.textSecondary,
          fontSize: 12,
        },
        outlined: {
          backgroundColor: "transparent",
          borderColor: tokens.lineStrong,
          color: tokens.subtle,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.card,
          border: `1px solid ${tokens.cardBorder}`,
          borderRadius: 18,
          boxShadow: "none",
        },
      },
    },
    // tabs look like a row of pill toggles
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 36,
        },
        indicator: {
          display: "none",
        },
        list: {
          gap: 6,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 0,
          padding: "0 16px",
          borderRadius: 999,
          border: `1px solid ${tokens.lineStrong}`,
          color: tokens.textSecondary,
          fontSize: 13,
          "&.Mui-selected": {
            backgroundColor: tokens.text,
            borderColor: tokens.text,
            color: tokens.bg,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: tokens.text,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: tokens.inputBorder,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: tokens.lineStrong,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: tokens.accent,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 4,
          padding: "10px 0",
        },
        rail: {
          backgroundColor: tokens.lineStrong,
          opacity: 1,
        },
        track: {
          border: "none",
        },
        thumb: {
          width: 12,
          height: 12,
          "&::before": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.line}`,
          borderRadius: 20,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.line}`,
        },
      },
    },
    // sidebar navigation items
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          color: tokens.muted,
          "&:hover": {
            backgroundColor: tokens.surface2,
            color: tokens.text,
          },
          "&.Mui-selected": {
            backgroundColor: tokens.surface2,
            color: tokens.text,
            fontWeight: 600,
          },
          "&.Mui-selected:hover": {
            backgroundColor: tokens.surface2,
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "inherit",
          minWidth: 0,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: "hover",
      },
      styleOverrides: {
        root: {
          color: "inherit",
          "&:visited": {
            color: "inherit",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: tokens.line,
        },
      },
    },
  },
});

export default theme;
