/**
 * History Store - Manages undo/redo functionality using command pattern
 */

import { create } from 'zustand';
import { HistoryCommand, HistoryState } from '../types/history';

const MAX_STACK_SIZE = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxStackSize: MAX_STACK_SIZE,
  currentIndex: -1,

  addCommand: (command: HistoryCommand) => {
    const state = get();
    
    // Don't execute the command - it's already been applied
    // We're just storing it for undo/redo
    
    // Add to undo stack
    let newUndoStack = [...state.undoStack, command];
    
    // Limit stack size - remove oldest if exceeds max
    if (newUndoStack.length > state.maxStackSize) {
      newUndoStack = newUndoStack.slice(1);
    }
    
    // Clear redo stack when new command is added
    set({
      undoStack: newUndoStack,
      redoStack: [],
      currentIndex: newUndoStack.length - 1,
    });
    
    console.log('📚 Command added to history:', {
      type: command.type,
      description: command.description,
      undoStackSize: newUndoStack.length,
    });
  },

  undo: () => {
    const state = get();
    
    if (state.undoStack.length === 0) {
      console.warn('⚠️ Nothing to undo');
      return;
    }
    
    // Get the last command from undo stack
    const command = state.undoStack[state.undoStack.length - 1];
    
    // Execute undo
    command.undo();
    
    // Move command from undo to redo stack
    const newUndoStack = state.undoStack.slice(0, -1);
    const newRedoStack = [...state.redoStack, command];
    
    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      currentIndex: newUndoStack.length - 1,
    });
    
    console.log('↩️ Undo executed:', {
      type: command.type,
      description: command.description,
      undoStackSize: newUndoStack.length,
      redoStackSize: newRedoStack.length,
    });
  },

  redo: () => {
    const state = get();
    
    if (state.redoStack.length === 0) {
      console.warn('⚠️ Nothing to redo');
      return;
    }
    
    // Get the last command from redo stack
    const command = state.redoStack[state.redoStack.length - 1];
    
    // Execute redo
    command.redo();
    
    // Move command from redo to undo stack
    const newRedoStack = state.redoStack.slice(0, -1);
    const newUndoStack = [...state.undoStack, command];
    
    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      currentIndex: newUndoStack.length - 1,
    });
    
    console.log('↪️ Redo executed:', {
      type: command.type,
      description: command.description,
      undoStackSize: newUndoStack.length,
      redoStackSize: newRedoStack.length,
    });
  },

  canUndo: () => {
    return get().undoStack.length > 0;
  },

  canRedo: () => {
    return get().redoStack.length > 0;
  },

  clearHistory: () => {
    set({
      undoStack: [],
      redoStack: [],
      currentIndex: -1,
    });
    console.log('🗑️ History cleared');
  },

  getHistory: () => {
    return get().undoStack;
  },
}));
