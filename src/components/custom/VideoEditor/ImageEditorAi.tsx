// src/components/custom/ImageEditor/ImageEditorAiChatPanel.web.tsx
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

import { client } from '@api/index'; // adjust import to your axios client

// --- API helpers ------------------------------------------------------------

type GeneratePayload = {
  prompt: string;
  negativePrompt?: string;
  // width?: number;
  // height?: number;
};

type GenerateResponse = {
  imageDataUrl: string;
  model: string;
};

type EditPayload = {
  imageDataUrl: string;
  prompt: string;
  negativePrompt?: string;
};

type EditResponse = {
  imageDataUrl: string;
  sourceImageDataUrl: string;
  model: string;
};

async function generateImage(payload: GeneratePayload): Promise<GenerateResponse> {
  const response = await client.post<GenerateResponse>(
    '/api/v1/openstudio/nano-banana/generate',
    payload
  );
  return response.data;
}

async function editImage(payload: EditPayload): Promise<EditResponse> {
  const response = await client.post<EditResponse>(
    '/api/v1/openstudio/nano-banana/edit',
    payload
  );
  return response.data;
}

// --- UI ---------------------------------------------------------------------

type Tab = 'generate' | 'edit';

const sizePresets = [
  { label: 'Square 768×768', width: 768, height: 768 },
  { label: 'Portrait 768×1024', width: 768, height: 1024 },
  { label: 'Landscape 1024×576', width: 1024, height: 576 },
];

