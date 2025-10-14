/**
 * RequirementsEditor - Markdown editor for requirements
 */

import React, { useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';

export const RequirementsEditor: React.FC = () => {
  const { currentProject, saveProject } = useProjectStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [localRequirements, setLocalRequirements] = React.useState('');

  const requirements = currentProject?.requirements || '';

  // Sync local state with project store
  useEffect(() => {
    setLocalRequirements(requirements);
  }, [requirements]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newRequirements = e.target.value;
    setLocalRequirements(newRequirements);
    
    // Update project store with debounce
    if (currentProject) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save (2 seconds)
      saveTimeoutRef.current = setTimeout(() => {
        saveProject({ requirements: newRequirements });
      }, 2000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Editor Header */}
      <div className="px-4 py-2 border-b bg-gray-50 flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-700">Requirements Document</h3>
      </div>

      {/* Textarea Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={localRequirements}
          onChange={handleChange}
          placeholder="# Requirements Document

## Introduction
Describe your feature or system here...

## Functional Requirements

### FR-1: Feature Name

**User Story:** As a [role], I want [feature], so that [benefit]

#### Requirements

1. WHEN [trigger] THEN the system SHALL [response]
2. WHILE [state] the system SHALL [behavior]
3. IF [condition] THEN the system SHALL [action]
"
          className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none overflow-y-auto"
          style={{
            lineHeight: '1.6',
            tabSize: 2,
          }}
        />
      </div>

      {/* Add custom CSS for EARS keyword highlighting */}
      <style>{`
        .ears-keyword {
          color: #2563eb;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
