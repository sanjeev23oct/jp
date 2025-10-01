/**
 * Cached Responses Panel - Shows saved LLM responses
 */

import { useState, useEffect } from 'react';

interface CachedResponse {
  prompt: string;
  timestamp: string;
  metadata: {
    htmlLength: number;
    cssLength: number;
    jsLength: number;
  };
}

export function CachedResponsesPanel() {
  const [responses, setResponses] = useState<CachedResponse[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadResponses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/chat/cached-responses');
      const data = await res.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Failed to load cached responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached responses?')) return;
    
    try {
      await fetch('http://localhost:3001/api/chat/cache', { method: 'DELETE' });
      setResponses([]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResponses();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors text-sm z-50"
      >
        📦 Cached Responses ({responses.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-xl w-96 max-h-96 overflow-hidden z-50">
      <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
        <h3 className="font-semibold">📦 Cached LLM Responses</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-600 rounded px-2"
        >
          ✕
        </button>
      </div>

      <div className="p-3 border-b bg-gray-50 flex gap-2">
        <button
          onClick={loadResponses}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
        <button
          onClick={clearCache}
          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          🗑️ Clear All
        </button>
      </div>

      <div className="overflow-y-auto max-h-80">
        {responses.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No cached responses yet</p>
            <p className="text-xs mt-2">
              Switch to Real Mode and generate some code to build the cache
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {responses.map((response, index) => (
              <div key={index} className="p-3 hover:bg-gray-50">
                <div className="font-medium text-sm mb-1 line-clamp-2">
                  {response.prompt}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>
                    {new Date(response.timestamp).toLocaleString()}
                  </div>
                  <div className="flex gap-3">
                    <span>HTML: {response.metadata.htmlLength}b</span>
                    <span>CSS: {response.metadata.cssLength}b</span>
                    <span>JS: {response.metadata.jsLength}b</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

