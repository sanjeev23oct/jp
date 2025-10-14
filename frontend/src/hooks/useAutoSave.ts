/**
 * Auto-save Hook - Monitors editor changes and triggers auto-save
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { useProjectStore } from '../store/useProjectStore';

export const useAutoSave = () => {
  const { currentCode } = useEditorStore();
  const { currentProject, triggerAutoSave, enableAutoSave, disableAutoSave } = useProjectStore();
  
  const previousCodeRef = useRef(currentCode);

  useEffect(() => {
    // Enable auto-save when component mounts
    enableAutoSave();
    
    return () => {
      // Disable auto-save when component unmounts
      disableAutoSave();
    };
  }, [enableAutoSave, disableAutoSave]);

  useEffect(() => {
    // Only trigger auto-save if we have a current project
    if (!currentProject) return;
    
    // Check if code actually changed
    const codeChanged = 
      previousCodeRef.current.html !== currentCode.html ||
      previousCodeRef.current.css !== currentCode.css ||
      previousCodeRef.current.js !== currentCode.js;
    
    if (codeChanged) {
      console.log('📝 Code changed, triggering auto-save...');
      triggerAutoSave();
      previousCodeRef.current = currentCode;
    }
  }, [currentCode, currentProject, triggerAutoSave]);
};
