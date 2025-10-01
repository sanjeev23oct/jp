/**
 * Editor Store - Manages editor state and current code
 */

import { create } from 'zustand';

interface EditorState {
  currentCode: {
    html: string;
    css: string;
    js: string;
  };
  selectedElement: string | null;
  viewport: 'mobile' | 'tablet' | 'desktop';
  
  // Actions
  setCode: (code: { html: string; css: string; js: string }) => void;
  updateHtml: (html: string) => void;
  updateCss: (css: string) => void;
  updateJs: (js: string) => void;
  setSelectedElement: (element: string | null) => void;
  setViewport: (viewport: 'mobile' | 'tablet' | 'desktop') => void;
  clearCode: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentCode: {
    html: '',
    css: '',
    js: '',
  },
  selectedElement: null,
  viewport: 'desktop',

  setCode: (code) => {
    console.log('🎨 Setting code in editor store:', {
      htmlLength: code.html?.length || 0,
      cssLength: code.css?.length || 0,
      jsLength: code.js?.length || 0
    });
    set({ currentCode: code });
    // Expose to window for testing
    if (typeof window !== 'undefined') {
      (window as any).__EDITOR_STATE__ = get();
    }
  },

  updateHtml: (html) => {
    set(state => ({
      currentCode: { ...state.currentCode, html }
    }));
    if (typeof window !== 'undefined') {
      (window as any).__EDITOR_STATE__ = get();
    }
  },

  updateCss: (css) => {
    set(state => ({
      currentCode: { ...state.currentCode, css }
    }));
    if (typeof window !== 'undefined') {
      (window as any).__EDITOR_STATE__ = get();
    }
  },

  updateJs: (js) => {
    set(state => ({
      currentCode: { ...state.currentCode, js }
    }));
    if (typeof window !== 'undefined') {
      (window as any).__EDITOR_STATE__ = get();
    }
  },

  setSelectedElement: (element) => set({ selectedElement: element }),

  setViewport: (viewport) => set({ viewport }),

  clearCode: () => set({
    currentCode: { html: '', css: '', js: '' },
    selectedElement: null,
  }),
}));

