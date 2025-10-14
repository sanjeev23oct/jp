/**
 * MarkdownPreview - Preview requirements in formatted markdown
 */

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { useProjectStore } from '../../store/useProjectStore';

export const MarkdownPreview: React.FC = () => {
  const { currentProject } = useProjectStore();
  const requirements = currentProject?.requirements || '';

  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Convert markdown to HTML
  const html = useMemo(() => {
    if (!requirements) {
      return '<div class="text-gray-400 text-center py-8">No requirements yet. Start writing in the editor!</div>';
    }

    try {
      let rendered = marked(requirements) as string;
      
      // Highlight EARS keywords in the rendered HTML
      const keywords = ['WHEN', 'WHILE', 'IF', 'WHERE', 'SHALL', 'THEN'];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        rendered = rendered.replace(regex, `<span class="ears-keyword">${keyword}</span>`);
      });
      
      return rendered;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return '<div class="text-red-500">Error parsing markdown</div>';
    }
  }, [requirements]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Preview Header */}
      <div className="px-4 py-2 border-b bg-gray-50 flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-700">Preview</h3>
      </div>

      {/* Markdown Content */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="prose prose-sm max-w-none p-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Custom Styles */}
      <style>{`
        .prose {
          color: #374151;
        }
        
        .prose h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 1em;
          color: #111827;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.3em;
        }
        
        .prose h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 2em;
          margin-bottom: 0.75em;
          color: #1f2937;
        }
        
        .prose h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: #374151;
        }
        
        .prose h4 {
          font-size: 1.1em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #4b5563;
        }
        
        .prose p {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          line-height: 1.7;
        }
        
        .prose strong {
          font-weight: 600;
          color: #111827;
        }
        
        .prose ol, .prose ul {
          margin-top: 0.75em;
          margin-bottom: 0.75em;
          padding-left: 1.5em;
        }
        
        .prose li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
          line-height: 1.7;
        }
        
        .prose code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
          font-family: 'Courier New', monospace;
        }
        
        .prose pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        
        .prose pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        
        .prose blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .prose .ears-keyword {
          color: #2563eb;
          font-weight: 700;
          background-color: #dbeafe;
          padding: 0.1em 0.3em;
          border-radius: 3px;
        }
        
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        
        .prose th, .prose td {
          border: 1px solid #e5e7eb;
          padding: 0.5em;
          text-align: left;
        }
        
        .prose th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
