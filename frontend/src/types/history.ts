/**
 * History Types - Command pattern for undo/redo functionality
 */

export interface CodeSnapshot {
  html: string;
  css: string;
  js: string;
  selectedElement: string | null;
  viewport: 'mobile' | 'tablet' | 'desktop';
}

export enum CommandType {
  VISUAL_EDIT = 'visual-edit',
  SURGICAL_EDIT = 'surgical-edit',
  AGENT_GENERATION = 'agent-generation',
  COMPONENT_ADD = 'component-add',
  COMPONENT_DELETE = 'component-delete',
}

export interface HistoryCommand {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  execute: () => void;
  undo: () => void;
  redo: () => void;
}

export interface HistoryState {
  undoStack: HistoryCommand[];
  redoStack: HistoryCommand[];
  maxStackSize: number;
  currentIndex: number;
  
  // Actions
  addCommand: (command: HistoryCommand) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getHistory: () => HistoryCommand[];
}