export default function ImageEditorAiChatPanelWeb({
  smartEdit,
  ui,
  setPreviewUrl,
}: {
  smartEdit?: any;
  ui?: any;
  setPreviewUrl: (url: string) => void;
}) {
  const [tab, setTab] = React.useState<Tab>('generate');

  const [prompt, setPrompt] = React.useState('');
  const [negativePrompt, setNegativePrompt] = React.useState('');
  const [sizeIndex, setSizeIndex] = React.useState(0);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = React.useState<
    { id: string; dataUrl: string; model?: string }[]
  >([]);
  const [editedImages, setEditedImages] = React.useState<
    { id: string; dataUrl: string; sourceDataUrl: string; model?: string }[]
  >([]);

  const [selectedForEdit, setSelectedForEdit] = React.useState<string | null>(null);

  const currentSize = sizePresets[sizeIndex];

  // Keep preview in sync (matches your RN behavior)
  React.useEffect(() => {
    const [first] = generatedImages;
    if (first?.dataUrl) setPreviewUrl(first.dataUrl);
  }, [generatedImages, setPreviewUrl]);

  React.useEffect(() => {
    const [firstEdit] = editedImages;
    if (firstEdit?.dataUrl) setPreviewUrl(firstEdit.dataUrl);
  }, [editedImages, setPreviewUrl]);

  async function onPressGenerate() {
    if (!prompt.trim()) {
      setError('Enter a prompt to generate an image.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await generateImage({
        prompt,
        negativePrompt: negativePrompt || undefined,
        // If you later add width/height in the backend, just uncomment:
        // width: currentSize.width,
        // height: currentSize.height,
      });

      const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setGeneratedImages((prev) => [{ id, dataUrl: res.imageDataUrl, model: res.model }, ...prev]);

      // optional: auto-select newest for edit
      setSelectedForEdit(id);
    } catch (e: any) {
      console.error('[ImageEditor] generate failed', e);
      setError(e?.message ?? 'Failed to generate image.');
    } finally {
      setIsLoading(false);
    }
  }

  async function onPressEdit() {
    if (!prompt.trim()) {
      setError('Enter a prompt to edit the image.');
      return;
    }
    if (!selectedForEdit) {
      setError('Select an image to edit.');
      return;
    }

    const base = generatedImages.find((g) => g.id === selectedForEdit);
    if (!base) {
      setError('Selected image not found.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await editImage({
        imageDataUrl: base.dataUrl,
        prompt,
        negativePrompt: negativePrompt || undefined,
      });

      const id = `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setEditedImages((prev) => [
        {
          id,
          dataUrl: res.imageDataUrl,
          sourceDataUrl: res.sourceImageDataUrl,
          model: res.model,
        },
        ...prev,
      ]);
    } catch (e: any) {
      console.error('[ImageEditor] edit failed', e);
      setError(e?.message ?? 'Failed to edit image.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Paper
      component={motion.div}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid rgba(148,163,184,0.18)',
        bgcolor: 'rgba(2,6,23,0.78)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 1.5, pt: 1.25, pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 13, color: '#E5E7EB' }}>
              Nano Banana
            </Typography>
            <Typography sx={{ color: 'rgba(148,163,184,0.78)', fontSize: 11 }}>
              Generate & edit images with prompts.
            </Typography>
          </Box>

          <ToggleButtonGroup
            exclusive
            value={tab}
            onChange={(_, v) => v && setTab(v)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontWeight: 900,
                fontSize: 12,
                borderColor: 'rgba(148,163,184,0.18)',
                color: 'rgba(226,232,240,0.86)',
                bgcolor: 'rgba(15,23,42,0.55)',
                px: 1.25,
                py: 0.5,
              },
              '& .Mui-selected': {
                bgcolor: 'rgba(79,70,229,0.75) !important',
                color: '#E0E7FF',
              },
            }}
          >
            <ToggleButton value="generate">Generate</ToggleButton>
            <ToggleButton value="edit">Edit</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.14)' }} />

      {/* Body */}
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          maxHeight: 460,
          overflow: 'auto',
        }}
      >
        <Stack spacing={1.25}>
          {/* Prompt */}
          <Box>
            <Typography sx={{ color: '#E5E7EB', fontSize: 12, fontWeight: 900, mb: 0.5 }}>
              Prompt
            </Typography>
            <TextField
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want…"
              multiline
              minRows={3}
              fullWidth
              sx={fieldSx}
            />
          </Box>

          {/* Negative prompt */}
          <Box>
            <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 12, fontWeight: 800, mb: 0.5 }}>
              Negative prompt (optional)
            </Typography>
            <TextField
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Things to avoid…"
              fullWidth
              sx={fieldSx}
            />
          </Box>

          {/* Size presets */}
          <Box>
            <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 12, fontWeight: 800, mb: 0.75 }}>
              Size preset
            </Typography>

            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
              {sizePresets.map((p, idx) => {
                const active = idx === sizeIndex;
                return (
                  <Button
                    key={p.label}
                    onClick={() => setSizeIndex(idx)}
                    variant="outlined"
                    component={motion.button}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    sx={{
                      flex: '0 0 auto',
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 900,
                      fontSize: 12,
                      borderColor: active ? 'rgba(129,140,248,0.55)' : 'rgba(148,163,184,0.18)',
                      color: active ? '#E0E7FF' : 'rgba(226,232,240,0.86)',
                      bgcolor: active ? 'rgba(79,70,229,0.25)' : 'rgba(15,23,42,0.55)',
                      '&:hover': {
                        borderColor: '#818CF8',
                        bgcolor: active ? 'rgba(79,70,229,0.30)' : 'rgba(30,41,59,0.70)',
                      },
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </Stack>

            <Typography sx={{ color: 'rgba(148,163,184,0.60)', fontSize: 11, mt: 0.5 }}>
              Current: {currentSize.label}
            </Typography>
          </Box>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <Box
                component={motion.div}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 6, opacity: 0 }}
              >
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: 2,
                    bgcolor: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(148,163,184,0.18)',
                    color: '#E5E7EB',
                    '& .MuiAlert-icon': { color: '#EF4444' },
                  }}
                >
                  {error}
                </Alert>
              </Box>
            )}
          </AnimatePresence>

          {/* Action button */}
          {tab === 'generate' ? (
            <Button
              onClick={onPressGenerate}
              disabled={isLoading}
              variant="contained"
              component={motion.button}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              sx={primaryBtnSx}
            >
              {isLoading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={16} sx={{ color: '#E0E7FF' }} />
                  <span>Generating…</span>
                </Stack>
              ) : (
                'Generate Image'
              )}
            </Button>
          ) : (
            <Button
              onClick={onPressEdit}
              disabled={isLoading || !selectedForEdit}
              variant="contained"
              component={motion.button}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              sx={primaryBtnSx}
            >
              {isLoading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={16} sx={{ color: '#E0E7FF' }} />
                  <span>Applying Edit…</span>
                </Stack>
              ) : selectedForEdit ? (
                'Apply Edit to Selected'
              ) : (
                'Select an Image Below'
              )}
            </Button>
          )}

          {/* Generated */}
          <Divider sx={{ borderColor: 'rgba(148,163,184,0.14)', mt: 0.5 }} />
          <Typography sx={{ color: '#E5E7EB', fontSize: 12, fontWeight: 900 }}>
            Generated images
          </Typography>

          {generatedImages.length === 0 ? (
            <Typography sx={{ color: 'rgba(148,163,184,0.65)', fontSize: 12 }}>
              Generated images will appear here.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
              {generatedImages.map((g) => {
                const active = selectedForEdit === g.id;
                return (
                  <Box
                    key={g.id}
                    component={motion.div}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedForEdit(g.id)}
                    sx={{
                      flex: '0 0 auto',
                      width: 124,
                      height: 124,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: active ? '2px solid rgba(224,231,255,0.9)' : '1px solid rgba(148,163,184,0.18)',
                      cursor: 'pointer',
                      position: 'relative',
                      bgcolor: 'rgba(15,23,42,0.55)',
                    }}
                    title={g.model ? `Model: ${g.model}` : undefined}
                  >
                    <img
                      src={g.dataUrl}
                      alt="generated"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {active && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 8,
                          bottom: 8,
                          px: 1,
                          py: 0.25,
                          borderRadius: 999,
                          bgcolor: 'rgba(0,0,0,0.55)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#E5E7EB',
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        Selected
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Edited */}
          <Divider sx={{ borderColor: 'rgba(148,163,184,0.14)', mt: 0.5 }} />
          <Typography sx={{ color: '#E5E7EB', fontSize: 12, fontWeight: 900 }}>
            Edited images
          </Typography>

          {editedImages.length === 0 ? (
            <Typography sx={{ color: 'rgba(148,163,184,0.65)', fontSize: 12 }}>
              Edits will appear here after you apply them.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
              {editedImages.map((e) => (
                <Box
                  key={e.id}
                  component={motion.div}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPreviewUrl(e.dataUrl)}
                  sx={{
                    flex: '0 0 auto',
                    width: 124,
                    height: 124,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid rgba(148,163,184,0.18)',
                    cursor: 'pointer',
                    bgcolor: 'rgba(15,23,42,0.55)',
                    position: 'relative',
                  }}
                  title={e.model ? `Model: ${e.model}` : undefined}
                >
                  <img
                    src={e.dataUrl}
                    alt="edited"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'rgba(15,23,42,0.55)',
    color: '#E5E7EB',
    '& fieldset': { borderColor: 'rgba(148,163,184,0.20)' },
    '&:hover fieldset': { borderColor: 'rgba(129,140,248,0.55)' },
    '&.Mui-focused fieldset': { borderColor: '#818CF8' },
  },
  '& .MuiInputBase-input, & textarea': {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: 600,
  },
};

const primaryBtnSx = {
  borderRadius: 999,
  textTransform: 'none',
  fontWeight: 900,
  bgcolor: '#4F46E5',
  '&:hover': { bgcolor: '#4338CA' },
  '&.Mui-disabled': { bgcolor: 'rgba(79,70,229,0.35)', color: 'rgba(224,231,255,0.75)' },
  py: 1.1,
};