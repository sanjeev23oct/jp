/**
 * Code Viewer Component - Shows generated HTML/CSS/JS code
 */

import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';

type CodeTab = 'html' | 'css' | 'js';

export function CodeViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const { currentCode } = useEditorStore();

  const hasCode = currentCode.html || currentCode.css || currentCode.js;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const downloadCode = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Prototype</title>
  <style>
${currentCode.css}
  </style>
</head>
<body>
${currentCode.html}
  <script>
${currentCode.js}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prototype.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={!hasCode}
        className={`fixed bottom-20 right-4 px-4 py-2 rounded-lg shadow-lg transition-colors text-sm z-50 ${
          hasCode
            ? 'bg-purple-500 text-white hover:bg-purple-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        💻 View Code
      </button>
    );
  }

  const tabs: { id: CodeTab; label: string; icon: string }[] = [
    { id: 'html', label: 'HTML', icon: '📄' },
    { id: 'css', label: 'CSS', icon: '🎨' },
    { id: 'js', label: 'JavaScript', icon: '⚡' },
  ];

  const currentCodeContent = currentCode[activeTab] || '// No code yet';
  const lineCount = currentCodeContent.split('\n').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">💻 Generated Code</h3>
            <span className="text-sm opacity-90">{lineCount} lines</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(currentCodeContent)}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
            >
              📋 Copy
            </button>
            <button
              onClick={downloadCode}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
            >
              💾 Download HTML
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {currentCode[tab.id] && (
                <span className="ml-2 text-xs opacity-60">
                  ({currentCode[tab.id].length} chars)
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-4 font-mono text-sm">
          <pre className="whitespace-pre-wrap break-words">
            <code>{currentCodeContent}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>HTML: {currentCode.html?.length || 0} chars</span>
            <span>CSS: {currentCode.css?.length || 0} chars</span>
            <span>JS: {currentCode.js?.length || 0} chars</span>
          </div>
          <div className="text-xs opacity-75">
            Press ESC to close
          </div>
        </div>
      </div>
    </div>
  );
}

