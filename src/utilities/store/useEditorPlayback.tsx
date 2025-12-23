// // src/features/editor/hooks/useEditorPlayback.ts
// import { useEffect, useMemo, useRef, useCallback } from 'react';
// import { Video, AVPlaybackStatus } from 'expo-av';

// import type { Project, Clip } from '@/utilities/store/useStudioStore';
// import { useEditorUiStore } from '@/utilities/store/useEditorUiStore';

// // Helpers
// function getClipOffsets(clips: Clip[]) {
//   const ordered = clips.slice().sort((a, b) => a.order - b.order);
//   const result: { clip: Clip; offset: number; duration: number }[] = [];
//   let acc = 0;

//   for (const clip of ordered) {
//     const speed = clip.speed || 1;
//     const duration = (clip.end - clip.start) / speed;
//     result.push({ clip, offset: acc, duration });
//     acc += duration;
//   }

//   return result;
// }

// function findClipAtTime(clips: Clip[], projectTime: number) {
//   const offsets = getClipOffsets(clips);

//   for (const { clip, offset, duration } of offsets) {
//     const start = offset;
//     const end = offset + duration;

//     if (projectTime >= start && projectTime <= end) {
//       const delta = projectTime - start;
//       const speed = clip.speed || 1;
//       const clipTime = clip.start + delta * speed;
//       return { clip, clipTime };
//     }
//   }

//   return { clip: null as any, clipTime: 0 };
// }

// type UseEditorPlaybackArgs = {
//   project?: Project;
//   smartPreviewUrl?: string | null;
// };

// export function useEditorPlayback({ project, smartPreviewUrl }: UseEditorPlaybackArgs) {
//   const clips = project?.clips ?? [];

//   const videoRef = useRef<Video | null>(null);

//   const {
//     // state
//     selectedClipId,
//     isRenderedPreview,
//     isPlaying,
//     currentTime,
//     projectDuration,
//     scrubValue,

//     // setters
//     setSelectedClipId,
//     setIsPlaying,
//     setCurrentTime,
//     setProjectDuration,
//     setScrubValue,
//     setIsRenderedPreview,
//   } = useEditorUiStore();

//   // Keep clips sorted
//   const orderedClips = useMemo(
//     () => clips.slice().sort((a, b) => a.order - b.order),
//     [clips]
//   );

//   // Default selection
//   useEffect(() => {
//     if (!selectedClipId && orderedClips.length > 0) {
//       setSelectedClipId(orderedClips[0].id);
//     }
//   }, [orderedClips, selectedClipId, setSelectedClipId]);

//   // Compute project duration when clips change
//   useEffect(() => {
//     if (!orderedClips.length) {
//       setProjectDuration(0);
//       return;
//     }

//     const total = orderedClips.reduce((acc, clip) => {
//       const speed = clip.speed || 1;
//       const d = (clip.end - clip.start) / speed;
//       return acc + d;
//     }, 0);

//     setProjectDuration(total);
//   }, [orderedClips, setProjectDuration]);

//   const selectedClip =
//     orderedClips.find((c) => c.id === selectedClipId) ?? orderedClips[0];

//   // Decide which video source to show
//   const videoSourceUri =
//     isRenderedPreview && smartPreviewUrl
//       ? smartPreviewUrl
//       : selectedClip
//       ? selectedClip.localUri ?? selectedClip.uri
//       : undefined;

//   // Slider
//   const sliderMax = isRenderedPreview
//     ? // for rendered, treat duration as single file duration
//       projectDuration || 0
//     : projectDuration || 0;

//   const sliderValue = scrubValue ?? currentTime;

//   // ---- Playback status handler ----
//   const handlePlaybackStatusUpdate = useCallback(
//     (status: AVPlaybackStatus) => {
//       if (!status.isLoaded) return;

//       const rawT = (status.positionMillis ?? 0) / 1000;

//       // Rendered preview: single file, simple behavior
//       if (isRenderedPreview) {
//         setCurrentTime(rawT);
//         if (status.durationMillis != null) {
//           setProjectDuration(status.durationMillis / 1000);
//         }
//         if (status.didJustFinish) {
//           setIsPlaying(false);
//         }
//         return;
//       }

//       // Live multi-clip mode
//       if (!selectedClip) return;

//       const currentIndex = orderedClips.findIndex(
//         (c) => c.id === selectedClip.id
//       );
//       if (currentIndex === -1) return;

