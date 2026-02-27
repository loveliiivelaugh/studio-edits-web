import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import NorthRoundedIcon from '@mui/icons-material/NorthRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';
import type { Project, Clip } from '@store/useStudioStore';
import { useStudioStore } from '@store/useStudioStore';
import { useEditorUiStore } from '@store/useEditorUiStore';
import { openstudioClient } from '@api/index';

const MIN_CLIP_SPAN_SECONDS = 0.1;

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

function sortAndReindex(clips: Clip[]) {
  return clips
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((clip, index) => ({ ...clip, order: index }));
}

function sourceDurationForClip(clip: Clip) {
  return Math.max(clip.sourceDuration ?? clip.end ?? 0, clip.end ?? 0, clip.start ?? 0);
}

function timelineSignature(clips: Clip[]) {
  return JSON.stringify(
    sortAndReindex(clips).map((clip) => ({
      id: clip.id,
      order: clip.order,
      start: Number((clip.start ?? 0).toFixed(3)),
      end: Number((clip.end ?? 0).toFixed(3)),
    }))
  );
}

function moveClip(clips: Clip[], clipId: string, direction: -1 | 1) {
  const ordered = sortAndReindex(clips);
  const index = ordered.findIndex((clip) => clip.id === clipId);
  if (index < 0) return ordered;

  const targetIndex = clamp(index + direction, 0, ordered.length - 1);
  if (targetIndex === index) return ordered;

  const next = ordered.slice();
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);

  return sortAndReindex(next);
}

export async function uploadClipFileWeb(file: File): Promise<string> {
  const formData = new FormData();
  const filename = file.name || `clip_${Date.now()}.mp4`;
  formData.append('file', file, filename);

  const res = await openstudioClient.post('/upload-clip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data as { url: string };
  return data.url;
}

export function pickVideoFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = false;

    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      resolve(file);
    };

    input.click();
  });
}

export async function getVideoDurationSeconds(objectUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = objectUrl;

    const cleanup = () => {
      v.removeAttribute('src');
      v.load();
    };

    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 10;
      cleanup();
      resolve(d);
    };

    v.onerror = () => {
      cleanup();
      resolve(10);
    };
  });
}

