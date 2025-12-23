// src/components/custom/VideoEditor/EditorTextPanel.web.tsx
import * as React from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import type { Project, Overlay, TextVariant } from '@store/useStudioStore';
import { useStudioStore } from '@store/useStudioStore';
import { useEditorUiStore } from '@store/useEditorUiStore';

const VARIANTS: Array<{ key: TextVariant; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'caption', label: 'Caption' },
  { key: 'emoji', label: 'Emoji' },
];

export default function EditorTextPanel({
  project,
  ui,
}: {
  project: Project;
  ui: ReturnType<typeof useEditorUiStore>;
}) {
  const updateProject = useStudioStore((s) => s.updateProject);

  const {
    overlayVariant,
    setOverlayVariant,
    overlayText,
    setOverlayText,
    overlayStart,
    overlayEnd,
    currentTime,
  } = ui as any;

  const canAdd =
    (overlayVariant === 'emoji' ? overlayText.trim().length > 0 : overlayText.trim().length > 0) &&
    overlayEnd > overlayStart;

  const addOverlayFromControls = () => {
    if (!project) return;

    const ov: Overlay = {
      id: `ov-text-${Date.now()}`,
      type: 'text',
      start: overlayStart,
      end: overlayEnd,
      x: 0.5,
      y: overlayVariant === 'title' ? 0.18 : overlayVariant === 'subtitle' ? 0.24 : 0.82,
      text: overlayText,
      variant: overlayVariant,
      fontSize:
        overlayVariant === 'title'
          ? 42
          : overlayVariant === 'subtitle'
          ? 30
          : overlayVariant === 'emoji'
          ? 54
          : 20,
      fontWeight: overlayVariant === 'caption' ? '700' : '800',
      color: '#ffffff',
      opacity: 1,
      scale: 1,
    };

    updateProject(project.id, (p) => ({
      ...p,
      overlays: [...(p.overlays ?? []), ov],
    }));

    // UX: clear text after adding (optional)
    setOverlayText('');
  };

  // tiny helper: “Set start/end around playhead”
  const setToPlayhead = () => {
    const start = Math.max(0, currentTime);
    // @ts-ignore
    ui.setOverlayStart(start);
    // @ts-ignore
    ui.setOverlayEnd(start + 3);
  };

  return (
    <Paper
      component={motion.div}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22 }}
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 3,
        border: '1px solid rgba(148,163,184,0.18)',
        bgcolor: 'rgba(2,6,23,0.72)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Stack spacing={1}>
        <Box>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 900 }}>
            Text Overlay
          </Typography>
          <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
            Add titles, captions, or emojis to the canvas.
          </Typography>
        </Box>

        {/* Variant chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {VARIANTS.map((v) => {
            const active = overlayVariant === v.key;
            return (
              <Chip
                key={v.key}
                label={v.label}
                onClick={() => setOverlayVariant(v.key)}
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  fontSize: 12,
                  border: '1px solid',
                  borderColor: active ? 'rgba(129,140,248,0.65)' : 'rgba(148,163,184,0.22)',
                  bgcolor: active ? 'rgba(79,70,229,0.75)' : 'rgba(15,23,42,0.70)',
                  color: '#E5E7EB',
                  '&:hover': {
                    bgcolor: active ? 'rgba(79,70,229,0.9)' : 'rgba(30,41,59,0.82)',
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* Text + Add */}
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            fullWidth
            placeholder={overlayVariant === 'emoji' ? '😊🔥🏀' : 'Enter text…'}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                bgcolor: 'rgba(15,23,42,0.55)',
                color: '#E5E7EB',
                '& fieldset': { borderColor: 'rgba(148,163,184,0.22)' },
                '&:hover fieldset': { borderColor: 'rgba(129,140,248,0.6)' },
                '&.Mui-focused fieldset': { borderColor: '#818CF8' },
              },
              '& input::placeholder': { color: 'rgba(148,163,184,0.65)', opacity: 1 },
            }}
          />

          <Button
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addOverlayFromControls}
            disabled={!canAdd}
            variant="contained"
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 900,
              bgcolor: '#4f46e5',
              color: '#E0E7FF',
              px: 2,
              '&:hover': { bgcolor: '#4338CA' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(79,70,229,0.35)',
                color: 'rgba(224,231,255,0.75)',
              },
            }}
          >
            Add
          </Button>
        </Stack>

        {/* Timing */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 800 }}>
            Start: {overlayStart.toFixed(1)}s
          </Typography>
          <Button
            onClick={setToPlayhead}
            variant="text"
            sx={{
              textTransform: 'none',
              fontWeight: 900,
              fontSize: 12,
              color: '#A5B4FC',
              px: 1,
              minWidth: 'auto',
            }}
          >
            Set to playhead
          </Button>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 800 }}>
            End: {overlayEnd.toFixed(1)}s
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}