//       const offsets = getClipOffsets(orderedClips);
//       const { offset, duration } = offsets[currentIndex];

//       // rawT is time within the current clip's file
//       // we *assume* we always seek with clip.start, so rawT ~ clip-local time
//       const clip = selectedClip;
//       const speed = clip.speed || 1;
//       const clipLocal = Math.max(0, rawT - clip.start);
//       const clipSegment = (clip.end - clip.start) / speed || 0.0001;

//       const clampedLocal =
//         Math.max(0, Math.min(clipLocal / speed, clipSegment));

//       const globalTime = offset + clampedLocal;

//       setCurrentTime(globalTime);

//       // auto-advance near the end of this clip
//       const clipEndGlobal = offset + duration;
//       const nearEnd = globalTime >= clipEndGlobal - 0.05;

//       if (nearEnd) {
//         const nextIndex = currentIndex + 1;
//         if (nextIndex < orderedClips.length) {
//           const next = orderedClips[nextIndex];
//           setSelectedClipId(next.id);

//           videoRef.current?.setStatusAsync({
//             shouldPlay: true,
//             positionMillis: next.start * 1000,
//           });
//         } else {
//           setIsPlaying(false);
//         }
//       }

//       if (status.didJustFinish) {
//         const nextIndex = currentIndex + 1;
//         if (nextIndex < orderedClips.length) {
//           const next = orderedClips[nextIndex];
//           setSelectedClipId(next.id);
//           videoRef.current?.setStatusAsync({
//             shouldPlay: true,
//             positionMillis: next.start * 1000,
//           });
//         } else {
//           setIsPlaying(false);
//         }
//       }
//     },
//     [
//       isRenderedPreview,
//       orderedClips,
//       selectedClip,
//       setCurrentTime,
//       setProjectDuration,
//       setIsPlaying,
//       setSelectedClipId,
//     ]
//   );

//   // ---- Transport controls ----
//   const togglePlayPause = useCallback(async () => {
//     if (!videoRef.current) return;

//     const status = await videoRef.current.getStatusAsync();
//     if (!status.isLoaded) return;

//     if (status.isPlaying) {
//       await videoRef.current.pauseAsync();
//       setIsPlaying(false);
//     } else {
//       await videoRef.current.playAsync();
//       setIsPlaying(true);
//     }
//   }, [setIsPlaying]);

//   // ---- Scrubber handlers ----
//   const handleScrubStart = useCallback(async () => {
//     if (!videoRef.current) return;

//     const status = await videoRef.current.getStatusAsync();
//     if (status.isLoaded && status.isPlaying) {
//       await videoRef.current.pauseAsync();
//       setIsPlaying(false);
//     }
//   }, [setIsPlaying]);

//   const handleScrubChange = useCallback(
//     (value: number) => {
//       setScrubValue(value);
//     },
//     [setScrubValue]
//   );

//   const handleScrubComplete = useCallback(
//     async (value: number) => {
//       setScrubValue(null);
//       if (!videoRef.current) return;

//       if (isRenderedPreview) {
//         try {
//           await videoRef.current.setPositionAsync(value * 1000);
//           setCurrentTime(value);
//         } catch (e) {
//           console.warn('Failed to seek rendered preview', e);
//         }
//         return;
//       }

//       // live: projectTime -> clip + clipTime
//       const { clip, clipTime } = findClipAtTime(orderedClips, value);
//       if (!clip) return;

//       if (clip.id !== selectedClipId) {
//         setSelectedClipId(clip.id);
//       }

//       try {
//         await videoRef.current.setStatusAsync({
//           shouldPlay: false,
//           positionMillis: clipTime * 1000,
//         });
//         setCurrentTime(value);
//       } catch (e) {
//         console.warn('Failed to seek in live preview', e);
//       }
//     },
//     [
//       isRenderedPreview,
//       orderedClips,
//       selectedClipId,
//       setSelectedClipId,
//       setCurrentTime,
//       setScrubValue,
//     ]
//   );

//   // Expose everything the UI needs
//   return {
//     videoRef,
//     videoSourceUri,
//     orderedClips,
//     selectedClip,
//     isRenderedPreview,
//     setIsRenderedPreview,

//     // times
//     currentTime,
//     projectDuration,
//     sliderMax,
//     sliderValue,

//     // handlers
//     handlePlaybackStatusUpdate,
//     togglePlayPause,
//     handleScrubStart,
//     handleScrubChange,
//     handleScrubComplete,
//   };
// }


