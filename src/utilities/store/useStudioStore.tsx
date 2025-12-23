// ** ============== V2 ================== ** //
// src/store/useStudioStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// import AsyncStorage from '@react-native-async-storage/async-storage';

/** ==== Core enums / shared types ==== */

export type TransitionType = 'none' | 'crossfade' | 'zoom' | 'slide' | 'glitch';

export type FilterType = 'none' | 'warm' | 'cool' | 'bw' | 'vibrant';

export type TextVariant = 'title' | 'subtitle' | 'caption' | 'emoji';

export type OverlayType = 'text' | 'sticker' | 'effect' | 'sfx';

export type CanvasBackgroundType =
  | 'none'
  | 'black'
  | 'white'
  | 'blur'
  | 'gradient'
  | 'image';

export type ClipEffect = {
  speed?: number; // 0.25–2.0 (legacy convenience)
  filter?: FilterType;
  transitionAfter?: TransitionType;
};

export type CaptionSegment = {
  start: number;
  end: number;
  text: string;
};

export type CaptionTrack = {
  id: string;
  language: string;
  segments: CaptionSegment[];
};

/** ==== Timeline entities ==== */

export type Clip = {
  id: string;
  uri: string;
  localUri: string;
  remoteUri: string;
  start: number; // in seconds (source video space)
  end: number; // in seconds (source video space)
  order: number;

  label?: string;

  // visual + temporal
  transitionAfter?: TransitionType;
  filter?: FilterType;
  speed?: number; // 0.25–2.0
  volume?: number; // 0–1 (per-clip volume, optional)
  muted?: boolean;
  rotation?: number; // degrees
  // room for future crop metadata etc.
  effect?: ClipEffect; // optional aggregated settings
};

export type Overlay = {
  id: string;
  type: OverlayType;

  // shared timing (project timeline seconds)
  start: number;
  end: number;

  // normalized position for visual overlays (0–1, 0 = left/top)
  x?: number;
  y?: number;

  /** ==== Text overlays ==== */
  text?: string;
  variant?: TextVariant;
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | '600' | '700' | '800';
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  shadowColor?: string;
  shadowRadius?: number;

  /** ==== Sticker / effect overlays ==== */
  // sticker or effect image
  uri?: string; // sticker / effect image
  stickerId?: string; // ID from your sticker API
  effectId?: string; // ID from your local effects library
  width?: number; // px in preview
  height?: number; // px in preview
  rotation?: number;
  opacity?: number; // 0–1
  scale?: number;

  /** ==== SFX events ==== */
  sfxId?: string; // ID of a short sound effect in your library
  sfxVolume?: number; // 0–1
};

/** ==== Music / audio ==== */

export type MusicTrack = {
  id: string;
  title: string;
  artist?: string;
  duration?: number; // seconds
  previewUrl: string; // URL to stream
  coverUrl?: string;
  source?: string; // e.g. 'freesound', 'openstudio'
};

export type ProjectMusic = {
  id: string; // match MusicTrack.id if from a catalog
  title: string;
  artist?: string;
  uri: string; // streamable URL
  volume: number; // 0–1
  offset: number; // start time in project timeline (seconds)
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
  beats?: number[]; // beat times in seconds from music start
};

//** ==== FX/SFX ==== */
export type SpeedSegment = {
  id: string;
  start: number;   // project time (seconds)
  end: number;     // project time (seconds)
  factor: number;  // e.g. 0.25, 0.5, 1, 2
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'; // optional
};

export type CameraKeyframe = {
  id: string;
  time: number;      // project time (seconds)
  zoom: number;      // 1 = no zoom, 2 = 2x zoom, etc
  focusX: number;    // 0–1 normalized, where in frame horizontally
  focusY: number;    // 0–1 normalized, where in frame vertically
};

/** ==== Project ==== */

export type ProjectBackground = {
  type: CanvasBackgroundType;
  color?: string; // for solid / gradient start
  color2?: string; // gradient end
  imageUri?: string; // if using a background image
};

export type ProjectCoverFrame = {
  clipId: string;
  time: number; // seconds within that clip or project timeline (your choice)
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  clips: Clip[];
  overlays: Overlay[];
  captionTracks?: CaptionTrack[];

  music?: ProjectMusic;

  background?: ProjectBackground;
  coverFrame?: ProjectCoverFrame;

  speedSegments?: SpeedSegment[];
  cameraKeyframes?: CameraKeyframe[];
};

/** ==== Store ==== */

type StudioState = {
  projects: Project[];
  createProject: (name?: string) => Project;
  updateProject: (id: string, updater: (p: Project) => Project) => void;
  deleteProject: (id: string) => void;
};

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      projects: [],

      createProject: (name) => {
        const id = `proj-${Date.now()}`;
        const now = new Date().toISOString();
        const project: Project = {
          id,
          name: name || `Project ${get().projects.length + 1}`,
          createdAt: now,
          updatedAt: now,
          clips: [],
          overlays: [],
          captionTracks: [],
        };
        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },

      updateProject: (id, updater) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...updater(p), updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },
    }),
    {
      name: 'studio-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);