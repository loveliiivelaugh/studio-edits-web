import * as React from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  Theme,
  Tooltip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveTool = 'tl' | 'tx' | 'mu' | 'fx' | 'ml' | 'ai' | 'ch' | 'ex';

const toolDefs: Array<{ key: ActiveTool; label: string; emoji: string }> = [
  { key: 'tl', label: 'Timeline', emoji: '🎥' },
  { key: 'tx', label: 'Text', emoji: '✏️' },
  { key: 'mu', label: 'Music', emoji: '🎵' },
  { key: 'fx', label: 'Effects', emoji: '🎬' },
  { key: 'ml', label: 'ML', emoji: '🧠' },
  { key: 'ai', label: 'AI', emoji: '✨' },
  { key: 'ch', label: 'Chat', emoji: '💬' },
  { key: 'ex', label: 'Export', emoji: '📦' },
];

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function EditorPage() {
  const isLandscape = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
  const [activeTool, setActiveTool] = React.useState<ActiveTool>('ch');
  const [isPlaying, setIsPlaying] = React.useState(false);

  // demo time values
  const [currentTime, setCurrentTime] = React.useState(0);
  const duration = 0; // your real duration later

  React.useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => setCurrentTime((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [isPlaying]);

//   return <>Editor Page</>

  return (
    <Box
      sx={{
        mt: 20,
        // position: 'relative',
        minHeight: '100vh',
        bgcolor: '#020617',
        // overflow: 'hidden',
      }}
    >
      {/* background glow */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        sx={{
          position: 'absolute',
          inset: -200,
          background:
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.22), transparent 45%),' +
            'radial-gradient(circle at 85% 25%, rgba(34,197,94,0.14), transparent 48%),' +
            'radial-gradient(circle at 65% 85%, rgba(236,72,153,0.12), transparent 52%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      />

      {/* CANVAS */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          px: 2,
          pb: 12, // room for bottom controls
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: 3,
            border: '1px solid rgba(148,163,184,0.18)',
            background:
              'linear-gradient(180deg, rgba(2,6,23,0.35), rgba(2,6,23,0.85))',
            boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* fake video frame */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.06), transparent 45%)',
            }}
          />

          {/* subtle inner vignette */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 78%)',
              pointerEvents: 'none',
            }}
          />

          {/* bottom transport row (Play + time) */}
          <Box
            sx={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 84,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              pointerEvents: 'none', // allow canvas gestures later; buttons override below
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              {/* scrubber dot */}
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  bgcolor: '#6366f1',
                  boxShadow: '0 0 0 6px rgba(99,102,241,0.15)',
                }}
              />
              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsPlaying((v) => !v)}
                sx={{
                  pointerEvents: 'auto',
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 2,
                  py: 0.75,
                  fontWeight: 900,
                  bgcolor: '#4f46e5',
                  color: '#E0E7FF',
                  '&:hover': { bgcolor: '#4338CA' },
                  minWidth: 72,
                }}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </Box>

            <Typography
              sx={{
                pointerEvents: 'none',
                color: 'rgba(148,163,184,0.9)',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Box>

          {/* timeline panel bottom-left */}
          <Box
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 18,
              width: isLandscape ? 420 : 320,
              maxWidth: '75vw',
            }}
          >
            <Typography
              sx={{
                color: 'rgba(148,163,184,0.75)',
                fontSize: 12,
                fontWeight: 800,
                mb: 1,
              }}
            >
              Timeline
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1.25 }}>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 12,
                  color: '#E5E7EB',
                  borderColor: 'rgba(148,163,184,0.28)',
                  bgcolor: 'rgba(15,23,42,0.55)',
                  '&:hover': {
                    borderColor: '#818CF8',
                    bgcolor: 'rgba(30,41,59,0.75)',
                  },
                }}
              >
                Trim
              </Button>

              <Button
                variant="contained"
                sx={{
                  borderRadius: 12,
                  textTransform: 'none',
                  fontWeight: 900,
                  fontSize: 12,
                  bgcolor: 'rgba(15,23,42,0.75)',
                  color: '#E5E7EB',
                  boxShadow: 'none',
                  border: '1px solid rgba(148,163,184,0.18)',
                  '&:hover': { bgcolor: 'rgba(30,41,59,0.85)' },
                }}
              >
                Add clip +
              </Button>
            </Stack>

            {/* stub: timeline track */}
            <Box
              sx={{
                height: 10,
                borderRadius: 999,
                bgcolor: 'rgba(148,163,184,0.18)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: '35%',
                  height: '100%',
                  bgcolor: 'rgba(99,102,241,0.65)',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* RIGHT FLOATING TOOL DOCK */}
      <Box
        sx={{
          position: 'absolute',
          top: 86,
          right: 14,
          zIndex: 20,
        }}
      >
        <Box
          sx={{
            p: 0.75,
            borderRadius: 999,
            border: '1px solid rgba(148,163,184,0.28)',
            bgcolor: 'rgba(2,6,23,0.55)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          }}
        >
          <Stack spacing={1}>
            {toolDefs.map((t) => {
              const active = activeTool === t.key;
              return (
                <Tooltip key={t.key} title={`${t.emoji} ${t.label}`} placement="left">
                  <IconButton
                    onClick={() => setActiveTool(t.key)}
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: active ? 'rgba(129,140,248,0.75)' : 'rgba(148,163,184,0.22)',
                      bgcolor: active ? 'rgba(79,70,229,0.85)' : 'rgba(15,23,42,0.70)',
                      color: '#E5E7EB',
                      boxShadow: active ? '0 10px 24px rgba(79,70,229,0.35)' : 'none',
                      '&:hover': {
                        bgcolor: active ? 'rgba(79,70,229,0.95)' : 'rgba(30,41,59,0.80)',
                      },
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
                      {t.emoji}
                      <Box component="span" sx={{ opacity: 0.9, ml: 0.35 }}>
                        {t.key.toUpperCase()}
                      </Box>
                    </Typography>
                  </IconButton>
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
      </Box>

      {/* OPTIONAL: active tool panel stub (slide up / toast) */}
      <AnimatePresence>
        {/* @ts-ignore */}
        {activeTool !== 'none' && (
          <Box
            component={motion.div}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 140,
              px: 1.25,
              py: 0.75,
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.18)',
              bgcolor: 'rgba(2,6,23,0.55)',
              color: 'rgba(226,232,240,0.92)',
              fontSize: 12,
              fontWeight: 900,
              backdropFilter: 'blur(10px)',
            }}
          >
            Active tool: {activeTool.toUpperCase()}
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}