// src/utilities/store/useEditorPlayback.ts
import { useMemo, useRef, useCallback, useEffect } from 'react';
// import { Video, AVPlaybackStatus } from 'expo-av';
import type { Project, Clip } from '@store/useStudioStore';
import { useEditorUiStore } from '@store/useEditorUiStore';

// export function getClipThumbnailsFromCues(
//   project: ProjectWithMl
// ): ClipThumbnailInfo[] {
//   const cues = project.raw_timeline_cues ?? [];
//   if (!cues.length) return [];

//   const bestByClip = new Map<string, RawTimelineCue>();

//   for (const cue of cues) {
//     const existing = bestByClip.get(cue.clipId);
//     if (!existing || cue.score > existing.score) {
//       bestByClip.set(cue.clipId, cue);
//     }
//   }

//   const thumbnails: ClipThumbnailInfo[] = [];

//   for (const [clipId, cue] of bestByClip.entries()) {
//     thumbnails.push({
//       clipId,
//       projectTime: cue.projectTime,
//       frameUrl: frameFilenameToUrl(cue.frameFilename),
//       score: cue.score,
//     });
//   }

//   return thumbnails;
// }

type Args = {
  project?: Project;
  smartPreviewUrl?: string | null;
};

function clipDuration(c: Clip): number {
  const speed = c.speed || 1;
  return (c.end - c.start) / speed;
}

