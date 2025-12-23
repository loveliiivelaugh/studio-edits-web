// src/utilities/store/useAppMode.ts
import { create } from 'zustand';
import { useSupabaseStore } from './supabaseStore';

type Mode = 'local' | 'cloud';

type AppModeState = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

export const useAppMode = create<AppModeState>((set) => ({
  mode: 'local',
  setMode: (m) => set({ mode: m }),
}));

// Helper: call whenever session changes
export function deriveModeFromSession(session: any, preferCloud = true): Mode {
  return session && preferCloud ? 'cloud' : 'local';
}