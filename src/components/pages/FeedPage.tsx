// import React from "react";
// import {
//   Avatar,
//   Box,
//   IconButton,
//   Paper,
//   Stack,
//   Typography,
//   Divider,
// } from "@mui/material";
// import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
// import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
// import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
// import { motion } from "framer-motion";

// type Post = {
//   id: string;
//   user: { name: string; avatar?: string };
//   caption: string;
//   mediaUrl?: string; // optional
//   likes: number;
//   timeAgo: string;
// };

// const demoPosts: Post[] = [
//   {
//     id: "p1",
//     user: { name: "Michael" },
//     caption: "First AI edit export. Crowd cheer + aura on highlights 🔥",
//     likes: 42,
//     timeAgo: "2h",
//   },
//   {
//     id: "p2",
//     user: { name: "OpenStudio" },
//     caption: "New build shipped. Web + mobile parity coming soon ✨",
//     likes: 128,
//     timeAgo: "1d",
//   },
// ];

// export default function FeedPage() {
//   return (
//     <Box sx={{ display: "grid", gap: 2 }}>
//       {demoPosts.map((p) => (
//         <Paper
//           key={p.id}
//           component={motion.div}
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           sx={{
//             borderRadius: 4,
//             border: "1px solid rgba(148,163,184,0.16)",
//             bgcolor: "rgba(2,6,23,0.58)",
//             overflow: "hidden",
//           }}
//         >
//           <Stack direction="row" alignItems="center" spacing={1.2} sx={{ p: 1.5 }}>
//             <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(99,102,241,0.35)" }}>
//               {p.user.name.slice(0, 1).toUpperCase()}
//             </Avatar>
//             <Box sx={{ flex: 1 }}>
//               <Typography fontWeight={900} sx={{ lineHeight: 1.1 }}>
//                 {p.user.name}
//               </Typography>
//               <Typography sx={{ fontSize: 12, color: "rgba(148,163,184,0.85)" }}>
//                 {p.timeAgo}
//               </Typography>
//             </Box>
//           </Stack>

//           {/* media placeholder */}
//           <Box
//             sx={{
//               height: 420,
//               bgcolor: "rgba(15,23,42,0.65)",
//               borderTop: "1px solid rgba(148,163,184,0.12)",
//               borderBottom: "1px solid rgba(148,163,184,0.12)",
//               display: "grid",
//               placeItems: "center",
//             }}
//           >
//             <Typography sx={{ color: "rgba(148,163,184,0.75)", fontWeight: 800 }}>
//               Media preview
//             </Typography>
//           </Box>

//           <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.2, py: 0.75 }}>
//             <IconButton sx={{ color: "#E5E7EB" }}>
//               <FavoriteBorderRoundedIcon />
//             </IconButton>
//             <IconButton sx={{ color: "#E5E7EB" }}>
//               <ChatBubbleOutlineRoundedIcon />
//             </IconButton>
//             <IconButton sx={{ color: "#E5E7EB" }}>
//               <IosShareRoundedIcon />
//             </IconButton>
//             <Box sx={{ flex: 1 }} />
//             <Typography sx={{ fontSize: 12, color: "rgba(148,163,184,0.85)", fontWeight: 800 }}>
//               {p.likes} likes
//             </Typography>
//           </Stack>

//           <Divider sx={{ borderColor: "rgba(148,163,184,0.12)" }} />

//           <Box sx={{ p: 1.5 }}>
//             <Typography sx={{ color: "#E5E7EB", fontSize: 13 }}>
//               <Box component="span" sx={{ fontWeight: 900 }}>
//                 {p.user.name}
//               </Box>{" "}
//               <Box component="span" sx={{ color: "rgba(148,163,184,0.95)" }}>
//                 {p.caption}
//               </Box>
//             </Typography>
//           </Box>
//         </Paper>
//       ))}
//     </Box>
//   );
// }


// src/pages/FeedPage.tsx
import * as React from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import { client } from "@api/index"; // adjust to your web client path
import { unmaskUrl } from "@store/useSmartEdit"; // adjust path if needed

type MediaType = "image" | "video";

type Post = {
  id: string;
  mediaType: MediaType;
  mediaUrl: string;
  caption?: string;
  createdAt: string;

  authorName: string;
  authorAvatarUrl?: string;
  likes: number;
  comments: number;
};

type ExportApiItem = {
  id: string;
  createdAt: string;
  videoUrl: string;
};

export default function FeedPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadFeed = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await client.get<{ items: ExportApiItem[] }>(
        "/api/v1/openstudio/exports"
      );

      console.log("[Feed] loadFeed", res);

      const items = res.data?.items ?? [];

      const mapped: Post[] = items.map((item) => ({
        id: item.id,
        mediaType: "video",
        mediaUrl: unmaskUrl(item.videoUrl),
        caption: "OpenStudio export",
        createdAt: item.createdAt,
        authorName: "You",
        authorAvatarUrl: undefined,
        likes: 0,
        comments: 0,
      }));

      setPosts(mapped);
    } catch (e: any) {
      console.error("[Feed] loadFeed failed", e);
      setError(e?.message ?? "Failed to load feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  if (loading && posts.length === 0) {
    return (
      <CenterState
        title="Loading your Studio feed…"
        subtitle="Fetching exports from your backend"
        loading
      />
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <CenterState
        title="No exports yet"
        subtitle="Finish a video in OpenStudio and it will show up here."
      />
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
      {/* Background glow */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        sx={{
          position: "absolute",
          inset: -220,
          background:
            "radial-gradient(circle at 22% 14%, rgba(99,102,241,0.24), transparent 45%), radial-gradient(circle at 82% 22%, rgba(34,197,94,0.13), transparent 48%), radial-gradient(circle at 58% 90%, rgba(236,72,153,0.10), transparent 52%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="sm" sx={{ pt: 2, position: "relative" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            Feed
          </Typography>

          <Chip
            size="small"
            label={loading ? "Refreshing…" : `${posts.length} posts`}
            sx={{
              bgcolor: "rgba(79,70,229,0.16)",
              color: "#C7D2FE",
              border: "1px solid rgba(129,140,248,0.28)",
              fontWeight: 800,
            }}
          />
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              bgcolor: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(148,163,184,0.18)",
              color: "#E5E7EB",
            }}
          >
            {error}
          </Alert>
        )}

        <Stack gap={1.5}>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </Stack>

        <Box sx={{ height: 24 }} />
      </Container>
    </Box>
  );
}

function PostCard({ post }: { post: Post }) {
  const isVideo = post.mediaType === "video";
  const [playing, setPlaying] = React.useState(true);
  const [muted, setMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      try {
        await v.play();
        setPlaying(true);
      } catch {
        // autoplay restrictions sometimes apply; user interaction should fix it
      }
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <Paper
      component={motion.div}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      elevation={0}
      sx={{
        backgroundColor: "rgba(5,7,22,0.85)",
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 1.25 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          {post.authorAvatarUrl ? (
            <Box
              component="img"
              src={post.authorAvatarUrl}
              sx={{
                width: 34,
                height: 34,
                borderRadius: 999,
                objectFit: "cover",
              }}
            />
          ) : (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 999,
                bgcolor: "#1f2937",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(148,163,184,0.18)",
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                {post.authorName?.[0]?.toUpperCase() ?? "?"}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 13, lineHeight: 1.1 }}>
              {post.authorName}
            </Typography>
            <Typography sx={{ color: "rgba(148,163,184,0.75)", fontSize: 11 }}>
              {new Date(post.createdAt).toLocaleString()}
            </Typography>
          </Box>
        </Stack>

        <Chip
          size="small"
          label={isVideo ? "Video" : "Image"}
          sx={{
            bgcolor: "rgba(0,0,0,0.35)",
            color: "#E5E7EB",
            border: "1px solid rgba(148,163,184,0.18)",
            fontWeight: 800,
          }}
        />
      </Stack>

      {/* Media */}
      <Box
        sx={{
          position: "relative",
          backgroundColor: "#111827",
          aspectRatio: "9 / 16",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {isVideo ? (
          <Box
            component="video"
            ref={videoRef}
            src={post.mediaUrl}
            muted={muted}
            loop
            playsInline
            autoPlay
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "#0b1220",
              display: "block",
            }}
            onError={(e) => {
              console.warn("[Feed video error]", post.id, e);
            }}
          />
        ) : (
          <Box
            component="img"
            src={post.mediaUrl}
            alt={post.caption ?? "post"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}

        {/* Media controls overlay */}
        {isVideo && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
              bgcolor: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 999,
              px: 0.5,
              py: 0.25,
              backdropFilter: "blur(10px)",
            }}
          >
            <IconButton
              size="small"
              onClick={togglePlay}
              sx={{ color: "#E5E7EB" }}
            >
              {playing ? <PauseRoundedIcon fontSize="small" /> : <PlayArrowRoundedIcon fontSize="small" />}
            </IconButton>

            <IconButton
              size="small"
              onClick={toggleMute}
              sx={{ color: "#E5E7EB" }}
            >
              {muted ? <VolumeOffRoundedIcon fontSize="small" /> : <VolumeUpRoundedIcon fontSize="small" />}
            </IconButton>

            <IconButton
              size="small"
              onClick={() => window.open(post.mediaUrl, "_blank")}
              sx={{ color: "#E5E7EB" }}
            >
              <OpenInNewRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Box>

      {/* Caption */}
      {post.caption ? (
        <Box sx={{ px: 1.5, pt: 1 }}>
          <Typography sx={{ color: "#E5E7EB", fontSize: 13 }} noWrap>
            {post.caption}
          </Typography>
        </Box>
      ) : null}

      {/* Footer */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.5, py: 1.25 }}>
        <Typography sx={{ color: "rgba(148,163,184,0.75)", fontSize: 11 }}>
          {post.likes} likes
        </Typography>
        <Typography sx={{ color: "rgba(148,163,184,0.75)", fontSize: 11 }}>
          {post.comments} comments
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Chip
          clickable
          label="View"
          sx={{
            bgcolor: "#6366f1",
            color: "#f9fafb",
            fontWeight: 900,
            borderRadius: 999,
            px: 0.5,
            "&:hover": { bgcolor: "#4f46e5" },
          }}
          onClick={() => {
            // optional: route to a post details page later
            window.open(post.mediaUrl, "_blank");
          }}
        />
      </Stack>
    </Paper>
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
        minHeight: "100vh",
        bgcolor: "#020312",
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
          maxWidth: 520,
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