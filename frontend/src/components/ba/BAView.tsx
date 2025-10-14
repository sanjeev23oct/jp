/**
 * BAView - Business Analyst mode interface
 */

import React from 'react';
import { RequirementsEditor } from './RequirementsEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { EARSTemplatesPanel } from './EARSTemplatesPanel';
import { ExportButton } from './ExportButton';

export const BAView: React.FC = () => {
  const [showPreview, setShowPreview] = React.useState(false);
  const [showSplit, setShowSplit] = React.useState(false); // Split view mode
  const [showTemplates, setShowTemplates] = React.useState(false); // Hidden by default

  // Listen for auto-show preview event from AI response
  React.useEffect(() => {
    const handleShowPreview = () => {
      console.log('📺 Auto-showing full preview after AI response');
      setShowPreview(true);
      setShowSplit(false); // Full preview, no split
    };

    window.addEventListener('ba-show-preview', handleShowPreview);
    return () => window.removeEventListener('ba-show-preview', handleShowPreview);
  }, []);

  const handleTogglePreview = () => {
    if (showPreview) {
      // Currently showing preview, toggle to split view
      setShowSplit(true);
      setShowPreview(true);
    } else {
      // Not showing preview, show full preview
      setShowPreview(true);
      setShowSplit(false);
    }
  };

  const handleHidePreview = () => {
    setShowPreview(false);
    setShowSplit(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`px-3 py-1 text-sm border rounded ${
              showTemplates
                ? 'bg-gray-200 border-gray-300'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showTemplates ? 'Hide Templates' : 'Show Templates'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportButton />
          {showPreview && !showSplit && (
            <button
              onClick={() => setShowSplit(true)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Show Split
            </button>
          )}
          {showPreview && showSplit && (
            <button
              onClick={() => setShowSplit(false)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Full Preview
            </button>
          )}
          <button
            onClick={showPreview ? handleHidePreview : handleTogglePreview}
            className={`px-3 py-1 text-sm border rounded ${
              showPreview
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* EARS Templates Panel (Collapsible Left Sidebar) */}
        {showTemplates && (
          <div className="w-64 border-r bg-gray-50 overflow-y-auto">
            <EARSTemplatesPanel onClose={() => setShowTemplates(false)} />
          </div>
        )}

        {/* Editor and Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Requirements Editor - Visible when no preview or in split mode */}
          {(!showPreview || showSplit) && (
            <div className={showSplit ? 'w-1/2 border-r h-full' : 'w-full h-full'}>
              <RequirementsEditor />
            </div>
          )}

          {/* Markdown Preview - Full width or split based on mode */}
          {showPreview && (
            <div className={showSplit ? 'w-1/2 bg-white h-full' : 'w-full bg-white h-full'}>
              <MarkdownPreview />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
