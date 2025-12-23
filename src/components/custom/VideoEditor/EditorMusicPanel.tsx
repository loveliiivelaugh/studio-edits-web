// src/components/custom/VideoEditor/EditorMusicPanel.web.tsx
import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { motion } from 'framer-motion';

import { useStudioStore, type MusicTrack, type Project } from '@store/useStudioStore';
import { useEditorUiStore } from '@store/useEditorUiStore';
import {client} from '@api/index'; // adjust to your axios client path

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function EditorMusicPanelWeb({
  project,
}: {
  project: Project;
}) {
  const updateProject = useStudioStore((s) => s.updateProject);
  const ui = useEditorUiStore();

  const [isLoadingMusic, setIsLoadingMusic] = React.useState(false);
  const [showMusicPicker, setShowMusicPicker] = React.useState(false);
  const [musicTracks, setMusicTracks] = React.useState<MusicTrack[]>([]);
  const [msg, setMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Web preview audio element
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false);

  // duration: use projectDuration from UI store (your playback hook already sets it)
  const totalDuration = ui.projectDuration || 0;

  const loadMusicTracks = React.useCallback(async () => {
    setMsg(null);

    if (musicTracks.length) {
      setShowMusicPicker(true);
      return;
    }

    setIsLoadingMusic(true);
    try {
      const res = await client.get('/api/v1/openstudio/assets/music');
      const data = res.data as { tracks: MusicTrack[] };
      setMusicTracks(data.tracks || []);
      setShowMusicPicker(true);
    } catch (e: any) {
      console.error('[Music] Failed to load tracks', e);
      setMsg({ type: 'error', text: e?.message ?? 'Could not load tracks right now.' });
    } finally {
      setIsLoadingMusic(false);
    }
  }, [musicTracks.length]);

  const fetchBeatsForTrack = React.useCallback(
    async (trackId: string) => {
      try {
        const res = await client.get(`/api/v1/openstudio/assets/music/${trackId}/beats`);
        const data = res.data as { beats: number[] };
        updateProject(project.id, (p) => ({
          ...p,
          music: p.music ? { ...p.music, beats: data.beats ?? [] } : p.music,
        }));
      } catch (e: any) {
        console.warn('[Music] Beats fetch failed', e);
        // not fatal
      }
    },
    [project.id, updateProject]
  );

  const stopPreview = React.useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {}
    setIsPreviewPlaying(false);
  }, []);

  const handleSelectMusicTrack = React.useCallback(
    async (track: MusicTrack) => {
      setMsg(null);

      // stop existing preview
      await stopPreview();

      // Persist into project.music
      updateProject(project.id, (p) => ({
        ...p,
        music: {
          id: track.id,
          title: track.title,
          artist: track.artist,
          uri: track.previewUrl,
          volume: p.music?.volume ?? 1,
          offset: p.music?.offset ?? 0,
          beats: p.music?.beats ?? [],
        },
      }));

      setShowMusicPicker(false);

      // preload preview audio
      if (audioRef.current) {
        audioRef.current.src = track.previewUrl;
        audioRef.current.volume = project.music?.volume ?? 1;
      }

      // fetch beats in background
      fetchBeatsForTrack(track.id);

      setMsg({ type: 'success', text: `Added “${track.title}”.` });
    },
    [fetchBeatsForTrack, project.id, stopPreview, updateProject, project.music?.volume]
  );

  const handleRemoveMusic = React.useCallback(async () => {
    setMsg(null);
    await stopPreview();

    updateProject(project.id, (p) => ({
      ...p,
      music: undefined,
    }));

    setMsg({ type: 'success', text: 'Removed background music.' });
  }, [project.id, stopPreview, updateProject]);

  const togglePreview = React.useCallback(async () => {
    setMsg(null);

    const music = project.music;
    if (!music?.uri) {
      setMsg({ type: 'error', text: 'Pick a track first.' });
      return;
    }

    const el = audioRef.current;
    if (!el) return;

    try {
      // ensure correct source + volume
      if (el.src !== music.uri) el.src = music.uri;
      el.volume = music.volume ?? 1;

      if (el.paused) {
        await el.play();
        setIsPreviewPlaying(true);
      } else {
        el.pause();
        setIsPreviewPlaying(false);
      }
    } catch (e: any) {
      console.warn('[Music] Preview play failed', e);
      setMsg({ type: 'error', text: 'Browser blocked autoplay — click again to play.' });
    }
  }, [project.music]);

  // keep preview state in sync
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onEnded = () => setIsPreviewPlaying(false);
    const onPause = () => setIsPreviewPlaying(false);
    const onPlay = () => setIsPreviewPlaying(true);

    el.addEventListener('ended', onEnded);
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);

    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, []);

  const music = project.music;

  return (
    <Box sx={{ p: 1 }}>
      {/* hidden audio element for preview */}
      <audio ref={audioRef} preload="auto" />

      <Stack spacing={1.25}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <QueueMusicRoundedIcon sx={{ color: 'rgba(148,163,184,0.9)' }} fontSize="small" />
            <Typography sx={{ color: '#E5E7EB', fontSize: 13, fontWeight: 900 }}>
              Music
            </Typography>
          </Stack>

          {!music ? (
            <Button
              component={motion.button}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={loadMusicTracks}
              variant="outlined"
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 900,
                fontSize: 12,
                borderColor: 'rgba(148,163,184,0.28)',
                color: '#E5E7EB',
                bgcolor: 'rgba(15,23,42,0.55)',
                '&:hover': { borderColor: '#818CF8', bgcolor: 'rgba(30,41,59,0.75)' },
              }}
            >
              {isLoadingMusic ? 'Loading…' : 'Add music'}
            </Button>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={motion.button}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={loadMusicTracks}
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 900,
                  fontSize: 12,
                  borderColor: 'rgba(148,163,184,0.28)',
                  color: '#E5E7EB',
                  bgcolor: 'rgba(15,23,42,0.55)',
                  '&:hover': { borderColor: '#818CF8', bgcolor: 'rgba(30,41,59,0.75)' },
                }}
              >
                Change
              </Button>

              <IconButton
                onClick={handleRemoveMusic}
                sx={{
                  width: 38,
                  height: 38,
                  border: '1px solid rgba(148,163,184,0.22)',
                  bgcolor: 'rgba(15,23,42,0.55)',
                  color: '#E5E7EB',
                  '&:hover': { bgcolor: 'rgba(30,41,59,0.75)' },
                }}
                title="Remove music"
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Stack>

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

        {!music ? (
          <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
            Add background music, control volume, and choose where it starts in the timeline.
          </Typography>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 1.1,
              borderRadius: 3,
              border: '1px solid rgba(148,163,184,0.18)',
              bgcolor: 'rgba(2,6,23,0.55)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: '#E5E7EB', fontSize: 13, fontWeight: 900 }} noWrap>
                    {music.title || 'Background track'}
                  </Typography>
                  {music.artist ? (
                    <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }} noWrap>
                      {music.artist}
                    </Typography>
                  ) : null}
                </Box>

                <Button
                  onClick={togglePreview}
                  component={motion.button}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  variant="contained"
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 900,
                    bgcolor: 'rgba(79,70,229,0.90)',
                    '&:hover': { bgcolor: 'rgba(79,70,229,1)' },
                    px: 1.25,
                    py: 0.75,
                    minWidth: 110,
                  }}
                  startIcon={isPreviewPlaying ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                >
                  {isPreviewPlaying ? 'Pause' : 'Preview'}
                </Button>
              </Stack>

              <Divider sx={{ borderColor: 'rgba(148,163,184,0.14)' }} />

              {/* Volume */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 800 }}>
                    Volume
                  </Typography>
                  <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
                    {(music.volume ?? 1).toFixed(2)}
                  </Typography>
                </Stack>

                <Slider
                  value={music.volume ?? 1}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(_, v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    updateProject(project.id, (p) => ({
                      ...p,
                      music: p.music ? { ...p.music, volume: val } : p.music,
                    }));
                    if (audioRef.current) audioRef.current.volume = val;
                  }}
                  sx={{
                    mt: 0.25,
                    '& .MuiSlider-rail': { opacity: 0.25 },
                  }}
                />
              </Box>

              {/* Offset */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 800 }}>
                    Start at
                  </Typography>
                  <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }}>
                    {formatTime(music.offset ?? 0)}
                  </Typography>
                </Stack>

                <Slider
                  value={music.offset ?? 0}
                  min={0}
                  max={Math.max(0, totalDuration || 0)}
                  step={0.1}
                  onChange={(_, v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    updateProject(project.id, (p) => ({
                      ...p,
                      music: p.music ? { ...p.music, offset: val } : p.music,
                    }));
                  }}
                  sx={{
                    mt: 0.25,
                    '& .MuiSlider-rail': { opacity: 0.25 },
                  }}
                />

                <Typography sx={{ color: 'rgba(148,163,184,0.65)', fontSize: 11, mt: 0.25 }}>
                  Starts at {formatTime(music.offset ?? 0)} in the video
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Picker dialog */}
        <Dialog
          open={showMusicPicker}
          onClose={() => setShowMusicPicker(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 4,
              border: '1px solid rgba(148,163,184,0.18)',
              bgcolor: 'rgba(2,6,23,0.92)',
              backdropFilter: 'blur(12px)',
              color: '#E5E7EB',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Choose a track</Typography>
              <IconButton
                onClick={() => setShowMusicPicker(false)}
                sx={{ color: 'rgba(226,232,240,0.9)' }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ pt: 1 }}>
            {isLoadingMusic && !musicTracks.length ? (
              <Stack alignItems="center" spacing={1.25} sx={{ py: 3 }}>
                <CircularProgress />
                <Typography sx={{ color: 'rgba(148,163,184,0.8)', fontSize: 12 }}>
                  Loading tracks…
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1}>
                {musicTracks.map((t) => (
                  <Paper
                    key={t.id}
                    component={motion.div}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.995 }}
                    elevation={0}
                    onClick={() => handleSelectMusicTrack(t)}
                    sx={{
                      cursor: 'pointer',
                      p: 1.2,
                      borderRadius: 3,
                      border: '1px solid rgba(148,163,184,0.16)',
                      bgcolor: 'rgba(15,23,42,0.55)',
                      '&:hover': {
                        borderColor: 'rgba(129,140,248,0.55)',
                        bgcolor: 'rgba(30,41,59,0.70)',
                      },
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: 13 }} noWrap>
                      {t.title}
                    </Typography>
                    {t.artist ? (
                      <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12 }} noWrap>
                        {t.artist}
                      </Typography>
                    ) : null}
                  </Paper>
                ))}

                {!musicTracks.length && (
                  <Typography sx={{ color: 'rgba(148,163,184,0.75)', fontSize: 12, py: 2 }}>
                    No tracks returned from the server.
                  </Typography>
                )}
              </Stack>
            )}
          </DialogContent>
        </Dialog>
      </Stack>
    </Box>
  );
}