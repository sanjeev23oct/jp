/**
 * Mode Store - Manages application mode (Prototype vs BA)
 */

import { create } from 'zustand';

export type AppMode = 'prototype' | 'ba';

interface ModeState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

// Load mode from localStorage
const loadMode = (): AppMode => {
  if (typeof window === 'undefined') return 'prototype';
  const saved = localStorage.getItem('app_mode');
  return (saved === 'ba' ? 'ba' : 'prototype') as AppMode;
};

// Save mode to localStorage
const saveMode = (mode: AppMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_mode', mode);
  }
};

export const useModeStore = create<ModeState>((set) => ({
  mode: loadMode(),

  setMode: (mode) => {
    saveMode(mode);
    set({ mode });
    console.log(`🔄 Mode switched to: ${mode}`);
  },

  toggleMode: () => {
    set((state) => {
      const newMode = state.mode === 'prototype' ? 'ba' : 'prototype';
      saveMode(newMode);
      console.log(`🔄 Mode toggled to: ${newMode}`);
      return { mode: newMode };
    });
  },
}));
