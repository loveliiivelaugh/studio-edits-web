// src/components/custom/VideoEditor/EditorAIPanel.web.tsx
import * as React from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  ButtonBase,
} from '@mui/material';
import { motion } from 'framer-motion';

type SmartEditHook = {
  isSmartEditing: boolean;
  runSmartEdit: () => Promise<void> | void;
};

type EditorAIPanelProps = {
  ui: any;
  smartEdit: SmartEditHook;
};

type Preset = {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function EditorAIPanelWeb({ ui, smartEdit }: EditorAIPanelProps) {
  const { isSmartEditing, runSmartEdit } = smartEdit;

  const presets: Preset[] = [
    {
      id: 'magic',
      title: 'AI Magic Edit',
      subtitle: 'Auto trims, slow-mo, transitions & overlays',
      badge: 'Default',
      primary: true,
      disabled: false,
      onPress: () => runSmartEdit(),
    },
    {
      id: 'sports',
      title: 'Sports Highlight Reel',
      subtitle: 'Focus on big plays & score moments',
      badge: 'Soon',
      primary: false,
      disabled: true,
      onPress: () => {},
    },
    {
      id: 'social-short',
      title: 'Social Short',
      subtitle: 'Punchy 9–15s vertical cuts',
      badge: 'Soon',
      primary: false,
      disabled: true,
      onPress: () => {},
    },
  ];

  return (
    <Box sx={panelSx}>
      <Typography sx={{ color: '#E5E7EB', fontSize: 13, fontWeight: 900 }}>
        AI Presets
      </Typography>
      <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 11, mt: 0.25, mb: 1 }}>
        Pick a style and let OpenStudio do the heavy lifting.
      </Typography>

      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          overflowX: 'auto',
          pb: 0.5,
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-thumb': { background: '#1f2937', borderRadius: 999 },
        }}
      >
        {presets.map((p) => {
          const disabled = p.disabled || (p.id === 'magic' && isSmartEditing);

          return (
            <Paper
              key={p.id}
              component={motion.div}
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              whileTap={{ scale: disabled ? 1 : 0.99 }}
              elevation={0}
              sx={{
                flex: '0 0 auto',
                width: 240,
                borderRadius: 3,
                border: '1px solid',
                borderColor: p.primary ? 'rgba(129,140,248,0.65)' : 'rgba(148,163,184,0.18)',
                bgcolor: p.primary ? 'rgba(17,24,39,0.85)' : 'rgba(2,6,23,0.75)',
                overflow: 'hidden',
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <ButtonBase
                disabled={disabled}
                onClick={p.onPress}
                sx={{ width: '100%', textAlign: 'left', display: 'block', p: 1.25 }}
              >
                <Stack spacing={0.75}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography sx={{ color: '#E5E7EB', fontSize: 13, fontWeight: 900 }}>
                      {p.title}
                    </Typography>

                    {p.badge && (
                      <Box
                        sx={{
                          px: 0.9,
                          py: 0.25,
                          borderRadius: 999,
                          bgcolor: 'rgba(79,70,229,0.16)',
                          border: '1px solid rgba(129,140,248,0.20)',
                          color: '#A5B4FC',
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        {p.badge}
                      </Box>
                    )}
                  </Stack>

                  <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 11 }}>
                    {p.subtitle}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
                    {p.id === 'magic' ? (
                      isSmartEditing ? (
                        <>
                          <CircularProgress size={14} sx={{ color: '#E5E7EB' }} />
                          <Typography sx={{ color: '#E5E7EB', fontSize: 11, fontWeight: 800 }}>
                            Running magic…
                          </Typography>
                        </>
                      ) : (
                        <Typography sx={{ color: '#E5E7EB', fontSize: 11, fontWeight: 800 }}>
                          Tap to apply
                        </Typography>
                      )
                    ) : (
                      <Typography sx={{ color: 'rgba(107,114,128,1)', fontSize: 11, fontWeight: 800 }}>
                        Coming soon
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </ButtonBase>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

const panelSx = {
  px: 1.5,
  pt: 1,
  pb: 1.25,
  bgcolor: 'rgba(2,6,23,0.96)',
  borderTop: '1px solid rgba(17,24,39,1)',
};