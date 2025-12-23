// src/components/custom/VideoEditor/EditorMlPanel.web.tsx
import * as React from 'react';
import {
  Box,
  Divider,
  Stack,
  Switch,
  Typography,
  FormControlLabel,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEditorUiStore } from '@store/useEditorUiStore';

export default function EditorMlPanelWeb() {
  const {
    enableLiveML,
    setEnableLiveML,
    showEdgeAuras,
    setShowEdgeAuras,
    showBBoxes,
    setShowBBoxes,
    showLabels,
    setShowLabels,
    showDepthOverlay,
    setShowDepthOverlay,
  } = useEditorUiStore();

  return (
    <Box sx={panelSx} component={motion.div} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Typography sx={{ color: '#E5E7EB', fontSize: 13, fontWeight: 900 }}>
        ML / Vision
      </Typography>
      <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 11, mt: 0.25, mb: 1 }}>
        Toggle live effects driven by ML models.
      </Typography>

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.14)', mb: 1 }} />

      <Stack spacing={0.25}>
        <Row
          label="Enable live ML"
          value={enableLiveML}
          onChange={setEnableLiveML}
        />

        <Row
          label="Player aura (coco-ssd)"
          value={showEdgeAuras}
          onChange={setShowEdgeAuras}
          disabled={!enableLiveML}
        />

        <Row
          label="Bounding boxes"
          value={showBBoxes}
          onChange={setShowBBoxes}
          disabled={!enableLiveML}
        />

        <Row
          label="Class labels"
          value={showLabels}
          onChange={setShowLabels}
          disabled={!enableLiveML}
        />

        <Row
          label="Depth overlay"
          value={showDepthOverlay}
          onChange={setShowDepthOverlay}
          disabled={!enableLiveML}
        />
      </Stack>

      {!enableLiveML && (
        <Typography sx={{ mt: 1, color: 'rgba(148,163,184,0.7)', fontSize: 11 }}>
          Turn on “Enable live ML” to unlock the visualization toggles.
        </Typography>
      )}
    </Box>
  );
}

function Row({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5,
      }}
    >
      <Typography sx={{ color: '#E5E7EB', fontSize: 12, fontWeight: 700 }}>
        {label}
      </Typography>

      <FormControlLabel
        sx={{ m: 0 }}
        control={
          <Switch
            checked={value}
            onChange={(_, v) => onChange(v)}
            disabled={disabled}
            size="small"
            sx={switchSx}
          />
        }
        label=""
      />
    </Box>
  );
}

const panelSx = {
  px: 1.5,
  py: 1.25,
  bgcolor: 'rgba(2,6,23,0.96)',
  borderTop: '1px solid rgba(17,24,39,1)',
};

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#F9FAFB',
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#22C55E',
    opacity: 1,
  },
  '& .MuiSwitch-track': {
    backgroundColor: '#4B5563',
    opacity: 1,
  },
};