import React from "react";
import {
  Avatar,
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import { motion } from "framer-motion";

type Post = {
  id: string;
  user: { name: string; avatar?: string };
  caption: string;
  mediaUrl?: string; // optional
  likes: number;
  timeAgo: string;
};

const demoPosts: Post[] = [
  {
    id: "p1",
    user: { name: "Michael" },
    caption: "First AI edit export. Crowd cheer + aura on highlights 🔥",
    likes: 42,
    timeAgo: "2h",
  },
  {
    id: "p2",
    user: { name: "OpenStudio" },
    caption: "New build shipped. Web + mobile parity coming soon ✨",
    likes: 128,
    timeAgo: "1d",
  },
];

export default function FeedPage() {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {demoPosts.map((p) => (
        <Paper
          key={p.id}
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            borderRadius: 4,
            border: "1px solid rgba(148,163,184,0.16)",
            bgcolor: "rgba(2,6,23,0.58)",
            overflow: "hidden",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ p: 1.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(99,102,241,0.35)" }}>
              {p.user.name.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={900} sx={{ lineHeight: 1.1 }}>
                {p.user.name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(148,163,184,0.85)" }}>
                {p.timeAgo}
              </Typography>
            </Box>
          </Stack>

          {/* media placeholder */}
          <Box
            sx={{
              height: 420,
              bgcolor: "rgba(15,23,42,0.65)",
              borderTop: "1px solid rgba(148,163,184,0.12)",
              borderBottom: "1px solid rgba(148,163,184,0.12)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Typography sx={{ color: "rgba(148,163,184,0.75)", fontWeight: 800 }}>
              Media preview
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.2, py: 0.75 }}>
            <IconButton sx={{ color: "#E5E7EB" }}>
              <FavoriteBorderRoundedIcon />
            </IconButton>
            <IconButton sx={{ color: "#E5E7EB" }}>
              <ChatBubbleOutlineRoundedIcon />
            </IconButton>
            <IconButton sx={{ color: "#E5E7EB" }}>
              <IosShareRoundedIcon />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ fontSize: 12, color: "rgba(148,163,184,0.85)", fontWeight: 800 }}>
              {p.likes} likes
            </Typography>
          </Stack>

          <Divider sx={{ borderColor: "rgba(148,163,184,0.12)" }} />

          <Box sx={{ p: 1.5 }}>
            <Typography sx={{ color: "#E5E7EB", fontSize: 13 }}>
              <Box component="span" sx={{ fontWeight: 900 }}>
                {p.user.name}
              </Box>{" "}
              <Box component="span" sx={{ color: "rgba(148,163,184,0.95)" }}>
                {p.caption}
              </Box>
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}