export default function EditorTimelineWeb({ project }: { project: Project }) {
  const ui = useEditorUiStore();
  const setTimelineDraftDirty = useEditorUiStore((state) => state.setTimelineDraftDirty);
  const updateProject = useStudioStore((state) => state.updateProject);

  const persistedClips = React.useMemo(() => sortAndReindex(project?.clips ?? []), [project?.clips]);
  const persistedSignature = React.useMemo(() => timelineSignature(persistedClips), [persistedClips]);

  const [draftClips, setDraftClips] = React.useState<Clip[]>(persistedClips);
  const [isUploadingClip, setIsUploadingClip] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    setDraftClips(persistedClips);
  }, [persistedClips, persistedSignature]);

  const selectedClipId = ui.selectedClipId ?? draftClips[0]?.id;
  const selectedClip = draftClips.find((clip) => clip.id === selectedClipId) ?? draftClips[0];

  const draftSignature = React.useMemo(() => timelineSignature(draftClips), [draftClips]);
  const hasPendingEdits = draftSignature !== persistedSignature;

  const orderDirty = React.useMemo(() => {
    const byId = new Map(persistedClips.map((clip) => [clip.id, clip.order]));
    return draftClips.some((clip) => byId.get(clip.id) !== clip.order);
  }, [draftClips, persistedClips]);

  const trimDirty = React.useMemo(() => {
    const byId = new Map(persistedClips.map((clip) => [clip.id, clip]));
    return draftClips.some((clip) => {
      const persisted = byId.get(clip.id);
      if (!persisted) return false;
      return persisted.start !== clip.start || persisted.end !== clip.end;
    });
  }, [draftClips, persistedClips]);

  React.useEffect(() => {
    setTimelineDraftDirty(hasPendingEdits);
    return () => {
      setTimelineDraftDirty(false);
    };
  }, [hasPendingEdits, setTimelineDraftDirty]);

  const syncClipsToProject = React.useCallback(
    (nextClips: Clip[]) => {
      const normalized = sortAndReindex(nextClips);
      ui.setClips(normalized);
      updateProject(project.id, (p) => ({
        ...p,
        clips: normalized,
      }));
      setDraftClips(normalized);
    },
    [project.id, ui, updateProject]
  );

  const handleRemoveClip = React.useCallback(
    (clipId: string) => {
      const next = sortAndReindex(draftClips.filter((clip) => clip.id !== clipId));
      syncClipsToProject(next);

      if (ui.selectedClipId === clipId) {
        ui.setSelectedClipId(next[0]?.id);
      }

      setMsg({ type: 'success', text: 'Clip removed from timeline.' });
    },
    [draftClips, syncClipsToProject, ui]
  );

  const handleAddClip = React.useCallback(async () => {
    const file = await pickVideoFile();
    if (!file) return;

    const localUri = URL.createObjectURL(file);

    let remoteUri = '';
    try {
      setMsg(null);
      setIsUploadingClip(true);
      ui.setBusyReason('uploading');
      remoteUri = await uploadClipFileWeb(file);
    } catch (error: unknown) {
      remoteUri = '';
      setMsg({
        type: 'error',
        text: `${getErrorMessage(error)} The clip was added locally and can still be edited.`,
      });
    } finally {
      setIsUploadingClip(false);
      ui.setBusyReason('none');
    }

    const durationSeconds = await getVideoDurationSeconds(localUri);

    const order = draftClips.length;
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      uri: localUri,
      localUri,
      remoteUri,
      start: 0,
      end: durationSeconds,
      sourceDuration: durationSeconds,
      order,
      label: `Clip ${order + 1}`,
      transitionAfter: 'none',
      filter: 'none',
      speed: 1,
    };

    const next = sortAndReindex([...draftClips, newClip]);
    syncClipsToProject(next);
    ui.setSelectedClipId(newClip.id);
    ui.setActiveTool('timeline');
    setMsg({ type: 'success', text: 'Clip imported and added to timeline.' });
  }, [draftClips, syncClipsToProject, ui]);

  const updateDraftTrim = React.useCallback((clipId: string, field: 'start' | 'end', value: number) => {
    setDraftClips((current) =>
      current.map((clip) => {
        if (clip.id !== clipId) return clip;

        const maxDuration = Math.max(sourceDurationForClip(clip), MIN_CLIP_SPAN_SECONDS);

        if (field === 'start') {
          const nextStart = clamp(value, 0, Math.max(clip.end - MIN_CLIP_SPAN_SECONDS, 0));
          return { ...clip, start: nextStart, sourceDuration: maxDuration };
        }

        const minEnd = clip.start + MIN_CLIP_SPAN_SECONDS;
        const nextEnd = clamp(value, minEnd, maxDuration);
        return { ...clip, end: nextEnd, sourceDuration: maxDuration };
      })
    );
  }, []);

  const applyTrimEdits = React.useCallback(() => {
    const persistedById = new Map(persistedClips.map((clip) => [clip.id, clip]));
    const next = draftClips.map((clip) => {
      const persisted = persistedById.get(clip.id) || clip;
      return {
        ...persisted,
        start: clip.start,
        end: clip.end,
        sourceDuration: sourceDurationForClip(clip),
      };
    });

    syncClipsToProject(next);
    setMsg({ type: 'success', text: 'Trim points committed to timeline.' });
  }, [draftClips, persistedClips, syncClipsToProject]);

  const applySequenceEdits = React.useCallback(() => {
    const persistedById = new Map(persistedClips.map((clip) => [clip.id, clip]));
    const next = draftClips.map((clip) => {
      const persisted = persistedById.get(clip.id) || clip;
      return {
        ...persisted,
        order: clip.order,
      };
    });

    syncClipsToProject(next);
    setMsg({ type: 'success', text: 'Stitch order applied. Export will follow this sequence.' });
  }, [draftClips, persistedClips, syncClipsToProject]);

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
      <Stack spacing={1.1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography sx={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 900 }}>
            Timeline
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => ui.setTrimVisible(!ui.trimVisible)}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 800,
                fontSize: 12,
                color: '#E5E7EB',
                borderColor: 'rgba(148,163,184,0.28)',
                bgcolor: ui.trimVisible ? 'rgba(30,41,59,0.8)' : 'rgba(15,23,42,0.55)',
                '&:hover': { borderColor: '#818CF8', bgcolor: 'rgba(30,41,59,0.85)' },
              }}
            >
              {ui.trimVisible ? 'Hide Trim' : 'Trim Clip'}
            </Button>

            <Button
              onClick={handleAddClip}
              variant="contained"
              size="small"
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 900,
                fontSize: 12,
                bgcolor: 'rgba(15,23,42,0.75)',
                color: '#E5E7EB',
                boxShadow: 'none',
                border: '1px solid rgba(148,163,184,0.18)',
                '&:hover': { bgcolor: 'rgba(30,41,59,0.85)' },
              }}
              disabled={isUploadingClip}
            >
              {isUploadingClip ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} />
                  Uploading...
                </Box>
              ) : (
                'Import Clip +'
              )}
            </Button>
          </Stack>
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

        {hasPendingEdits && (
          <Alert
            severity="warning"
            sx={{
              borderRadius: 2,
              bgcolor: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.35)',
              color: '#FDE68A',
            }}
          >
            You have uncommitted timeline edits. Apply trim/sequence changes before export.
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pr: 1,
            pb: 1,
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { background: '#1f2937', borderRadius: 999 },
          }}
        >
          {draftClips.map((clip) => {
            const isSelected = clip.id === selectedClipId;

            return (
              <Box key={clip.id} sx={{ position: 'relative', width: 116, flex: '0 0 auto' }}>
                <Box
                  onClick={() => ui.setSelectedClipId(clip.id)}
                  sx={{
                    borderRadius: 2,
                    p: 1,
                    bgcolor: 'rgba(15,23,42,0.75)',
                    border: `1px solid ${isSelected ? '#6366f1' : 'rgba(148,163,184,0.18)'}`,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography sx={{ color: '#A5B4FC', fontSize: 10, fontWeight: 900 }}>
                      #{clip.order + 1}
                    </Typography>
                    <Stack direction="row" spacing={0.25}>
                      <Button
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDraftClips((current) => moveClip(current, clip.id, -1));
                        }}
                        sx={{ minWidth: 24, p: 0.3, color: '#CBD5E1' }}
                        title="Move earlier"
                      >
                        <NorthRoundedIcon fontSize="inherit" />
                      </Button>
                      <Button
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDraftClips((current) => moveClip(current, clip.id, 1));
                        }}
                        sx={{ minWidth: 24, p: 0.3, color: '#CBD5E1' }}
                        title="Move later"
                      >
                        <SouthRoundedIcon fontSize="inherit" />
                      </Button>
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      width: '100%',
                      height: 54,
                      borderRadius: 1.5,
                      bgcolor: '#0b1220',
                      mb: 0.5,
                      border: '1px solid #0f172a',
                    }}
                  />
                  <Typography
                    sx={{
                      color: isSelected ? '#c7d2fe' : '#e5e7eb',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={clip.label ?? clip.id}
                  >
                    {clip.label ?? clip.id}
                  </Typography>
                  <Typography sx={{ color: '#9ca3af', fontSize: 10, mt: 0.25 }}>
                    {formatTime(clip.start)}-{formatTime(clip.end)}
                  </Typography>
                </Box>

                <Box
                  onClick={() => handleRemoveClip(clip.id)}
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: '#f9fafb',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title="Remove clip"
                >
                  x
                </Box>
              </Box>
            );
          })}
        </Box>

        {ui.trimVisible && selectedClip && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(148,163,184,0.22)',
              bgcolor: 'rgba(15,23,42,0.65)',
              p: 1.1,
            }}
          >
            <Stack spacing={0.9}>
              <Typography sx={{ color: '#E2E8F0', fontSize: 12, fontWeight: 900 }}>
                Trim: {selectedClip.label ?? selectedClip.id}
              </Typography>

              <Typography sx={{ color: 'rgba(148,163,184,0.8)', fontSize: 11, fontWeight: 700 }}>
                In point: {formatTime(selectedClip.start)}
              </Typography>
              <Slider
                min={0}
                max={Math.max(selectedClip.end - MIN_CLIP_SPAN_SECONDS, 0)}
                step={0.05}
                value={selectedClip.start}
                onChange={(_, value) => updateDraftTrim(selectedClip.id, 'start', value as number)}
                sx={{ color: '#818CF8' }}
              />

              <Typography sx={{ color: 'rgba(148,163,184,0.8)', fontSize: 11, fontWeight: 700 }}>
                Out point: {formatTime(selectedClip.end)}
              </Typography>
              <Slider
                min={selectedClip.start + MIN_CLIP_SPAN_SECONDS}
                max={Math.max(sourceDurationForClip(selectedClip), selectedClip.start + MIN_CLIP_SPAN_SECONDS)}
                step={0.05}
                value={selectedClip.end}
                onChange={(_, value) => updateDraftTrim(selectedClip.id, 'end', value as number)}
                sx={{ color: '#22C55E' }}
              />

              <Typography sx={{ color: 'rgba(148,163,184,0.72)', fontSize: 11 }}>
                Preview and export use committed trim points.
              </Typography>

              <Button
                variant="contained"
                size="small"
                disabled={!trimDirty}
                onClick={applyTrimEdits}
                sx={{
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 900,
                  bgcolor: '#4F46E5',
                  '&:hover': { bgcolor: '#4338CA' },
                }}
              >
                Commit Trim
              </Button>
            </Stack>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(148,163,184,0.22)',
            bgcolor: 'rgba(15,23,42,0.65)',
            p: 1.1,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SwapHorizRoundedIcon sx={{ color: '#A5B4FC', fontSize: 16 }} />
              <Typography sx={{ color: '#E2E8F0', fontSize: 12, fontWeight: 900 }}>
                Stitch Sequence
              </Typography>
            </Stack>

            <Button
              variant="contained"
              size="small"
              disabled={!orderDirty}
              onClick={applySequenceEdits}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 900,
                bgcolor: '#0EA5E9',
                '&:hover': { bgcolor: '#0284C7' },
              }}
            >
              Apply Stitch Order
            </Button>
          </Stack>

          <Typography sx={{ color: 'rgba(148,163,184,0.72)', fontSize: 11, mt: 0.75 }}>
            Use arrows on each clip card to reorder. Export uses this exact committed order.
          </Typography>
        </Paper>
      </Stack>
    </Paper>
  );
}
