// src/components/custom/VideoEditor/EditorEffectsPanel.web.tsx
import * as React from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { Clip, FilterType, Project, TransitionType } from '@store/useStudioStore';
import { useStudioStore } from '@store/useStudioStore';
import { useEditorUiStore } from '@store/useEditorUiStore';

const filterOptions: Array<{ key: FilterType; label: string }> = [
  { key: 'none', label: 'None' },
  { key: 'warm', label: 'Warm' },
  { key: 'cool', label: 'Cool' },
  { key: 'bw', label: 'B&W' },
  { key: 'vibrant', label: 'Vibrant' },
];

const transitionOptions: TransitionType[] = ['none', 'crossfade', 'zoom', 'slide', 'glitch'];

const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export default function EditorEffectsPanelWeb({
  project,
  ui,
}: {
  project: Project;
  ui: ReturnType<typeof useEditorUiStore>;
}) {
  const updateProject = useStudioStore((s) => s.updateProject);

//   @ts-ignore
  const selectedClipId = ui.selectedClipId;
  const selectedClip = React.useMemo(
    () => project?.clips?.find((c) => c.id === selectedClipId) ?? null,
    [project?.clips, selectedClipId]
  );

  const updateClip = (clipId: string, patch: Partial<Clip>) => {
    updateProject(project.id, (p) => ({
      ...p,
      clips: (p.clips ?? []).map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
    }));
  };

  if (!selectedClip) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.25,
          borderRadius: 3,
          border: '1px solid rgba(148,163,184,0.18)',
          bgcolor: 'rgba(2,6,23,0.72)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 900 }}>
          Effects & Filters
        </Typography>
        <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12, mt: 0.5 }}>
          Select a clip to edit speed, filter, and transition.
        </Typography>
      </Paper>
    );
  }

  const currentSpeed = selectedClip.speed ?? 1;
  const currentFilter = selectedClip.filter ?? 'none';
  const currentTransition = selectedClip.transitionAfter ?? 'none';

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
      <Stack spacing={1.25}>
        <Box>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 900 }}>
            Effects & Filters
          </Typography>
          <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
            Speed, filter tint, and transition after the selected clip.
          </Typography>
        </Box>

        {/* SPEED */}
        <Box>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 900, mb: 0.75 }}>
            Speed
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {speedOptions.map((val) => {
              const active = currentSpeed === val;
              return (
                <Chip
                  key={val}
                  label={`${val}x`}
                  onClick={() => updateClip(selectedClip.id, { speed: val })}
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
        </Box>

        {/* FILTER */}
        <Box>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 900, mb: 0.75 }}>
            Filter
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {filterOptions.map((opt) => {
              const active = currentFilter === opt.key;
              return (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  onClick={() => updateClip(selectedClip.id, { filter: opt.key })}
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
        </Box>

        {/* TRANSITION */}
        <Box>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 900, mb: 0.75 }}>
            Transition after clip
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {transitionOptions.map((t) => {
              const active = currentTransition === t;
              return (
                <Chip
                  key={t}
                  label={t}
                  onClick={() => updateClip(selectedClip.id, { transitionAfter: t })}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    fontSize: 12,
                    border: '1px solid',
                    borderColor: active ? 'rgba(129,140,248,0.65)' : 'rgba(148,163,184,0.22)',
                    bgcolor: active ? 'rgba(79,70,229,0.75)' : 'rgba(15,23,42,0.70)',
                    color: '#E5E7EB',
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: active ? 'rgba(79,70,229,0.9)' : 'rgba(30,41,59,0.82)',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}