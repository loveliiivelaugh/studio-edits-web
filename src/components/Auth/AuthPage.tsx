import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { supabase } from '@api/supabase';
import { useSupabaseStore } from '@store/supabaseStore'; // <-- adjust path

export default function AuthPage({
  onAuthed,
}: {
  onAuthed?: () => void;
}) {
  const setSession = useSupabaseStore((s) => s.setSession);
  const setUserType = useSupabaseStore((s) => s.setUserType);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1) hydrate store if already authed
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn('[auth] getSession error', error);

      const session = data.session as any;
      setSession(session ?? null);

      if (session?.user) {
        // you can implement real role logic later
        setUserType(session.user?.email ? 'admin' : 'guest');
        onAuthed?.();
      }
    });

    // 2) keep store synced
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSession((session as any) ?? null);

      if (session?.user) {
        setUserType(session.user?.email ? 'admin' : 'guest');
        onAuthed?.();
      } else {
        setUserType(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [onAuthed, setSession, setUserType]);

  const signInWithGoogle = async () => {
    setMsg(null);
    try {
      setBusy(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // redirect happens automatically
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message ?? 'Google sign-in failed.' });
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#050816',
        color: '#E5E7EB',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        sx={{
          position: 'absolute',
          inset: -200,
          background:
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.30), transparent 45%), radial-gradient(circle at 80% 30%, rgba(34,197,94,0.20), transparent 45%), radial-gradient(circle at 60% 80%, rgba(236,72,153,0.18), transparent 50%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      />

      <Paper
        component={motion.div}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 4,
          border: '1px solid rgba(148,163,184,0.22)',
          background: 'rgba(2,6,23,0.75)',
          backdropFilter: 'blur(10px)',
          p: 2.75,
          position: 'relative',
        }}
      >
        <Stack gap={1.5}>
          <Box>
            <Typography fontWeight={900} fontSize={18}>
              OpenStudio
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.9)', mt: 0.25 }}>
              Sign in to sync projects, exports, and your library.
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signInWithGoogle}
            disabled={busy}
            fullWidth
            variant="outlined"
            sx={{
              py: 1.15,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 900,
              fontSize: 14,
              borderColor: 'rgba(148,163,184,0.35)',
              color: '#E5E7EB',
              bgcolor: 'rgba(15,23,42,0.65)',
              '&:hover': { borderColor: '#818CF8', bgcolor: 'rgba(30,41,59,0.85)' },
            }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width={18}
                height={18}
              />
              {busy ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#E0E7FF' }} />
                  Redirecting…
                </Box>
              ) : (
                'Continue with Google'
              )}
            </Box>
          </Button>

          <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.85)', lineHeight: 1.5 }}>
            By continuing you agree to Terms & Privacy (add later).
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}