// // src/pages/ProfilePage.tsx
// import { supabase } from '@api/supabase';
// import { Box, Typography, Stack, Avatar, Divider, Paper, Button } from '@mui/material';
// import { useSupabaseStore } from '@store/supabaseStore';
// import { motion } from 'framer-motion';

// export default function ProfilePage() {
//   const posts = 0;
//   const followers = 2;
//   const following = 2;

//   return (
//     <Box sx={{ px: 2, pt: 2 }}>
//         <Button variant="outlined" color="primary" sx={{ my: 2 }}
//         onClick={() => {
//             supabase.auth.signOut()
//             useSupabaseStore.getState().setSession(null)
//         }}
//         >
//             Log Out
//         </Button>
//       <Paper
//         component={motion.div}
//         initial={{ opacity: 0, y: 8 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.25 }}
//         sx={{
//           p: 2,
//           borderRadius: 4,
//           border: '1px solid rgba(148,163,184,0.14)',
//           bgcolor: 'rgba(2,6,23,0.70)',
//         }}
//       >
//         <Stack direction="row" spacing={1.5} alignItems="center">
//           <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(148,163,184,0.18)', fontWeight: 900 }}>
//             ME
//           </Avatar>
//           <Box sx={{ flex: 1 }}>
//             <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Your Studio</Typography>
//             <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
//               OpenStudio Creations
//             </Typography>
//           </Box>
//         </Stack>

//         <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
//           <Stat label="Posts" value={posts} />
//           <Stat label="Followers" value={followers} />
//           <Stat label="Following" value={following} />
//         </Stack>

//         <Typography sx={{ mt: 1, color: '#EF4444', fontSize: 12, fontWeight: 800 }}>
//           Network Error
//         </Typography>

//         <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.14)' }} />

//         <Box sx={{ textAlign: 'center', py: 6 }}>
//           <Typography sx={{ fontWeight: 900, fontSize: 16, mb: 0.75 }}>No posts yet</Typography>
//           <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 13 }}>
//             Your exported videos and saved images will show up here.
//           </Typography>
//         </Box>
//       </Paper>
//     </Box>
//   );
// }

// function Stat({ label, value }: { label: string; value: number }) {
//   return (
//     <Box sx={{ textAlign: 'center', minWidth: 90 }}>
//       <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{value}</Typography>
//       <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
//         {label}
//       </Typography>
//     </Box>
//   );
// }

// src/pages/ProfileGalleryPage.tsx
import * as React from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  Theme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

import { client } from "@api/index"; // adjust path
import { unmaskUrl } from "@store/useSmartEdit"; // adjust path

type MediaType = "image" | "video";

type GalleryItem = {
  id: string;
  mediaType: MediaType;
  mediaUrl: string;
  createdAt: string;
};

type ExportApiItem = {
  id: string;
  createdAt: string;
  videoUrl: string;
};

type NanoBananaApiItem = {
  id: string;
  mediaType: "image";
  mediaUrl: string;
  createdAt: string;
};

