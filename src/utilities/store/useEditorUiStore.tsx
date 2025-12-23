// src/store/useEditorUiStore.ts
import { create } from 'zustand';
import type {
  Clip,
  MusicTrack,
  TransitionType,
  TextVariant,
  Overlay,
} from './useStudioStore';

type OverlaySize = { width: number; height: number };

export type ActiveTool =
  | 'timeline'
  | 'music'
  | 'text'
  | 'effects'
  | 'ml'
  | 'none'
  | 'ai'
  | 'export'
  | 'chat';

export type BusyReason = 'none' | 'uploading' | 'smart-edit' | 'export' | 'ml';

export type EditorUiState = {
  /** Which project is currently open in the editor */
  selectedProjectId?: string;

  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;

  /** Clips for the current editing session (usually derived from project.clips) */
  clips: Clip[];
  setClips: (clips: Clip[]) => void;

  /** Current selection */
  selectedClipId?: string;
  selectedOverlayId?: string | null;

  setSelectedProjectId: (id?: string) => void;
  setSelectedClipId: (id?: string) => void;
  setSelectedOverlayId: (id: string | null) => void;

  /** Busy state */
  busyReason: BusyReason;
  setBusyReason: (reason: BusyReason) => void;

  /** Playback state */
  isPlaying: boolean;
  currentTime: number;
  statusDuration: number;
  projectTime: number;
  projectDuration: number;
  activeTransition: TransitionType;

  setIsPlaying: (v: boolean) => void;
  setCurrentTime: (t: number) => void;
  setStatusDuration: (t: number) => void;
  setProjectTime: (t: number) => void;
  setProjectDuration: (t: number) => void;
  setActiveTransition: (t: TransitionType) => void;

  /** Rendered vs live preview */
  isRenderedPreview: boolean;
  setIsRenderedPreview: (v: boolean) => void;

  /** Scrubbing */
  scrubValue: number | null;
  setScrubValue: (v: number | null) => void;

  /** UI layout / view mode */
  trimVisible: boolean;
  isExpandedPreview: boolean;
  timelineWidth: number;

  setTrimVisible: (v: boolean) => void;
  setIsExpandedPreview: (v: boolean) => void;
  setTimelineWidth: (w: number) => void;

  /** Music picker UI */
  showMusicPicker: boolean;
  musicTracks: MusicTrack[];
  isLoadingMusic: boolean;

  setShowMusicPicker: (v: boolean) => void;
  setMusicTracks: (tracks: MusicTrack[]) => void;
  setIsLoadingMusic: (v: boolean) => void;

  /** Overlay text controls */
  overlayText: string;
  overlayStart: number;
  overlayEnd: number;
  overlayVariant: TextVariant;
  overlaySize: OverlaySize;

  setOverlayText: (text: string) => void;
  setOverlayStart: (t: number) => void;
  setOverlayEnd: (t: number) => void;
  setOverlayVariant: (variant: TextVariant) => void;
  setOverlaySize: (size: OverlaySize) => void;

  /** Exporting */
  isExporting: boolean;
  setIsExporting: (v: boolean) => void;

  /** 🔥 Edge-ML / ephemeral overlays (not persisted in project.overlays) */
  liveOverlays: Overlay[];
  setLiveOverlays: (ovs: Overlay[]) => void;
  addLiveOverlay: (ov: Overlay) => void;
  pruneLiveOverlays: (olderThan: number) => void;

  /** 🧠 ML toggles */
  enableLiveML: boolean;
  showEdgeAuras: boolean;
  showBBoxes: boolean;
  showLabels: boolean;
  showDepthOverlay: boolean;

  setEnableLiveML: (v: boolean) => void;
  setShowEdgeAuras: (v: boolean) => void;
  setShowBBoxes: (v: boolean) => void;
  setShowLabels: (v: boolean) => void;
  setShowDepthOverlay: (v: boolean) => void;
};

export const useEditorUiStore = create<EditorUiState>()((set) => ({
  selectedProjectId: undefined,

  clips: [],
  setClips: (clips) => set({ clips }),

  selectedClipId: undefined,
  selectedOverlayId: null,

  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setSelectedOverlayId: (selectedOverlayId) => set({ selectedOverlayId }),

  activeTool: 'timeline',
  setActiveTool: (activeTool) => set({ activeTool }),

  // ---- Playback ----
  isPlaying: false,
  currentTime: 0,
  statusDuration: 0,
  projectTime: 0,
  projectDuration: 0,
  activeTransition: 'none',

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setStatusDuration: (statusDuration) => set({ statusDuration }),
  setProjectTime: (projectTime) => set({ projectTime }),
  setProjectDuration: (projectDuration) => set({ projectDuration }),
  setActiveTransition: (activeTransition) => set({ activeTransition }),

  // ---- Busy state ----
  busyReason: 'none',
  setBusyReason: (busyReason) => set({ busyReason }),

  // ---- Rendered vs live ----
  isRenderedPreview: false,
  setIsRenderedPreview: (isRenderedPreview) => set({ isRenderedPreview }),

  // ---- Scrubbing ----
  scrubValue: null,
  setScrubValue: (scrubValue) => set({ scrubValue }),

  // ---- Layout ----
  trimVisible: false,
  isExpandedPreview: false,
  timelineWidth: 0,

  setTrimVisible: (trimVisible) => set({ trimVisible }),
  setIsExpandedPreview: (isExpandedPreview) => set({ isExpandedPreview }),
  setTimelineWidth: (timelineWidth) => set({ timelineWidth }),

  // ---- Music picker ----
  showMusicPicker: false,
  musicTracks: [],
  isLoadingMusic: false,

  setShowMusicPicker: (showMusicPicker) => set({ showMusicPicker }),
  setMusicTracks: (musicTracks) => set({ musicTracks }),
  setIsLoadingMusic: (isLoadingMusic) => set({ isLoadingMusic }),

  // ---- Overlay text ----
  overlayText: '',
  overlayStart: 0,
  overlayEnd: 3,
  overlayVariant: 'caption',
  overlaySize: { width: 0, height: 0 },

  setOverlayText: (overlayText) => set({ overlayText }),
  setOverlayStart: (overlayStart) => set({ overlayStart }),
  setOverlayEnd: (overlayEnd) => set({ overlayEnd }),
  setOverlayVariant: (overlayVariant) => set({ overlayVariant }),
  setOverlaySize: (overlaySize) => set({ overlaySize }),

  // ---- Export ----
  isExporting: false,
  setIsExporting: (isExporting) => set({ isExporting }),

  // 🔥 edge ML overlays
  liveOverlays: [],
  setLiveOverlays: (liveOverlays) => set({ liveOverlays }),
  addLiveOverlay: (ov) =>
    set((state) => ({ liveOverlays: [...state.liveOverlays, ov] })),
  pruneLiveOverlays: (olderThan) =>
    set((state) => ({
      liveOverlays: state.liveOverlays.filter(
        (o) => (o.end ?? o.start ?? 0) >= olderThan
      ),
    })),

  // 🧠 ML flags
  enableLiveML: false,
  showEdgeAuras: true,
  showBBoxes: false,
  showLabels: false,
  showDepthOverlay: false,

  setEnableLiveML: (enableLiveML) => set({ enableLiveML }),
  setShowEdgeAuras: (showEdgeAuras) => set({ showEdgeAuras }),
  setShowBBoxes: (showBBoxes) => set({ showBBoxes }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setShowDepthOverlay: (showDepthOverlay) => set({ showDepthOverlay }),
}));