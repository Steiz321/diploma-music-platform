import { Box, SvgIcon } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { fonts, tokens } from "../../theme/tokens";

/** Waveform mark of the app (same shape as public/favicon.svg) */
export const WaveformIcon = ({ size = 18 }: { size?: number }) => (
  <SvgIcon sx={{ fontSize: size }} viewBox="0 0 24 24">
    <path
      d="M4 12h2M8 7v10M12 4v16M16 8v8M20 11v2"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
    />
  </SvgIcon>
);

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Box
      component={RouterLink}
      to="/feed"
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        color: tokens.text,
        textDecoration: "none",
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: "-0.02em",
        borderRadius: 1,
      }}
    >
      <Box
        component="span"
        sx={{
          width: 32,
          height: 32,
          borderRadius: "10px",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WaveformIcon />
      </Box>
      Musilizer
    </Box>
  );
}

export default Logo;
