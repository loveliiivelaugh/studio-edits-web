// src/components/EditorTimeline.web.tsx
import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
// import { uploadClipFileWeb } from '@/utilities/lib/uploadClip.web';
// import { pickVideoFile } from '@/utilities/lib/pickVideoFile.web';
// import { getVideoDurationSeconds } from '@/utilities/lib/getVideoDuration.web';
import { useStudioStore } from '@store/useStudioStore';
import type { Clip } from '@store/useStudioStore';
// src/utilities/lib/uploadClip.web.ts
import {client} from '@api/index';

/**
 * Web upload: takes a File from <input type="file" /> and uploads via multipart/form-data.
 * Returns the backend URL (remoteUri) for the uploaded clip.
 */
export async function uploadClipFileWeb(file: File): Promise<string> {
  const formData = new FormData();

  // preserve filename if possible
  const filename = file.name || `clip_${Date.now()}.mp4`;
  formData.append('file', file, filename);

  const res = await client.post('/api/v1/openstudio/upload-clip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data as { url: string };
  return data.url;
}
// src/utilities/lib/pickVideoFile.web.ts
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
// src/utilities/lib/getVideoDuration.web.ts
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
export default function EditorTimelineWeb({
  project,
  ui,
}: {
  project: any;
  ui: any; // your editor ui store object (selectedClipId, setBusyReason, removeClip, setClips, etc.)
}) {
  const updateProject = useStudioStore((s) => s.updateProject);

  const clips: Clip[] = project?.clips ?? [];
  const selectedClipId = ui?.selectedClipId ?? null;

  const [isUploadingClip, setIsUploadingClip] = React.useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const syncClipsToProject = (nextClips: Clip[]) => {
    ui.setClips(nextClips);
    if (!project) return;

    updateProject(project.id, (p: any) => ({
      ...p,
      clips: nextClips.map((c, idx) => ({ ...c, order: idx })),
    }));
  };

  const handleSelectClip = (clipId: string) => ui.setSelectedClipId(clipId);

  const handleRemoveClip = (clipId: string) => {
    // if you already have ui.removeClip(), you can call that
    // but still keep project store in sync:
    const next = clips.filter((c) => c.id !== clipId).map((c, idx) => ({ ...c, order: idx }));
    syncClipsToProject(next);
  };

  const handleAddClip = async () => {
    const file = await pickVideoFile();
    if (!file) return;

    // local preview URL (web)
    const localUri = URL.createObjectURL(file);

    let remoteUrl = '';
    try {
      setIsUploadingClip(true);
      ui.setBusyReason?.('uploading');
      remoteUrl = await uploadClipFileWeb(file);
    } catch (e) {
      console.error('Upload clip failed', e);
      // you can allow local-only
      remoteUrl = '';
    } finally {
      setIsUploadingClip(false);
      ui.setBusyReason?.('none');
    }

    // duration (seconds)
    const durationSeconds = await getVideoDurationSeconds(localUri);

    const order = clips.length;
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      // web: local object URL for preview
      localUri,
      uri: localUri,
      // @ts-ignore
      remoteUri: remoteUrl || undefined,
      start: 0,
      end: durationSeconds,
      order,
      label: `Clip ${order + 1}`,
      transitionAfter: 'none',
      filter: 'none',
      speed: 1,
    };

    const next = [...clips, newClip].sort((a, b) => a.order - b.order);
    syncClipsToProject(next);
  };

  return (
    <Box sx={{ mt: 1, bgcolor: '#020617' }}>
      <Typography sx={{ color: '#9ca3af', fontSize: 12, mb: 0.5 }}>
        Timeline
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 999,
            borderColor: '#374151',
            color: '#e5e7eb',
            textTransform: 'none',
          }}
          onClick={() => ui.setTrimVisible?.(true)}
        >
          Trim
        </Button>
      </Box>

      {/* Horizontal scroll row */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          px: 1.5,
          pb: 1,
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-thumb': { background: '#1f2937', borderRadius: 999 },
        }}
      >
        {/* Add clip card */}
        <Box
          onClick={handleAddClip}
          sx={{
            width: 92,
            flex: '0 0 auto',
            borderRadius: 2,
            p: 1,
            bgcolor: '#111827',
            border: '1px solid #1f2937',
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: '#e5e7eb', fontSize: 11, fontWeight: 700 }}>
            {isUploadingClip ? 'Uploading…' : 'Add clip'}
          </Typography>
          <Typography sx={{ color: '#9ca3af', fontSize: 18, lineHeight: 1 }}>
            {isUploadingClip ? <CircularProgress size={14} /> : '+'}
          </Typography>
        </Box>

        {/* Clip cards */}
        {clips.map((clip) => {
          const isSelected = clip.id === selectedClipId;

          return (
            <Box
              key={clip.id}
              sx={{
                position: 'relative',
                width: 92,
                flex: '0 0 auto',
              }}
            >
              <Box
                onClick={() => handleSelectClip(clip.id)}
                sx={{
                  borderRadius: 2,
                  p: 1,
                  bgcolor: '#111827',
                  border: `1px solid ${isSelected ? '#6366f1' : '#1f2937'}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
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
                  {formatTime(clip.start)}–{formatTime(clip.end)}
                </Typography>
              </Box>

              {/* delete button */}
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
                ×
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}