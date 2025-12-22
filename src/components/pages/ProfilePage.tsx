// src/pages/ProfilePage.tsx
import { supabase } from '@api/supabase';
import { Box, Typography, Stack, Avatar, Divider, Paper, Button } from '@mui/material';
import { useSupabaseStore } from '@store/supabaseStore';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const posts = 0;
  const followers = 2;
  const following = 2;

  return (
    <Box sx={{ px: 2, pt: 2 }}>
        <Button variant="outlined" color="primary" sx={{ my: 2 }}
        onClick={() => {
            supabase.auth.signOut()
            useSupabaseStore.getState().setSession(null)
        }}
        >
            Log Out
        </Button>
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        sx={{
          p: 2,
          borderRadius: 4,
          border: '1px solid rgba(148,163,184,0.14)',
          bgcolor: 'rgba(2,6,23,0.70)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(148,163,184,0.18)', fontWeight: 900 }}>
            ME
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Your Studio</Typography>
            <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
              OpenStudio Creations
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Stat label="Posts" value={posts} />
          <Stat label="Followers" value={followers} />
          <Stat label="Following" value={following} />
        </Stack>

        <Typography sx={{ mt: 1, color: '#EF4444', fontSize: 12, fontWeight: 800 }}>
          Network Error
        </Typography>

        <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.14)' }} />

        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 16, mb: 0.75 }}>No posts yet</Typography>
          <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: 13 }}>
            Your exported videos and saved images will show up here.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 90 }}>
      <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{value}</Typography>
      <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
        {label}
      </Typography>
    </Box>
  );
}