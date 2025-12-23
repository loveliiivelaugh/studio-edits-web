// src/components/custom/VideoEditor/EditorChatPanel.web.tsx
import * as React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';

import { client } from '@api/index'; // adjust to your axios client
import { useStudioStore } from '@store/useStudioStore';

export default function EditorChatPanelWeb({ projectId }: { projectId: string }) {
  const project = useStudioStore((s) => s.projects.find((p) => p.id === projectId));
  const updateProject = useStudioStore((s) => s.updateProject);

  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [lastExplanation, setLastExplanation] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!project) return null;

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      setIsSending(true);
      setError(null);
      setLastExplanation(null);

      const res = await client.post('/api/v1/openstudio/ai/chat-edit', {
        project,
        message: trimmed,
      });

      const data = res.data as {
        project: typeof project;
        explanation?: string;
      };

      updateProject(project.id, () => data.project);

      setLastExplanation(
        data.explanation ?? 'Applied AI edit. (No explanation returned from backend.)'
      );
      setMessage('');
    } catch (e: any) {
      console.error('chat-edit failed', e);
      const msg = e?.message ?? 'Something went wrong applying AI edit.';
      setError(msg);
      setLastExplanation(msg);
    } finally {
      setIsSending(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler = (e) => {
    // Cmd/Ctrl+Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
  };

  return (
    <Box sx={panelSx}>
      <Typography sx={{ color: '#E5E7EB', fontSize: 13, fontWeight: 900 }}>
        AI Editor Chat
      </Typography>
      <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 11, mt: 0.25, mb: 1 }}>
        Describe the edit you want. The AI will update your project.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(31,41,55,1)',
          bgcolor: 'rgba(2,6,23,0.75)',
          p: 1,
        }}
      >
        <TextField
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`e.g. "Cinematic fade-in and hype music on highlights"`}
          multiline
          minRows={2}
          maxRows={6}
          fullWidth
          sx={fieldSx}
        />
      </Paper>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
        <Typography sx={{ color: 'rgba(148,163,184,0.65)', fontSize: 11 }}>
          Tip: <b>Cmd/Ctrl + Enter</b> to apply
        </Typography>

        <Button
          component={motion.button}
          whileHover={{ scale: isSending ? 1 : 1.01 }}
          whileTap={{ scale: isSending ? 1 : 0.99 }}
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          variant="contained"
          sx={{
            borderRadius: 999,
            textTransform: 'none',
            fontWeight: 900,
            bgcolor: '#6366F1',
            '&:hover': { bgcolor: '#4F46E5' },
            '&.Mui-disabled': {
              bgcolor: 'rgba(99,102,241,0.30)',
              color: 'rgba(224,231,255,0.75)',
            },
            px: 2,
            py: 0.9,
          }}
        >
          {isSending ? <CircularProgress size={16} sx={{ color: '#E5E7EB' }} /> : 'Apply AI Edit'}
        </Button>
      </Stack>

      {!!error && (
        <Alert
          severity="error"
          sx={{
            mt: 1,
            borderRadius: 2,
            bgcolor: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(148,163,184,0.18)',
            color: '#E5E7EB',
            '& .MuiAlert-icon': { color: '#EF4444' },
          }}
        >
          {error}
        </Alert>
      )}

      {!!lastExplanation && !error && (
        <Box
          component={motion.div}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          sx={{
            mt: 1,
            color: 'rgba(148,163,184,0.85)',
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {lastExplanation}
        </Box>
      )}
    </Box>
  );
}

const panelSx = {
  px: 1.5,
  py: 1.25,
  bgcolor: 'rgba(2,6,23,0.96)',
  borderTop: '1px solid rgba(17,24,39,1)',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'rgba(15,23,42,0.35)',
    color: '#E5E7EB',
    '& fieldset': { borderColor: 'rgba(148,163,184,0.0)' },
    '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.0)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(129,140,248,0.55)' },
  },
  '& textarea': {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: 600,
  },
};