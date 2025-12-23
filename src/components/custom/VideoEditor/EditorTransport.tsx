import * as React from 'react';
import { Box, Button, Slider, Typography } from '@mui/material';
import { motion } from 'framer-motion';

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function EditorTransportWeb({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
}: {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
}) {
  const [scrub, setScrub] = React.useState<number | null>(null);

  const value = scrub ?? currentTime;
  const max = Number.isFinite(duration) && duration > 0 ? duration : 1;

  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Slider
        value={value}
        min={0}
        max={max}
        step={0.01}
        onChange={(_, v) => setScrub(v as number)}
        onChangeCommitted={(_, v) => {
          setScrub(null);
          onSeek(v as number);
        }}
        sx={{
          mb: 1,
          color: '#6366f1',
          '& .MuiSlider-thumb': { width: 14, height: 14 },
          '& .MuiSlider-rail': { opacity: 0.25 },
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Button
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTogglePlay}
          sx={{
            textTransform: 'none',
            borderRadius: 999,
            px: 2,
            py: 0.75,
            fontWeight: 900,
            bgcolor: '#4f46e5',
            color: '#E0E7FF',
            '&:hover': { bgcolor: '#4338CA' },
            minWidth: 90,
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>

        <Typography sx={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 800 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  );
}