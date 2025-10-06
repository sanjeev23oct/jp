/**
 * Diff Types - Types for diff algorithm and viewer
 */

export enum DiffChangeType {
  ADD = 'add',
  REMOVE = 'remove',
  UNCHANGED = 'unchanged',
}

export interface DiffChange {
  type: DiffChangeType;
  lineNumber: number;
  content: string;
  highlighted?: boolean;
}

export interface DiffResult {
  fileType: 'html' | 'css' | 'js';
  changes: DiffChange[];
  stats: DiffStats;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
}

export interface DiffViewerProps {
  before: string;
  after: string;
  fileType: 'html' | 'css' | 'js';
  viewMode?: 'side-by-side' | 'inline';
  onApply?: () => void;
  onCancel?: () => void;
}
