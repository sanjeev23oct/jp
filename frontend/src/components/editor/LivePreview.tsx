/**
 * LivePreview Component - Shows live preview of generated code with visual editing
 */

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useVisualEditor } from '../../hooks/useVisualEditor';
import { PropertyPanel } from '../PropertyPanel';
import { SurgicalEditPanel } from '../SurgicalEditPanel';
import '../PropertyPanel.css';

export function LivePreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { currentCode } = useEditorStore();
  const {
    isVisualEditMode,
    selectedElement,
    updateElement,
    clearSelection,
    saveChanges,
    enableVisualEditMode,
    disableVisualEditMode,
    setupIframeListeners,
  } = useVisualEditor();

  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  const [showSurgicalEditPanel, setShowSurgicalEditPanel] = useState(false);

  // Separate effect for rendering content
  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const document = iframe.contentDocument;

    if (!document) return;

    // Build complete HTML document with visual editing styles
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    ${currentCode.css}

    /* Visual editing styles */
    .visual-edit-selected {
      outline: 2px solid #4fc3f7 !important;
      outline-offset: 2px;
      cursor: pointer;
    }
    .visual-edit-hover {
      outline: 2px dashed #4fc3f7 !important;
      outline-offset: 2px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  ${currentCode.html}
  <script>
    ${currentCode.js}
  </script>
</body>
</html>
    `;

    document.open();
    document.write(fullHtml);
    document.close();
  }, [currentCode]);

  // Separate effect for setting up listeners
  useEffect(() => {
    if (!iframeRef.current || !isVisualEditMode) return;

    const iframe = iframeRef.current;

    // Wait for iframe to be ready
    const setupListeners = () => {
      if (iframe.contentDocument?.readyState === 'complete') {
        const cleanup = setupIframeListeners(iframe);
        return cleanup;
      }
    };

    // Try to setup immediately
    const cleanup = setupListeners();

    // Also listen for load event in case it's not ready yet
    iframe.addEventListener('load', setupListeners);

    return () => {
      iframe.removeEventListener('load', setupListeners);
      if (cleanup) cleanup();
    };
  }, [isVisualEditMode, setupIframeListeners, currentCode]);

  // Show property panel when element is selected
  useEffect(() => {
    setShowPropertyPanel(!!selectedElement);
  }, [selectedElement]);

  const toggleVisualEditMode = () => {
    if (isVisualEditMode) {
      // Save changes before exiting
      if (iframeRef.current) {
        saveChanges(iframeRef.current);
      }
      disableVisualEditMode();
      setShowPropertyPanel(false);
    } else {
      enableVisualEditMode();
    }
  };

  const handleSaveChanges = () => {
    if (iframeRef.current) {
      saveChanges(iframeRef.current);
      alert('Changes saved to code!');
    }
  };

  return (
    <div className="w-full h-full bg-white flex">
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        {currentCode.html && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVisualEditMode}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isVisualEditMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isVisualEditMode ? '✓ Visual Edit Mode' : '🎨 Enable Visual Edit'}
              </button>
              {isVisualEditMode && (
                <>
                  <span className="text-sm text-gray-600">
                    Click any element to edit its properties
                  </span>
                  <button
                    onClick={handleSaveChanges}
                    className="ml-auto px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    💾 Save Changes to Code
                  </button>
                </>
              )}
              {!isVisualEditMode && (
                <button
                  onClick={() => setShowSurgicalEditPanel(!showSurgicalEditPanel)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    showSurgicalEditPanel
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ✨ Quick Edit with AI
                </button>
              )}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="flex-1">
          {currentCode.html ? (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <div className="text-4xl">🎨</div>
                <p>Preview will appear here</p>
                <p className="text-sm">Start chatting to generate your prototype</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Panel */}
      {showPropertyPanel && (
        <PropertyPanel
          selectedElement={selectedElement}
          onUpdateElement={updateElement}
          onClose={() => {
            clearSelection();
            setShowPropertyPanel(false);
          }}
        />
      )}

      {/* Surgical Edit Panel */}
      {showSurgicalEditPanel && (
        <SurgicalEditPanel
          selectedElement={selectedElement ? {
            selector: selectedElement.path,
            tagName: selectedElement.tagName,
            className: selectedElement.className,
            id: selectedElement.id,
          } : undefined}
          onClose={() => setShowSurgicalEditPanel(false)}
        />
      )}
    </div>
  );
}

