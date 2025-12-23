// src/utilities/store/useEditorPlayback.ts (WEB)
// NOTE: This version is for HTMLVideoElement (web). No Expo AV methods.

import { useMemo, useRef, useCallback, useEffect } from 'react';
import type { Project, Clip } from '@store/useStudioStore';
import { useEditorUiStore } from '@store/useEditorUiStore';

type Args = {
  project?: Project;
  smartPreviewUrl?: string | null;
};

function clipDuration(c: Clip): number {
  const speed = c.speed || 1;
  return Math.max(0, (c.end - c.start) / speed);
}

function clamp(n: number, a: number, b: number) {
  return Math.min(Math.max(n, a), b);
}

export function useEditorPlayback({ project, smartPreviewUrl }: Args) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    selectedClipId,
    setSelectedClipId,

    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    projectDuration,
    setProjectDuration,

    scrubValue,
    setScrubValue,

    isRenderedPreview,
    setIsRenderedPreview,

    activeTransition,
    setActiveTransition,
  } = useEditorUiStore();

  const clips = project?.clips ?? [];

  const orderedClips = useMemo(
    () => clips.slice().sort((a, b) => a.order - b.order),
    [clips]
  );

  const totalDuration = useMemo(
    () => orderedClips.reduce((acc, c) => acc + clipDuration(c), 0),
    [orderedClips]
  );

  // default selection
  useEffect(() => {
    if (!selectedClipId && orderedClips.length > 0) {
      setSelectedClipId(orderedClips[0].id);
    }
  }, [orderedClips, selectedClipId, setSelectedClipId]);

  const selectedIndex = useMemo(() => {
    if (!orderedClips.length) return -1;
    if (!selectedClipId) return 0;
    const idx = orderedClips.findIndex((c) => c.id === selectedClipId);
    return idx === -1 ? 0 : idx;
  }, [orderedClips, selectedClipId]);

  const selectedClip =
    selectedIndex >= 0 ? orderedClips[selectedIndex] : orderedClips[0];

  // init duration
  useEffect(() => {
    if (totalDuration > 0 && projectDuration !== totalDuration && !isRenderedPreview) {
      setProjectDuration(totalDuration);
    }
  }, [totalDuration, projectDuration, setProjectDuration, isRenderedPreview]);

  // which video URI should the <video> show
  const videoSourceUri =
    isRenderedPreview && smartPreviewUrl
      ? smartPreviewUrl
      : selectedClip
      ? (selectedClip.localUri ?? selectedClip.uri)
      : undefined;

  const durationForScrubber = isRenderedPreview
    ? (projectDuration || 0)
    : (totalDuration || 0);

  const sliderMax = durationForScrubber > 0 ? durationForScrubber : 1;
  const sliderValue = scrubValue ?? currentTime;

  // ---- helpers ----

  const computeTimelineOffsetForIndex = useCallback(
    (idx: number) => {
      return orderedClips.slice(0, idx).reduce((acc, c) => acc + clipDuration(c), 0);
    },
    [orderedClips]
  );

  const findClipAtProjectTime = useCallback(
    (t: number) => {
      let acc = 0;
      for (let i = 0; i < orderedClips.length; i++) {
        const d = clipDuration(orderedClips[i]);
        if (t < acc + d) {
          const localInSegment = t - acc; // timeline seconds within this clip segment (after speed)
          const speed = orderedClips[i].speed || 1;
          const localInSource = (orderedClips[i].start ?? 0) + localInSegment * speed;
          return { index: i, clip: orderedClips[i], localTime: localInSource, segmentStart: acc };
        }
        acc += d;
      }
      // clamp to last clip end
      const lastIdx = Math.max(0, orderedClips.length - 1);
      const last = orderedClips[lastIdx];
      return {
        index: lastIdx,
        clip: last,
        localTime: last.end ?? 0,
        segmentStart: computeTimelineOffsetForIndex(lastIdx),
      };
    },
    [orderedClips, computeTimelineOffsetForIndex]
  );

  const goToClipByIndex = useCallback(
    async (index: number, autoPlay: boolean) => {
      if (!orderedClips.length) return;
      const clampedIndex = clamp(index, 0, orderedClips.length - 1);
      const target = orderedClips[clampedIndex];

      setSelectedClipId(target.id);

      const vid = videoRef.current;
      const timelineOffset = computeTimelineOffsetForIndex(clampedIndex);

      // Update global time immediately (timeline)
      setCurrentTime(timelineOffset);

      if (!vid) {
        setIsPlaying(autoPlay);
        return;
      }

      // In rendered mode, we seek within the single file at timeline time.
      if (isRenderedPreview) {
        vid.currentTime = timelineOffset;
        if (autoPlay) {
          await vid.play().catch(() => {});
          setIsPlaying(true);
        } else {
          vid.pause();
          setIsPlaying(false);
        }
        return;
      }

      // In live mode, we need to ensure the <video> is on the right src first.
      // Your EditorPage/Canvas should re-render <video src={videoSourceUri}>
      // after selectedClipId changes. We'll seek on next tick.
      const seekTo = target.start ?? 0;

      // Wait a microtask so React can swap src in DOM
      queueMicrotask(() => {
        const v = videoRef.current;
        if (!v) return;
        // Seek into the clip source
        v.currentTime = seekTo;
        if (autoPlay) {
          v.play().catch(() => {});
          setIsPlaying(true);
        } else {
          v.pause();
          setIsPlaying(false);
        }
      });
    },
    [
      orderedClips,
      isRenderedPreview,
      setSelectedClipId,
      setCurrentTime,
      setIsPlaying,
      computeTimelineOffsetForIndex,
    ]
  );

  const advanceToNextClip = useCallback(async () => {
    if (selectedIndex < 0 || selectedIndex >= orderedClips.length - 1) {
      setIsPlaying(false);
      return;
    }

    const current = orderedClips[selectedIndex];
    const transition = current.transitionAfter || 'none';

    if (transition !== 'none') {
      setActiveTransition(transition);
      setTimeout(async () => {
        setActiveTransition('none');
        await goToClipByIndex(selectedIndex + 1, true);
      }, 160);
    } else {
      await goToClipByIndex(selectedIndex + 1, true);
    }
  }, [
    orderedClips,
    selectedIndex,
    setIsPlaying,
    setActiveTransition,
    goToClipByIndex,
  ]);

  // ---- wire HTMLVideoElement events -> store ----
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onLoadedMeta = () => {
      if (isRenderedPreview) {
        const d = Number.isFinite(vid.duration) ? vid.duration : 0;
        if (d > 0) setProjectDuration(d);
      }
    };

    const onTimeUpdate = () => {
      const local = vid.currentTime || 0;

      if (isRenderedPreview) {
        setCurrentTime(local);
        return;
      }

      // live mode: timeline time = sum(prev clip segments) + local segment time
      if (!selectedClip) return;

      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      const segStart = computeTimelineOffsetForIndex(idx);

      const speed = selectedClip.speed || 1;
      const segLocal = Math.max(0, (local - (selectedClip.start ?? 0)) / speed);
      const segDur = clipDuration(selectedClip);

      const timelineT = segStart + clamp(segLocal, 0, segDur);
      setCurrentTime(timelineT);

      // auto-advance near end (guard if duration not ready)
      const clipEnd = (selectedClip.end ?? 0);
      if (local >= clipEnd - 0.05) {
        if (!vid.paused) {
          advanceToNextClip().catch(() => {});
        }
      }
    };

    const onEnded = () => {
      if (isRenderedPreview) {
        setIsPlaying(false);
      } else {
        advanceToNextClip().catch(() => {});
      }
    };

    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('loadedmetadata', onLoadedMeta);
    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('ended', onEnded);

    return () => {
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('loadedmetadata', onLoadedMeta);
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('ended', onEnded);
    };
  }, [
    setIsPlaying,
    setCurrentTime,
    setProjectDuration,
    isRenderedPreview,
    selectedClip,
    selectedIndex,
    computeTimelineOffsetForIndex,
    advanceToNextClip,
  ]);

  // ---- UI actions ----

  const togglePlayPause = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (!vid.paused) {
      vid.pause();
      setIsPlaying(false);
      return;
    }

    await vid.play().catch(() => {});
    setIsPlaying(true);
  }, [setIsPlaying]);

  const handleScrubStart = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (!vid.paused) {
      vid.pause();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleScrubChange = useCallback(
    (value: number) => {
      setScrubValue(value);
    },
    [setScrubValue]
  );

  const handleScrubComplete = useCallback(
    async (value: number) => {
      setScrubValue(null);
      const vid = videoRef.current;
      if (!vid) return;

      if (isRenderedPreview) {
        vid.currentTime = value;
        setCurrentTime(value);
        return;
      }

      const { index, clip, localTime } = findClipAtProjectTime(value);

      if (clip.id !== selectedClipId) {
        setSelectedClipId(clip.id);
      }

      // wait for src swap then seek
      queueMicrotask(() => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = localTime;
        v.pause();
        setIsPlaying(false);
        setCurrentTime(value);
      });
    },
    [
      isRenderedPreview,
      findClipAtProjectTime,
      selectedClipId,
      setSelectedClipId,
      setScrubValue,
      setIsPlaying,
      setCurrentTime,
    ]
  );

  const replay = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isRenderedPreview) {
      vid.currentTime = 0;
      await vid.play().catch(() => {});
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    // live mode: go back to first clip
    await goToClipByIndex(0, true);
  }, [isRenderedPreview, goToClipByIndex, setCurrentTime, setIsPlaying]);

  return {
    videoRef,
    videoSourceUri,
    isRenderedPreview,
    setIsRenderedPreview,

    isPlaying,
    currentTime,
    duration: durationForScrubber,
    sliderMax,
    sliderValue,

    togglePlayPause,
    handleScrubStart,
    handleScrubChange,
    handleScrubComplete,

    orderedClips,
    selectedClip,
    selectedIndex,
    goToClipByIndex,

    activeTransition,

    replay,
  };
}