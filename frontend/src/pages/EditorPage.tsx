/**
 * EditorPage - Main editor with chat and preview
 */

import { ChatInterface } from '../components/chat/ChatInterface';
import { LivePreview } from '../components/editor/LivePreview';
import { CachedResponsesPanel } from '../components/chat/CachedResponsesPanel';
import { CodeViewer } from '../components/editor/CodeViewer';

export function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">HTML Prototype Builder</h1>
            <span className="text-sm text-muted-foreground">Lovable.dev Clone</span>
          </div>
          <div className="flex items-center gap-2">
            {/* TODO: Add project name, save button, export button */}
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Interface */}
        <div className="w-1/2 border-r">
          <ChatInterface />
        </div>

        {/* Right: Live Preview */}
        <div className="w-1/2">
          <LivePreview />
        </div>
      </div>

      {/* Cached Responses Panel */}
      <CachedResponsesPanel />

      {/* Code Viewer */}
      <CodeViewer />
    </div>
  );
}

