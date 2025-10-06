/**
 * Command Classes - Implementations of the command pattern for undo/redo
 */

import { HistoryCommand, CommandType, CodeSnapshot } from '../types/history';
import { useEditorStore } from '../store/useEditorStore';

/**
 * Helper function to create a snapshot of current editor state
 */
export function createSnapshot(): CodeSnapshot {
  const editorState = useEditorStore.getState();
  return {
    html: editorState.currentCode.html,
    css: editorState.currentCode.css,
    js: editorState.currentCode.js,
    selectedElement: editorState.selectedElement,
    viewport: editorState.viewport,
  };
}

/**
 * Helper function to apply a snapshot to editor state
 */
export function applySnapshot(snapshot: CodeSnapshot): void {
  const editorStore = useEditorStore.getState();
  editorStore.setCode({
    html: snapshot.html,
    css: snapshot.css,
    js: snapshot.js,
  });
  editorStore.setSelectedElement(snapshot.selectedElement);
  editorStore.setViewport(snapshot.viewport);
}

/**
 * Visual Edit Command - Tracks visual editor changes
 */
export class VisualEditCommand implements HistoryCommand {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  
  private beforeSnapshot: CodeSnapshot;
  private afterSnapshot: CodeSnapshot;

  constructor(
    beforeSnapshot: CodeSnapshot,
    afterSnapshot: CodeSnapshot,
    description: string
  ) {
    this.id = crypto.randomUUID();
    this.type = CommandType.VISUAL_EDIT;
    this.timestamp = Date.now();
    this.description = description;
    this.beforeSnapshot = beforeSnapshot;
    this.afterSnapshot = afterSnapshot;
  }

  execute(): void {
    applySnapshot(this.afterSnapshot);
  }

  undo(): void {
    applySnapshot(this.beforeSnapshot);
  }

  redo(): void {
    this.execute();
  }
}

/**
 * Surgical Edit Command - Tracks surgical edit changes
 */
export class SurgicalEditCommand implements HistoryCommand {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  
  private fileType: 'html' | 'css' | 'js';
  private beforeContent: string;
  private afterContent: string;

  constructor(
    fileType: 'html' | 'css' | 'js',
    beforeContent: string,
    afterContent: string,
    description: string
  ) {
    this.id = crypto.randomUUID();
    this.type = CommandType.SURGICAL_EDIT;
    this.timestamp = Date.now();
    this.description = description;
    this.fileType = fileType;
    this.beforeContent = beforeContent;
    this.afterContent = afterContent;
  }

  execute(): void {
    this.updateCode(this.afterContent);
  }

  undo(): void {
    this.updateCode(this.beforeContent);
  }

  redo(): void {
    this.execute();
  }

  private updateCode(content: string): void {
    const editorStore = useEditorStore.getState();
    switch (this.fileType) {
      case 'html':
        editorStore.updateHtml(content);
        break;
      case 'css':
        editorStore.updateCss(content);
        break;
      case 'js':
        editorStore.updateJs(content);
        break;
    }
  }
}

/**
 * Agent Generation Command - Tracks AI-generated code
 */
export class AgentGenerationCommand implements HistoryCommand {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  
  private beforeSnapshot: CodeSnapshot;
  private afterSnapshot: CodeSnapshot;

  constructor(
    beforeSnapshot: CodeSnapshot,
    afterSnapshot: CodeSnapshot,
    prompt: string
  ) {
    this.id = crypto.randomUUID();
    this.type = CommandType.AGENT_GENERATION;
    this.timestamp = Date.now();
    this.description = `Generated: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`;
    this.beforeSnapshot = beforeSnapshot;
    this.afterSnapshot = afterSnapshot;
  }

  execute(): void {
    applySnapshot(this.afterSnapshot);
  }

  undo(): void {
    applySnapshot(this.beforeSnapshot);
  }

  redo(): void {
    this.execute();
  }
}

/**
 * Component Insertion Command - Tracks component additions
 */
export class ComponentInsertionCommand implements HistoryCommand {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  
  private beforeSnapshot: CodeSnapshot;
  private afterSnapshot: CodeSnapshot;

  constructor(
    beforeSnapshot: CodeSnapshot,
    afterSnapshot: CodeSnapshot,
    componentName: string
  ) {
    this.id = crypto.randomUUID();
    this.type = CommandType.COMPONENT_ADD;
    this.timestamp = Date.now();
    this.description = `Added component: ${componentName}`;
    this.beforeSnapshot = beforeSnapshot;
    this.afterSnapshot = afterSnapshot;
  }

  execute(): void {
    applySnapshot(this.afterSnapshot);
  }

  undo(): void {
    applySnapshot(this.beforeSnapshot);
  }

  redo(): void {
    this.execute();
  }
}
