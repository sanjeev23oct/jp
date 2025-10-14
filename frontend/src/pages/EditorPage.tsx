/**
 * EditorPage - Main editor with chat and preview
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatInterface } from '../components/chat/ChatInterface';
import { LivePreview } from '../components/editor/LivePreview';
import { CachedResponsesPanel } from '../components/chat/CachedResponsesPanel';
import { CodeViewer } from '../components/editor/CodeViewer';
import { SaveIndicator } from '../components/SaveIndicator';
import { ModeSwitch } from '../components/ModeSwitch';
import { BAView } from '../components/ba/BAView';
import { useAutoSave } from '../hooks/useAutoSave';
import { useProjectStore } from '../store/useProjectStore';
import { useModeStore } from '../store/useModeStore';
import { ArrowLeft, Loader } from 'lucide-react';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, openProject, isLoading, saveProject } = useProjectStore();
  const { mode } = useModeStore();
  
  // Enable auto-save for this page
  useAutoSave();
  
  // Load project on mount
  useEffect(() => {
    if (id) {
      openProject(id);
    }
  }, [id, openProject]);
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }
  
  if (!currentProject && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Project not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to projects"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <input
                type="text"
                value={currentProject?.name || 'Untitled'}
                onChange={(e) => {
                  if (currentProject) {
                    saveProject({ name: e.target.value });
                  }
                }}
                className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Project name"
              />
              {currentProject?.description && (
                <p className="text-sm text-muted-foreground px-2">{currentProject.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SaveIndicator />
            <ModeSwitch />
            {/* TODO: Add export button */}
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {mode === 'prototype' ? (
          <>
            {/* Prototype Mode: Chat + Preview */}
            <div className="w-1/2 border-r">
              <ChatInterface />
            </div>
            <div className="w-1/2">
              <LivePreview />
            </div>
          </>
        ) : (
          <>
            {/* BA Mode: Chat + Requirements Editor */}
            <div className="w-2/5 border-r">
              <ChatInterface />
            </div>
            <div className="flex-1">
              <BAView />
            </div>
          </>
        )}
      </div>

      {/* Cached Responses Panel */}
      <CachedResponsesPanel />

      {/* Code Viewer */}
      <CodeViewer />
    </div>
  );
}

