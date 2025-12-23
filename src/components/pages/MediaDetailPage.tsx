// src/pages/MediaDetailPage.tsx
import * as React from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router";

type MediaType = "image" | "video";

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function useQueryParams() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function MediaDetailPage() {
  const nav = useNavigate();
  const q = useQueryParams();

  const id = q.get("id") ?? "";
  const mediaType = (q.get("mediaType") as MediaType) ?? "image";
  const mediaUrl = q.get("mediaUrl") ?? "";
  const createdAt = q.get("createdAt") ?? "";
  const caption = q.get("caption") ?? "";

  const createdLabel = React.useMemo(() => {
    try {
      return createdAt ? new Date(createdAt).toLocaleString() : "";
    } catch {
      return "";
    }
  }, [createdAt]);

  const isVideo = mediaType === "video";

  // ------- Video controls -------
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [duration, setDuration] = React.useState(0);
  const [time, setTime] = React.useState(0);
  const [scrubbing, setScrubbing] = React.useState(false);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      await v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const requestFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    // Safari uses webkitEnterFullscreen on iOS, but for web/PWA this is usually fine:
    const anyV = v as any;
    if (anyV.requestFullscreen) anyV.requestFullscreen();
    else if (anyV.webkitRequestFullscreen) anyV.webkitRequestFullscreen();
  };

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
      setMuted(v.muted);
    };
    const onTime = () => {
      if (!scrubbing) setTime(v.currentTime || 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
    };
  }, [scrubbing]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // optional: toast later
    } catch {
      // ignore
    }
  };

  // ------- Image zoom/pan -------
  const [zoom, setZoom] = React.useState(1);
  const [drag, setDrag] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isVideo) return;
    setDragging(true);
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isVideo) return;
    if (!dragging || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setDrag((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const onPointerUp = () => {
    if (isVideo) return;
    setDragging(false);
    last.current = null;
  };

  const resetView = () => {
    setZoom(1);
    setDrag({ x: 0, y: 0 });
  };

  if (!mediaUrl) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#020312", color: "#E5E7EB", display: "grid", placeItems: "center" }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.18)",
            bgcolor: "rgba(2,6,23,0.65)",
            backdropFilter: "blur(10px)",
            p: 3,
            width: "min(560px, 92vw)",
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Missing media</Typography>
          <Typography sx={{ mt: 0.75, color: "rgba(148,163,184,0.85)", fontSize: 13 }}>
            This page needs a mediaUrl in the querystring.
          </Typography>
          <Button
            onClick={() => nav(-1)}
            sx={{
              mt: 2,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              bgcolor: "#4F46E5",
              color: "#E0E7FF",
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            Go back
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#020312",
        color: "#E5E7EB",
        position: "relative",
        overflow: "hidden",
        pb: 10,
      }}
    >
      {/* background glow */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        sx={{
          position: "absolute",
          inset: -240,
          background:
            "radial-gradient(circle at 25% 15%, rgba(99,102,241,0.24), transparent 45%)," +
            "radial-gradient(circle at 80% 22%, rgba(34,197,94,0.12), transparent 48%)," +
            "radial-gradient(circle at 60% 85%, rgba(236,72,153,0.11), transparent 52%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="md" sx={{ pt: 2.25, position: "relative" }}>
        {/* top bar */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              onClick={() => nav(-1)}
              sx={{
                color: "#CBD5E1",
                border: "1px solid rgba(148,163,184,0.22)",
                bgcolor: "rgba(2,6,23,0.55)",
                backdropFilter: "blur(10px)",
                "&:hover": { bgcolor: "rgba(30,41,59,0.75)" },
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 16, lineHeight: 1.1 }}>
                Media
              </Typography>
              <Typography sx={{ color: "rgba(148,163,184,0.8)", fontSize: 12, mt: 0.25 }}>
                {createdLabel || "OpenStudio"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={isVideo ? "Video" : "Image"}
              sx={{
                bgcolor: isVideo ? "rgba(79,70,229,0.16)" : "rgba(34,197,94,0.12)",
                color: isVideo ? "#C7D2FE" : "#BBF7D0",
                border: "1px solid rgba(148,163,184,0.18)",
                fontWeight: 900,
              }}
            />
            <Tooltip title="Copy link">
              <IconButton
                onClick={handleCopyLink}
                sx={{
                  color: "#CBD5E1",
                  border: "1px solid rgba(148,163,184,0.22)",
                  bgcolor: "rgba(2,6,23,0.55)",
                  backdropFilter: "blur(10px)",
                  "&:hover": { bgcolor: "rgba(30,41,59,0.75)" },
                }}
              >
                <ContentCopyRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* media card */}
        <Paper
          component={motion.div}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.18)",
            bgcolor: "rgba(2,6,23,0.65)",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
            boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
          }}
        >
          {/* media stage */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "9 / 16",
              bgcolor: "#050716",
              overflow: "hidden",
            }}
          >
            {/* subtle vignette */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 35%, transparent 45%, rgba(0,0,0,0.55) 82%)",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            {isVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  playsInline
                  muted
                  controls={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#000",
                    display: "block",
                  }}
                />

                {/* premium overlay controls */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    bottom: 14,
                    zIndex: 5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    pointerEvents: "none",
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      pointerEvents: "auto",
                      borderRadius: 3,
                      border: "1px solid rgba(148,163,184,0.18)",
                      bgcolor: "rgba(2,6,23,0.58)",
                      backdropFilter: "blur(10px)",
                      px: 1.25,
                      py: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <IconButton
                        onClick={togglePlay}
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          bgcolor: "rgba(79,70,229,0.85)",
                          color: "#E0E7FF",
                          "&:hover": { bgcolor: "rgba(79,70,229,0.95)" },
                        }}
                      >
                        {isPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                      </IconButton>

                      <Typography sx={{ fontSize: 12, fontWeight: 900, color: "rgba(226,232,240,0.92)", minWidth: 92 }}>
                        {formatTime(time)} / {formatTime(duration)}
                      </Typography>

                      <Box sx={{ flex: 1, px: 0.5 }}>
                        <Slider
                          size="small"
                          value={duration > 0 ? Math.min(time, duration) : 0}
                          min={0}
                          max={Math.max(1, duration || 1)}
                          onMouseDown={() => setScrubbing(true)}
                          onChange={(_, v) => {
                            const next = Array.isArray(v) ? v[0] : v;
                            setTime(next);
                          }}
                          onChangeCommitted={(_, v) => {
                            const next = Array.isArray(v) ? v[0] : v;
                            const vid = videoRef.current;
                            if (vid) vid.currentTime = next;
                            setScrubbing(false);
                          }}
                          sx={{
                            "& .MuiSlider-rail": { opacity: 0.35 },
                            "& .MuiSlider-thumb": { width: 12, height: 12 },
                          }}
                        />
                      </Box>

                      <Tooltip title={muted ? "Unmute" : "Mute"}>
                        <IconButton
                          onClick={toggleMute}
                          sx={{
                            color: "#CBD5E1",
                            border: "1px solid rgba(148,163,184,0.18)",
                            bgcolor: "rgba(15,23,42,0.55)",
                            "&:hover": { bgcolor: "rgba(30,41,59,0.75)" },
                          }}
                        >
                          {muted ? <VolumeOffRoundedIcon fontSize="small" /> : <VolumeUpRoundedIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Fullscreen">
                        <IconButton
                          onClick={requestFullscreen}
                          sx={{
                            color: "#CBD5E1",
                            border: "1px solid rgba(148,163,184,0.18)",
                            bgcolor: "rgba(15,23,42,0.55)",
                            "&:hover": { bgcolor: "rgba(30,41,59,0.75)" },
                          }}
                        >
                          <OpenInFullRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                </Box>
              </>
            ) : (
              <>
                <Box
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    cursor: dragging ? "grabbing" : zoom > 1 ? "grab" : "default",
                    touchAction: "none",
                    zIndex: 3,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={mediaUrl}
                    alt={id}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      transform: `translate(${drag.x}px, ${drag.y}px) scale(${zoom})`,
                      transition: dragging ? "none" : "transform 140ms ease",
                      objectFit: "contain",
                      display: "block",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                    draggable={false}
                  />
                </Box>

                {/* image controls */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    bottom: 14,
                    zIndex: 5,
                    pointerEvents: "none",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      pointerEvents: "auto",
                      width: "min(520px, 92%)",
                      borderRadius: 3,
                      border: "1px solid rgba(148,163,184,0.18)",
                      bgcolor: "rgba(2,6,23,0.58)",
                      backdropFilter: "blur(10px)",
                      px: 1.25,
                      py: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Typography sx={{ fontSize: 12, fontWeight: 900, color: "rgba(226,232,240,0.92)", minWidth: 70 }}>
                        Zoom
                      </Typography>
                      <Slider
                        size="small"
                        value={zoom}
                        min={1}
                        max={4}
                        step={0.05}
                        onChange={(_, v) => setZoom(Array.isArray(v) ? v[0] : v)}
                        sx={{
                          flex: 1,
                          "& .MuiSlider-rail": { opacity: 0.35 },
                          "& .MuiSlider-thumb": { width: 12, height: 12 },
                        }}
                      />
                      <Button
                        onClick={resetView}
                        variant="outlined"
                        sx={{
                          borderRadius: 999,
                          textTransform: "none",
                          fontWeight: 900,
                          color: "#E5E7EB",
                          borderColor: "rgba(148,163,184,0.24)",
                          bgcolor: "rgba(15,23,42,0.55)",
                          "&:hover": { bgcolor: "rgba(30,41,59,0.75)", borderColor: "rgba(129,140,248,0.45)" },
                        }}
                      >
                        Reset
                      </Button>
                    </Stack>
                  </Paper>
                </Box>
              </>
            )}
          </Box>

          {/* details */}
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                size="small"
                label={id ? `ID: ${id}` : "OpenStudio"}
                sx={{
                  bgcolor: "rgba(148,163,184,0.10)",
                  color: "rgba(226,232,240,0.92)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  fontWeight: 800,
                }}
              />
              {createdLabel ? (
                <Chip
                  size="small"
                  label={createdLabel}
                  sx={{
                    bgcolor: "rgba(148,163,184,0.10)",
                    color: "rgba(226,232,240,0.92)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    fontWeight: 800,
                  }}
                />
              ) : null}
            </Stack>

            {caption ? (
              <Typography sx={{ color: "#E5E7EB", fontSize: 13, lineHeight: 1.55 }}>
                {caption}
              </Typography>
            ) : (
              <Typography sx={{ color: "rgba(148,163,184,0.82)", fontSize: 13 }}>
                No caption yet.
              </Typography>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}