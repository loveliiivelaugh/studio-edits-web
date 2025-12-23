import * as React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
// import type { WebClip } from '@store/useEditorUiStore';

interface WebClip {
    [key: string]: any
};

export default function EditorCanvasWeb({
  clip,
  isPlaying,
  onPlayStateChange,
  onTime,
  onDuration,
}: {
  clip?: WebClip;
  isPlaying: boolean;
  onPlayStateChange: (p: boolean) => void;
  onTime: (t: number) => void;
  onDuration: (d: number) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // load selected clip into video tag
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const src = clip?.remoteUrl || clip?.localUrl;
    if (!src) {
      v.removeAttribute('src');
      v.load();
      return;
    }

    // if switching sources, reset time
    v.src = src;
    v.currentTime = clip?.start ?? 0;
    v.load();

    // pause when switching unless you want autoplay
    v.pause();
    onPlayStateChange(false);
  }, [clip?.id]);

  // play/pause driven from state
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!clip?.localUrl && !clip?.remoteUrl) return;

    if (isPlaying) v.play().catch(() => onPlayStateChange(false));
    else v.pause();
  }, [isPlaying, clip?.id]);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 3,
        border: '1px solid rgba(148,163,184,0.18)',
        background:
          'linear-gradient(180deg, rgba(2,6,23,0.35), rgba(2,6,23,0.85))',
        boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Real video */}
      <Box
        component="video"
        ref={videoRef}
        playsInline
        controls={false}
        onPlay={() => onPlayStateChange(true)}
        onPause={() => onPlayStateChange(false)}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          onTime(v.currentTime);
        }}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (!v) return;
          onDuration(v.duration || 0);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: '#000',
          display: 'block',
        }}
      />

      {/* subtle vignette */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 78%)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}