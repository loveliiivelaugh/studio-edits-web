// src/components/custom/VideoEditor/EditorExportPanel.web.tsx
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { client } from '@api/index'; // adjust path to your axios client
import { unmaskUrl } from '@store/useSmartEdit'; // adjust path
import type { BusyReason } from '@store/useEditorUiStore';
import type { Project } from '@store/useStudioStore';

function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // fallback
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

export default function EditorExportPanel({
  project,
  ui,
}: {
  project: Project;
  ui: {
    isExporting: boolean;
    setIsExporting: (v: boolean) => void;
    setBusyReason: (v: BusyReason) => void;
  };
}) {
  const { isExporting, setIsExporting } = ui;

  const [lastExportUrl, setLastExportUrl] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canExport = Boolean(project?.clips?.length);

  const handleExport = React.useCallback(async () => {
    setMsg(null);

    if (!project?.clips?.length) {
      setMsg({ type: 'error', text: 'Add at least one clip first.' });
      return;
    }

    try {
      ui.setBusyReason('export');
      setIsExporting(true);

      // 1) Ask backend to export
      const res = await client.post('/api/v1/openstudio/export', { project });
      const url: string = unmaskUrl(res.data?.url);

      if (!url) throw new Error('No URL returned from export.');

      setLastExportUrl(url);

      // 2) Download (best UX: immediate)
      downloadUrl(url, `openstudio_export_${Date.now()}.mp4`);

      setMsg({ type: 'success', text: 'Export started. Download should begin shortly.' });
    } catch (e: any) {
      console.error('[ExportWeb] Export failed', e);
      setMsg({ type: 'error', text: e?.message ?? 'Export failed.' });
    } finally {
      setIsExporting(false);
      ui.setBusyReason('none');
    }
  }, [project, setIsExporting, ui]);

  const handleShareLastExport = React.useCallback(async () => {
    setMsg(null);
    if (!lastExportUrl) {
      setMsg({ type: 'error', text: 'Export a video first, then you can share it.' });
      return;
    }

    try {
      // If running as mobile PWA, Web Share API may exist
      // (note: sharing files is more complex; sharing URL is reliable)
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({
          title: 'OpenStudio export',
          text: 'Check out my OpenStudio export',
          url: lastExportUrl,
        });
        setMsg({ type: 'success', text: 'Share sheet opened.' });
        return;
      }

      await copyToClipboard(lastExportUrl);
      setMsg({ type: 'success', text: 'Link copied to clipboard.' });
    } catch (e: any) {
      console.error('[ExportWeb] Share failed', e);
      setMsg({ type: 'error', text: e?.message ?? 'Share failed.' });
    }
  }, [lastExportUrl]);

  const handleCopyLink = React.useCallback(async () => {
    setMsg(null);
    if (!lastExportUrl) return;
    try {
      await copyToClipboard(lastExportUrl);
      setMsg({ type: 'success', text: 'Link copied to clipboard.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message ?? 'Copy failed.' });
    }
  }, [lastExportUrl]);

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
      <Stack spacing={1.1}>
        <Box>
          <Typography sx={{ color: '#9ca3af', fontSize: 12, fontWeight: 900 }}>
            Export
          </Typography>
          <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
            Render your project into a single video and download it.
          </Typography>
        </Box>

        {msg && (
          <Alert
            severity={msg.type}
            sx={{
              borderRadius: 2,
              bgcolor: msg.type === 'success' ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(148,163,184,0.18)',
              color: '#E5E7EB',
              '& .MuiAlert-icon': { color: msg.type === 'success' ? '#22C55E' : '#EF4444' },
            }}
          >
            {msg.text}
          </Alert>
        )}

        <Button
          component={motion.button}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleExport}
          disabled={!canExport || isExporting}
          variant="contained"
          sx={{
            borderRadius: 999,
            textTransform: 'none',
            fontWeight: 900,
            py: 1.1,
            bgcolor: '#22c55e',
            color: '#052e16',
            '&:hover': { bgcolor: '#16a34a' },
            '&.Mui-disabled': {
              bgcolor: 'rgba(34,197,94,0.25)',
              color: 'rgba(240,253,244,0.7)',
            },
          }}
        >
          {isExporting ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} sx={{ color: '#dcfce7' }} />
              <span>Exporting…</span>
            </Stack>
          ) : (
            'Export & Download'
          )}
        </Button>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleShareLastExport}
            disabled={!lastExportUrl || isExporting}
            variant="outlined"
            sx={{
              flex: 1,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 900,
              borderColor: 'rgba(148,163,184,0.28)',
              color: '#E5E7EB',
              bgcolor: 'rgba(15,23,42,0.55)',
              '&:hover': { borderColor: '#818CF8', bgcolor: 'rgba(30,41,59,0.75)' },
              '&.Mui-disabled': {
                opacity: 0.5,
                borderColor: 'rgba(148,163,184,0.18)',
              },
            }}
          >
            Share / Copy Link
          </Button>

          <Button
            onClick={handleCopyLink}
            disabled={!lastExportUrl || isExporting}
            variant="text"
            sx={{
              flex: 0.6,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 900,
              color: '#A5B4FC',
              '&.Mui-disabled': { opacity: 0.5 },
            }}
          >
            Copy
          </Button>
        </Stack>

        <TextField
          value={lastExportUrl ?? ''}
          size="small"
          placeholder="Last export link will appear here…"
          InputProps={{ readOnly: true }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'rgba(15,23,42,0.55)',
              color: '#E5E7EB',
              '& fieldset': { borderColor: 'rgba(148,163,184,0.18)' },
            },
            '& input::placeholder': { color: 'rgba(148,163,184,0.65)', opacity: 1 },
          }}
        />

        {!canExport && (
          <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
            Add a clip to enable export.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}