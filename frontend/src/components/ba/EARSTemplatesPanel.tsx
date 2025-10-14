/**
 * EARSTemplatesPanel - Quick access to EARS pattern templates
 */

import React from 'react';
import { X, Copy } from 'lucide-react';

interface Template {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

const templates: Template[] = [
  {
    name: 'Ubiquitous',
    pattern: 'The system SHALL [action]',
    description: 'General system behavior that always applies',
    example: 'The system SHALL encrypt all passwords using bcrypt',
  },
  {
    name: 'Event-driven',
    pattern: 'WHEN [trigger] THEN the system SHALL [response]',
    description: 'Behavior triggered by a specific event',
    example: 'WHEN user clicks submit THEN the system SHALL validate the form',
  },
  {
    name: 'State-driven',
    pattern: 'WHILE [state] the system SHALL [behavior]',
    description: 'Behavior that occurs during a specific state',
    example: 'WHILE user is authenticated the system SHALL display the dashboard',
  },
  {
    name: 'Unwanted Behavior',
    pattern: 'IF [condition] THEN the system SHALL [response]',
    description: 'Error handling and edge cases',
    example: 'IF password is incorrect THEN the system SHALL display an error message',
  },
  {
    name: 'Optional',
    pattern: 'WHERE [feature] the system SHALL [behavior]',
    description: 'Feature-specific behavior',
    example: 'WHERE premium subscription is active the system SHALL enable advanced features',
  },
];

interface EARSTemplatesPanelProps {
  onClose: () => void;
}

export const EARSTemplatesPanel: React.FC<EARSTemplatesPanelProps> = ({ onClose }) => {
  const copyTemplate = (pattern: string) => {
    navigator.clipboard.writeText(pattern);
    // TODO: Show toast notification
    console.log('Template copied:', pattern);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <h3 className="font-semibold text-gray-900">EARS Templates</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
          title="Close templates"
        >
          <X size={18} />
        </button>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {templates.map((template, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
          >
            {/* Template Name */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
              <button
                onClick={() => copyTemplate(template.pattern)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy template"
              >
                <Copy size={14} />
              </button>
            </div>

            {/* Pattern */}
            <div className="mb-2">
              <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded block font-mono">
                {template.pattern}
              </code>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-2">{template.description}</p>

            {/* Example */}
            <div className="text-xs">
              <span className="text-gray-500 font-medium">Example:</span>
              <p className="text-gray-700 mt-1 italic">{template.example}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with Info */}
      <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-600">
        <p className="mb-1">
          <strong>EARS</strong> = Easy Approach to Requirements Syntax
        </p>
        <p>Click copy icon to use a template in your requirements.</p>
      </div>
    </div>
  );
};
