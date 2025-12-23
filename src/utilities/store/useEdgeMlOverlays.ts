// // src/ml/useEdgeMlOverlays.ts
// import { useEffect, useRef } from 'react';
// import { useEditorUiStore } from '@/utilities/store/useEditorUiStore';
// import type { Project, Overlay } from '@/utilities/store/useStudioStore';
// // import { useTf } from './TfProvider'; // 👈 use this later when you plug real TF in

import { Project } from "./useStudioStore";

// type UseEdgeMlOverlaysArgs = {
//   project: Project | undefined;
//   playback: {
//     currentTime: number;
//     videoSourceUri?: string | null;
//     isRenderedPreview?: boolean;
//   };
// };

// /**
//  * Edge-ML overlay generator.
//  * For now: generates fake player-aura FX around the frame as you play.
//  * Later: swap the random generator with real tfjs inference.
//  */
// export function useEdgeMlOverlays({ project, playback }: UseEdgeMlOverlaysArgs) {
//   const { currentTime, videoSourceUri } = playback;
//   const { addLiveOverlay, pruneLiveOverlays } = useEditorUiStore((s) => ({
//     addLiveOverlay: s.addLiveOverlay,
//     pruneLiveOverlays: s.pruneLiveOverlays,
//   }));

//   // Throttle so we don't fire on *every* frame
//   const lastBucketRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (!project) return;
//     if (!videoSourceUri) return;
//     if (!Number.isFinite(currentTime) || currentTime <= 0) return;

//     // 0.25s buckets
//     const bucket = Math.floor(currentTime * 4);
//     if (lastBucketRef.current === bucket) return;
//     lastBucketRef.current = bucket;

//     // Only generate something every N buckets (e.g. ~ once per second)
//     if (bucket % 4 !== 0) {
//       // still prune old overlays regularly
//       pruneLiveOverlays(currentTime - 2);
//       return;
//     }

//     // 🔮 Fake "detection" – later replace this with tfjs results
//     const x = 0.25 + Math.random() * 0.5; // keep roughly in center-ish
//     const y = 0.25 + Math.random() * 0.5;
//     const duration = 0.8;
//     const start = currentTime;
//     const end = currentTime + duration;

//     const overlay: Overlay = {
//       id: `edge-fx-${Date.now()}`,
//       type: 'effect' as any,
//       effectId: 'player-aura',
//       start,
//       end,
//       x,
//       y,
//       scale: 1.3,
//       opacity: 1,
//     } as any;

//     addLiveOverlay(overlay);
//     pruneLiveOverlays(currentTime - 2); // keep last ~2s of live FX
//   }, [project, currentTime, videoSourceUri, addLiveOverlay, pruneLiveOverlays]);
// }
// Raw from backend
export interface RawTimelineCue {
  clipId: string;
  projectTime: number;
  clipTime: number;
  frameFilename: string;  // e.g. "frame_clip-123_22063.jpg"
  score: number;
  kind: string;
  anchor?: { x: number; y: number };   // normalized 0–1
  objectType?: 'ball' | 'player';
  playerJersey?: number | null;
  players?: Array<{
    bbox: [number, number, number, number]; // [x, y, w, h] in pixels
    class: string;
    score: number;
  }>;
  analysis?: any; // whatever your VISION service returns
}

export interface RawHighlight {
  clipId: string;
  projectTime: number;
  score: number;
  kind: string;
  anchor?: { x: number; y: number };
  objectType?: 'ball' | 'player';
  playerJersey?: number | null;
  players?: RawTimelineCue['players'];
  analysis?: any;
}

// What your API returns for a project:
export interface ProjectWithMl extends Project {
  raw_highlights?: RawHighlight[];
  timelineCues?: RawTimelineCue[];
}
// const DEFAULT_ML_TOLERANCE = 0.25; // seconds
const DEFAULT_ML_TOLERANCE = 1.75; // seconds

export function findCuesNearTime(
  cues: RawTimelineCue[] | undefined,
  projectTime: number,
  tolerance: number = DEFAULT_ML_TOLERANCE
): RawTimelineCue[] {
  if (!cues || !cues.length) return [];
  return cues.filter(
    c => Math.abs(c.projectTime - projectTime) <= tolerance
  );
}

export function normalizeBbox(
  bbox: [number, number, number, number],
  videoWidth: number,
  videoHeight: number
): [number, number, number, number] {
  const [x, y, w, h] = bbox;
  return [
    x / videoWidth,
    y / videoHeight,
    w / videoWidth,
    h / videoHeight,
  ];
}

import { useMemo } from 'react';

interface UseMlOverlaysParams {
  project: ProjectWithMl | null;
  currentTime: number;      // seconds on project timeline
  videoWidth: number;
  videoHeight: number;
  tolerance?: number;       // how far from currentTime we consider a cue
}
// What the overlay system consumes for the *current* frame
export interface MlOverlayState {
  projectTime: number;

  // main focus / anchor
  anchor?: { x: number; y: number };
  objectType?: 'ball' | 'player';
  playerJersey?: number | null;

  // detections
  players: Array<{
    bboxNorm: [number, number, number, number]; // normalized to [0–1] using video dimensions
    class: string;
    score: number;
  }>;

  // labels / tags
  tags: string[];  // e.g. ["volleyball", "highlight"]

  // debug / metadata
  rawCue: RawTimelineCue | null;
}

// For editor timeline thumbnails
export interface ClipThumbnailInfo {
  clipId: string;
  projectTime: number;     // where this thumbnail comes from, on project timeline
  frameUrl: string;        // URL to /frames path
  score: number;
}
export function useMlOverlays({
  project,
  currentTime,
  videoWidth,
  videoHeight,
  tolerance = DEFAULT_ML_TOLERANCE,
}: UseMlOverlaysParams): MlOverlayState | null {
  return useMemo(() => {
    console.log("useMlOverlays.project: ", project, currentTime)
    if (!project || !project.timelineCues?.length) return null;

    const nearby = findCuesNearTime(project.timelineCues, currentTime, tolerance);
    if (!nearby.length) return null;

    // Pick the highest-score cue
    const best = nearby.reduce((acc, c) => (c.score > acc.score ? c : acc), nearby[0]);

    // Extract tags from labels if present
    const tags: string[] =
      best.analysis?.labels?.map((l: { className: string }) => l.className) ?? [];

    const playersNormalized =
      best.players?.map(p => ({
        bboxNorm: normalizeBbox(p.bbox, videoWidth, videoHeight),
        class: p.class,
        score: p.score,
      })) ?? [];

    const overlay: MlOverlayState = {
      projectTime: currentTime,
      anchor: best.anchor,
      objectType: best.objectType,
      playerJersey: best.playerJersey ?? null,
      players: playersNormalized,
      tags,
      rawCue: best,
    };

    return overlay;
  }, [project, currentTime, videoWidth, videoHeight, tolerance]);
}