export function useEditorPlayback({ project, smartPreviewUrl }: Args) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    // selection
    selectedClipId,
    setSelectedClipId,

    // playback
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    projectDuration,
    setProjectDuration,

    // scrubber
    scrubValue,
    setScrubValue,

    // rendered vs live
    isRenderedPreview,
    setIsRenderedPreview,

    // transitions
    activeTransition,
    setActiveTransition,
  } = useEditorUiStore();

  const clips = project?.clips ?? [];

  const orderedClips = useMemo(
    () => clips.slice().sort((a, b) => a.order - b.order),
    [clips]
  );

  // total duration across all clips (timeline seconds)
  const totalDuration = useMemo(
    () => orderedClips.reduce((acc, c) => acc + clipDuration(c), 0),
    [orderedClips]
  );

  // init projectDuration from clips
  useEffect(() => {
    if (totalDuration > 0 && projectDuration !== totalDuration) {
      setProjectDuration(totalDuration);
    }
  }, [totalDuration, projectDuration, setProjectDuration]);

  // selected clip + index
  const selectedIndex = useMemo(() => {
    if (!orderedClips.length) return -1;
    if (!selectedClipId) return 0;
    return Math.max(
      0,
      orderedClips.findIndex((c) => c.id === selectedClipId)
    );
  }, [orderedClips, selectedClipId]);

  const selectedClip =
    selectedIndex >= 0 ? orderedClips[selectedIndex] : orderedClips[0];

  // default selection
  useEffect(() => {
    if (!selectedClipId && orderedClips.length > 0) {
      setSelectedClipId(orderedClips[0].id);
    }
  }, [orderedClips, selectedClipId, setSelectedClipId]);

  // which video URI to feed into <Video />
  const videoSourceUri =
    isRenderedPreview && smartPreviewUrl
      ? smartPreviewUrl
      : selectedClip
      ? selectedClip.localUri ?? selectedClip.uri
      : undefined;

  // for the scrubber in live vs rendered modes
  const durationForScrubber = isRenderedPreview
    ? projectDuration || 0
    : totalDuration || (selectedClip ? clipDuration(selectedClip) : 0);

  const sliderMax = durationForScrubber > 0 ? durationForScrubber : 1;
  const sliderValue = scrubValue ?? currentTime;

  /** Jump to a specific clip index, optionally auto-playing */
  const goToClipByIndex = useCallback(
    async (index: number, autoPlay: boolean) => {
      if (!orderedClips.length) return;
      const clamped = Math.min(Math.max(index, 0), orderedClips.length - 1);
      const target = orderedClips[clamped];

      setSelectedClipId(target.id);

      // local time within that clip
      const start = target.start ?? 0;

      // update currentTime to *project* time = sum of previous clips
      const timelineOffset = orderedClips
        .slice(0, clamped)
        .reduce((acc, c) => acc + clipDuration(c), 0);
      const newProjectTime = timelineOffset;

      setCurrentTime(newProjectTime);

      if (!videoRef.current) {
        setIsPlaying(autoPlay);
        return;
      }

      try {
        // for live mode, we position inside the clip
        if (!isRenderedPreview) {
          // @ts-ignore
          await videoRef.current.setStatusAsync({
            positionMillis: start * 1000,
            shouldPlay: autoPlay,
          });
        } else {
          // rendered preview: timeline in a single file
          // @ts-ignore
          await videoRef.current.setStatusAsync({
            positionMillis: newProjectTime * 1000,
            shouldPlay: autoPlay,
          });
        }
        setIsPlaying(autoPlay);
      } catch (e) {
        console.warn('Failed to goToClipByIndex', e);
      }
    },
    [
      orderedClips,
      isRenderedPreview,
      setSelectedClipId,
      setCurrentTime,
      setIsPlaying,
    ]
  );

  /** Auto-advance helper: do transition, then jump to next clip */
  const advanceToNextClip = useCallback(async () => {
    if (selectedIndex < 0 || selectedIndex >= orderedClips.length - 1) {
      // no more clips
      setIsPlaying(false);
      return;
    }

    const current = orderedClips[selectedIndex];
    const transition = current.transitionAfter || 'none';

    if (transition !== 'none') {
      setActiveTransition(transition);

      // tiny delay so Canvas can animate
      setTimeout(async () => {
        setActiveTransition('none');
        await goToClipByIndex(selectedIndex + 1, true);
      }, 160); // ~160ms feels snappy
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

  interface AVPlaybackStatus {
    [string: string]: any
  }
  /** Core playback status handler from <Video /> */
  const handlePlaybackStatusUpdate = useCallback(
    async (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      const t = (status.positionMillis ?? 0) / 1000;

      if (isRenderedPreview) {
        // single rendered file: just track project timeline
        setCurrentTime(t);
        if (status.durationMillis) {
          const d = status.durationMillis / 1000;
          if (d !== projectDuration) setProjectDuration(d);
        }
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
        return;
      }

      // live multi-clip mode
      const total = totalDuration || 0;
      if (total > 0 && t <= total + 1) {
        setCurrentTime(t);
      }

      // figure out local position within selected clip
      if (!selectedClip) return;

      const clipStart = selectedClip.start ?? 0;
      const dur = clipDuration(selectedClip);
      const clipEnd = clipStart + dur;

      // In our current preview, the <Video> is playing the clip file directly,
      // so status.positionMillis is roughly the time inside that clip
      const localTime = t;

      // if we reach the clip end, hop to next
      if (localTime >= clipEnd - 0.05) {
        if (status.isPlaying || status.didJustFinish) {
          await advanceToNextClip();
          return;
        }
      }

      if (status.didJustFinish) {
        await advanceToNextClip();
      }
    },
    [
      isRenderedPreview,
      setCurrentTime,
      projectDuration,
      setProjectDuration,
      setIsPlaying,
      totalDuration,
      selectedClip,
      advanceToNextClip,
    ]
  );

  /** Play / pause from UI */
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    // @ts-ignore
    const status = await videoRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      // @ts-ignore
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      // @ts-ignore
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [setIsPlaying]);

  /** Scrubber handlers */

  const handleScrubStart = useCallback(async () => {
    if (!videoRef.current) return;
    // @ts-ignore
    const status = await videoRef.current.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      // @ts-ignore
      await videoRef.current.pauseAsync();
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
      if (!videoRef.current) return;

      try {
        if (isRenderedPreview) {
          // @ts-ignore
          await videoRef.current.setPositionAsync(value * 1000);
          setCurrentTime(value);
          return;
        }

        // live multi-clip: move in project timeline
        // find which clip this time hits
        let acc = 0;
        let targetIndex = 0;
        for (let i = 0; i < orderedClips.length; i++) {
          const d = clipDuration(orderedClips[i]);
          if (value < acc + d) {
            targetIndex = i;
            break;
          }
          acc += d;
        }

        await goToClipByIndex(targetIndex, false);
        setCurrentTime(value);
      } catch (e) {
        console.warn('Failed to seek', e);
      }
    },
    [
      isRenderedPreview,
      orderedClips,
      goToClipByIndex,
      setScrubValue,
      setCurrentTime,
    ]
  );

  const replay = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      // @ts-ignore
      await videoRef.current.setPositionAsync(0);
      // @ts-ignore
      await videoRef.current.playAsync();
      setCurrentTime(0);
      setIsPlaying(true);
    } catch (e) {
      console.warn('Failed to replay', e);
    }
}, [setCurrentTime, setIsPlaying]);

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

    handlePlaybackStatusUpdate,
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