export default function ProfileGalleryPage() {
  const nav = useNavigate();
  const isMdUp = useMediaQuery((t: Theme) => t.breakpoints.up("md"));

  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadGallery = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [exportsRes, imagesRes, imagesLegacyRes] = await Promise.all([
        client.get<{ items: ExportApiItem[] }>("/api/v1/openstudio/exports"),
        client.get<{ items: NanoBananaApiItem[] }>(
          "/api/v1/openstudio/nano-banana/images"
        ),
        client.get<{ images: any[] }>(
          "/api/v1/openstudio/nano-banana/images-legacy"
        ),
      ]);

      const exportItems: GalleryItem[] = (exportsRes.data?.items ?? []).map(
        (item) => ({
          id: item.id,
          mediaType: "video",
          mediaUrl: unmaskUrl(item.videoUrl),
          createdAt: item.createdAt,
        })
      );

      const imageItems: GalleryItem[] = (imagesRes.data?.items ?? []).map(
        (item) => ({
          id: item.id,
          mediaType: "image",
          mediaUrl: unmaskUrl(item.mediaUrl)
            .replace("media//", "media/")
            .replace("%2F", "/"),
          createdAt: item.createdAt,
        })
      );

      const legacyItems: GalleryItem[] = (imagesLegacyRes.data?.images ?? []).map(
        (item: any) => ({
          id: item.id,
          mediaType: "image",
          mediaUrl: item.imageDataUrl,
          createdAt: item.createdAt,
        })
      );

      const merged = [...exportItems, ...imageItems, ...legacyItems].sort(
        (a, b) => (a.createdAt < b.createdAt ? 1 : -1)
      );

      setItems(merged);
    } catch (e: any) {
      console.error("[ProfileGallery] loadGallery failed", e);
      setError(e?.message ?? "Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const openItem = (item: GalleryItem) => {
    // Option A: route with querystring (closest to RN params)
    const qs = new URLSearchParams({
      id: item.id,
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      createdAt: item.createdAt,
    }).toString();

    nav(`/media?${qs}`);

    // Option B: route state (clean URLs)
    // nav("/media", { state: item });
  };

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
          inset: -220,
          background:
            "radial-gradient(circle at 30% 10%, rgba(99,102,241,0.22), transparent 45%), radial-gradient(circle at 70% 20%, rgba(34,197,94,0.11), transparent 48%), radial-gradient(circle at 55% 85%, rgba(236,72,153,0.10), transparent 52%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      <Container
        maxWidth="sm"
        sx={{ pt: 2, pb: 2, position: "relative" }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,0.18)",
            bgcolor: "rgba(2,6,23,0.65)",
            backdropFilter: "blur(10px)",
            px: 2,
            py: 1.75,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 999,
                bgcolor: "#1f2937",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(148,163,184,0.18)",
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 14 }}>ME</Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>
                Your Studio
              </Typography>
              <Typography sx={{ color: "rgba(148,163,184,0.8)", fontSize: 12, mt: 0.4 }}>
                OpenStudio Creations
              </Typography>
            </Box>

            <Chip
              size="small"
              label={loading ? "Loading…" : `${items.length} posts`}
              sx={{
                bgcolor: "rgba(79,70,229,0.16)",
                color: "#C7D2FE",
                border: "1px solid rgba(129,140,248,0.28)",
                fontWeight: 800,
              }}
            />
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mt: 1.75, px: 0.5 }}
          >
            <Stat label="Posts" value={items.length} />
            <Stat label="Followers" value={2} />
            <Stat label="Following" value={2} />
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 1.5,
                borderRadius: 2,
                bgcolor: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(148,163,184,0.18)",
                color: "#E5E7EB",
              }}
            >
              {error}
            </Alert>
          )}
        </Paper>

        {/* Loading / Empty / Grid */}
        {loading && items.length === 0 ? (
          <CenterState title="Loading your gallery…" loading />
        ) : items.length === 0 ? (
          <CenterState
            title="No posts yet"
            subtitle="Your exported videos and saved images will show up here."
          />
        ) : (
          <Box sx={{ mt: 2 }}>
            <Grid3 items={items} onOpen={openItem} />
          </Box>
        )}
      </Container>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 900, fontSize: 16, color: "#F9FAFB" }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "rgba(148,163,184,0.8)" }}>
        {label}
      </Typography>
    </Box>
  );
}

function Grid3({
  items,
  onOpen,
}: {
  items: GalleryItem[];
  onOpen: (it: GalleryItem) => void;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "2px",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(148,163,184,0.10)",
        bgcolor: "rgba(255,255,255,0.02)",
      }}
    >
      {items.map((it) => {
        const isVideo = it.mediaType === "video";
        return (
          <Box
            key={it.id}
            onClick={() => onOpen(it)}
            sx={{
              position: "relative",
              aspectRatio: "1 / 1",
              bgcolor: "#111827",
              cursor: "pointer",
              userSelect: "none",
              overflow: "hidden",
              "&:hover img": { transform: "scale(1.03)" },
            }}
          >
            {/* Grid uses <img> even for videos (like your RN version).
               If you add thumbnails later, swap mediaUrl to thumbnailUrl. */}
            <Box
              component="img"
              src={it.mediaUrl}
              alt={it.id}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 180ms ease",
              }}
              onError={(e) => {
                // if a video URL can't render as image, this will show broken image;
                // you can improve by adding a generic fallback poster.
                (e.currentTarget as HTMLImageElement).style.opacity = "0.0";
              }}
            />

            {/* subtle overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.22))",
                pointerEvents: "none",
              }}
            />

            {isVideo && (
              <Box
                sx={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  bgcolor: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: 999,
                  px: 0.8,
                  py: 0.25,
                  color: "#F9FAFB",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                ▶
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function CenterState({
  title,
  subtitle,
  loading,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <Box
      sx={{
        mt: 2,
        minHeight: "52vh",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Stack
        spacing={1}
        alignItems="center"
        sx={{
          textAlign: "center",
          p: 3,
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,0.18)",
          bgcolor: "rgba(2,6,23,0.65)",
          backdropFilter: "blur(10px)",
          width: "100%",
        }}
      >
        {loading ? <CircularProgress /> : null}
        <Typography sx={{ fontWeight: 900, fontSize: 16, color: "#E5E7EB" }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ color: "rgba(148,163,184,0.8)", fontSize: 13 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}