
import React from "react";
import { Button, Chip, Container, Typography, Box } from "@mui/material"
import { IconButton, Paper, Stack } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

type TabKey = "studio" | "image" | "editor" | "feed" | "profile" | "settings";

export function StudioHomePage() {
  const nav = useNavigate();

  // stub: swap to your real state
  const activeTab: TabKey = "studio";
  const isSynced = true;

  const handleNewVideoProject = () => {
    // create project then route; for now just go somewhere
    nav("/editor/new?type=video");
  };

  const handleNewImageProject = () => {
    nav("/editor/new?type=image");
  };

  const handleOpenProject = (id: string) => {
    nav(`/editor/${id}`);
  };

  const handleSyncNow = async () => {
    // call your sync action
    console.log("sync now");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "#E5E7EB",
        // position: "relative",
        // overflow: "hidden",
      }}
    >
      {/* subtle background glow */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        sx={{
          position: "absolute",
          inset: -220,
          background:
            "radial-gradient(circle at 30% 10%, rgba(99,102,241,0.25), transparent 45%), radial-gradient(circle at 70% 20%, rgba(34,197,94,0.12), transparent 48%), radial-gradient(circle at 55% 85%, rgba(236,72,153,0.10), transparent 52%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="sm"
        sx={{
          pt: 2,
          pb: 12, // leave room for bottom dock
          position: "relative",
        }}
      >
        {/* Top bar */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <Typography sx={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.2 }}>
              Studio Editor 🏀⛹️
            </Typography>

            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: 999,
                bgcolor: isSynced ? "#22c55e" : "#f59e0b",
                boxShadow: isSynced
                  ? "0 0 0 3px rgba(34,197,94,0.15)"
                  : "0 0 0 3px rgba(245,158,11,0.15)",
              }}
              aria-label={isSynced ? "synced" : "not synced"}
            />
          </Stack>

          <Button
            onClick={handleSyncNow}
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variant="contained"
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "#4F46E5",
              px: 2,
              py: 0.8,
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            Sync now
          </Button>
        </Stack>

        {/* Tagline */}
        <Typography sx={{ color: "rgba(148,163,184,0.85)", mb: 2, fontSize: 13 }}>
          Make something cool today
        </Typography>

        {/* Actions */}
        <Stack gap={1.25} sx={{ mb: 2.25 }}>
          <ActionPill
            label="New Video Project"
            onClick={handleNewVideoProject}
          />
          <ActionPill
            label="New Image Project"
            onClick={handleNewImageProject}
          />
        </Stack>

        {/* Project card */}
        <Paper
          component={motion.div}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          elevation={0}
          onClick={() => handleOpenProject("proj-1")}
          sx={{
            cursor: "pointer",
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(2,6,23,0.65)",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
            px: 1.25,
            py: 1.1,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            "&:hover": {
              borderColor: "rgba(129,140,248,0.55)",
              background: "rgba(2,6,23,0.78)",
            },
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 38,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(15,23,42,0.70))",
              border: "1px solid rgba(148,163,184,0.14)",
            }}
          >
            <Typography sx={{ fontSize: 20, opacity: 0.95 }}>🎬</Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>
              Project 1
            </Typography>
            <Typography sx={{ color: "rgba(148,163,184,0.75)", fontSize: 12, mt: 0.3 }}>
              Edited Nov 17
            </Typography>
          </Box>

          <Chip
            size="small"
            label="Video"
            sx={{
              bgcolor: "rgba(79,70,229,0.16)",
              color: "#C7D2FE",
              border: "1px solid rgba(129,140,248,0.28)",
              fontWeight: 800,
            }}
          />
        </Paper>
      </Container>

      {/* Bottom dock */}
      {/* <BottomDock active={activeTab} onSelect={(t) => nav(tabToRoute(t))} /> */}
    </Box>
  );
}

function ActionPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      component={motion.button}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      fullWidth
      variant="contained"
      sx={{
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 800,
        py: 1.25,
        bgcolor: "rgba(15,23,42,0.85)",
        color: "#E5E7EB",
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
        "&:hover": {
          bgcolor: "rgba(30,41,59,0.92)",
          borderColor: "rgba(129,140,248,0.45)",
        },
      }}
    >
      {label}
    </Button>
  );
}

function BottomDock({
  active,
  onSelect,
}: {
  active: TabKey;
  onSelect: (t: TabKey) => void;
}) {
  const items: { key: TabKey; icon: React.ReactNode; label: string }[] = [
    { key: "studio", icon: <CameraAltOutlinedIcon fontSize="small" />, label: "Studio" },
    { key: "image", icon: <ImageOutlinedIcon fontSize="small" />, label: "Image" },
    { key: "editor", icon: <VideocamOutlinedIcon fontSize="small" />, label: "Editor" },
    { key: "feed", icon: <AutoAwesomeOutlinedIcon fontSize="small" />, label: "Feed" },
    { key: "profile", icon: <PersonOutlineOutlinedIcon fontSize="small" />, label: "Profile" },
    { key: "settings", icon: <SettingsOutlinedIcon fontSize="small" />, label: "Settings" },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        px: 1.25,
        pb: 1.25,
        zIndex: 20,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          mx: "auto",
          maxWidth: 720,
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(2,6,23,0.72)",
          backdropFilter: "blur(10px)",
          px: 1,
          py: 0.75,
        }}
      >
        <Stack direction="row" justifyContent="space-around" alignItems="center">
          {items.map((it) => {
            const isActive = it.key === active;
            return (
              <Box key={it.key} sx={{ width: 84, textAlign: "center" }}>
                <IconButton
                  onClick={() => onSelect(it.key)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    color: isActive ? "#E0E7FF" : "rgba(148,163,184,0.9)",
                    bgcolor: isActive ? "rgba(79,70,229,0.22)" : "transparent",
                    border: isActive ? "1px solid rgba(129,140,248,0.35)" : "1px solid transparent",
                    "&:hover": {
                      bgcolor: isActive ? "rgba(79,70,229,0.28)" : "rgba(15,23,42,0.55)",
                    },
                  }}
                >
                  {it.icon}
                </IconButton>
                <Typography
                  sx={{
                    mt: 0.4,
                    fontSize: 11,
                    fontWeight: isActive ? 900 : 700,
                    color: isActive ? "#E5E7EB" : "rgba(148,163,184,0.75)",
                  }}
                >
                  {it.label}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}

function tabToRoute(t: TabKey) {
  switch (t) {
    case "studio":
      return "/";
    case "image":
      return "/image";
    case "editor":
      return "/editor";
    case "feed":
      return "/feed";
    case "profile":
      return "/profile";
    case "settings":
      return "/settings";
    default:
      return "/";
  }
}

export { BottomDock, tabToRoute };
export default StudioHomePage;