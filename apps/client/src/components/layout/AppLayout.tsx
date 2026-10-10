import { useEffect, useRef, useState } from "react";
import { Box, Drawer } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import BottomPlayer from "../../player/BottomPlayer";
import { layout, tokens } from "../../theme/tokens";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/**
 * Shell of the signed-in pages: sidebar | top bar + page, player at the bottom.
 * Below md the sidebar is a drawer opened from the top bar.
 * The shell fills the viewport and only the main column scrolls, so the
 * player never covers the sidebar or the end of a page.
 */
function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  // a new page starts at the top (the window itself never scrolls)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Box sx={{ flex: "1 1 auto", minHeight: 0, display: "flex" }}>
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: layout.sidebarWidth,
            flex: "none",
            borderRight: 1,
            borderColor: "divider",
            bgcolor: tokens.sidebar,
          }}
        >
          <Sidebar />
        </Box>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" } }}
          slotProps={{
            paper: {
              sx: {
                width: layout.sidebarWidth,
                bgcolor: tokens.sidebar,
                borderRight: 1,
                borderColor: "divider",
              },
            },
          }}
        >
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </Drawer>

        <Box
          component="main"
          ref={mainRef}
          sx={{
            flex: "1 1 auto",
            minWidth: 0,
            overflowY: "auto",
            boxSizing: "border-box",
            pt: 3,
            pb: 5,
            px: "clamp(16px, 3vw, 40px)",
          }}
        >
          <Box
            sx={{
              maxWidth: layout.contentMaxWidth,
              mx: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <TopBar onMenuClick={() => setDrawerOpen(true)} />
            <Box>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
      <BottomPlayer />
    </Box>
  );
}

export default AppLayout;
