/**
 * Project Store - Manages projects and auto-save functionality
 */

import { create } from 'zustand';
import { useEditorStore } from './useEditorStore';

export type ProjectType = 'prototype' | 'requirements';

interface Project {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  
  // Prototype fields
  html: string;
  css: string;
  js: string;
  
  // Requirements field
  requirements?: string;
  
  thumbnail?: string;
  template?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  last_opened_at?: Date;
}

interface ProjectState {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    type?: ProjectType;
    html?: string;
    css?: string;
    js?: string;
    template?: string;
    tags?: string[];
  }) => Promise<Project>;
  openProject: (id: string) => Promise<void>;
  saveProject: (updates?: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
  searchProjects: (query: string) => Promise<void>;
  
  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => void;
}

const API_BASE = 'http://localhost:3001/api';

// Auto-save debounce timer
let autoSaveTimer: NodeJS.Timeout | null = null;
let autoSaveEnabled = false;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Retry helper for failed requests
 */
async function retryRequest<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  error: null,

  /**
   * Load all projects from backend
   */
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/projects`);
      if (!response.ok) throw new Error('Failed to load projects');
      
      const data = await response.json();
      set({ 
        projects: data.projects,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load projects',
        isLoading: false 
      });
    }
  },

  /**
   * Create new project
   */
  createProject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🚀 Creating project:', data);
      console.log('📡 API URL:', `${API_BASE}/projects`);
      
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Failed to create project: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Project created:', result);
      const project = result.project;
      
      set(state => ({
        projects: [project, ...state.projects],
        currentProject: project,
        isLoading: false
      }));
      
      // Update editor store
      useEditorStore.getState().setCode({
        html: project.html || '',
        css: project.css || '',
        js: project.js || ''
      });
      
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Open existing project
   */
  openProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`);
      if (!response.ok) throw new Error('Failed to open project');
      
      const data = await response.json();
      const project = data.project;
      
      set({ 
        currentProject: project,
        isLoading: false,
        lastSaved: new Date(project.updated_at)
      });
      
      // Update editor store
      useEditorStore.getState().setCode({
        html: project.html || '',
        css: project.css || '',
        js: project.js || ''
      });
      
    } catch (error) {
      console.error('Failed to open project:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to open project',
        isLoading: false 
      });
    }
  },

  /**
   * Save current project with retry logic
   */
  saveProject: async (updates?: Partial<Project>) => {
    const { currentProject } = get();
    if (!currentProject) return;
    
    set({ isSaving: true, error: null });
    try {
      // Get current code from editor
      const editorCode = useEditorStore.getState().currentCode;
      
      const updateData = {
        ...updates,
        html: updates?.html ?? editorCode.html,
        css: updates?.css ?? editorCode.css,
        js: updates?.js ?? editorCode.js
      };
      
      // Use retry logic for save operation
      const data = await retryRequest(async () => {
        const response = await fetch(`${API_BASE}/projects/${currentProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Failed to save project');
        return response.json();
      });
      
      const updatedProject = data.project;
      
      set(state => ({
        currentProject: updatedProject,
        projects: state.projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        ),
        isSaving: false,
        lastSaved: new Date(),
        error: null
      }));
      
    } catch (error) {
      console.error('Failed to save project after retries:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save project',
        isSaving: false 
      });
    }
  },

  /**
   * Delete project
   */
  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete project');
      
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Failed to delete project:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete project',
        isLoading: false 
      });
    }
  },

  /**
   * Duplicate project
   */
  duplicateProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/projects/${id}/duplicate`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to duplicate project');
      
      const data = await response.json();
      const duplicate = data.project;
      
      set(state => ({
        projects: [duplicate, ...state.projects],
        isLoading: false
      }));
      
      return duplicate;
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to duplicate project',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Search projects
   */
  searchProjects: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/projects?search=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search projects');
      
      const data = await response.json();
      set({ 
        projects: data.projects,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to search projects:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search projects',
        isLoading: false 
      });
    }
  },

  /**
   * Enable auto-save (2 second debounce)
   */
  enableAutoSave: () => {
    autoSaveEnabled = true;
    console.log('✅ Auto-save enabled');
  },

  /**
   * Disable auto-save
   */
  disableAutoSave: () => {
    autoSaveEnabled = false;
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    console.log('❌ Auto-save disabled');
  },

  /**
   * Trigger auto-save with debounce
   */
  triggerAutoSave: () => {
    if (!autoSaveEnabled) return;
    
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set new timer (2 second debounce)
    autoSaveTimer = setTimeout(() => {
      const { currentProject, saveProject } = get();
      if (currentProject) {
        console.log('💾 Auto-saving project...');
        saveProject();
      }
    }, 2000);
  }
}));
