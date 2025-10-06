/**
 * Keyboard Shortcuts Hook - Handles global keyboard shortcuts
 */

import { useEffect } from 'react';
import { useHistoryStore } from '../store/useHistoryStore';

export function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl/Cmd key
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (!modifierKey) return;

      // Undo: Ctrl+Z / Cmd+Z
      if (event.key === 'z' && !event.shiftKey) {
        if (canUndo()) {
          event.preventDefault();
          undo();
          console.log('⌨️ Keyboard shortcut: Undo');
        }
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z
      if (
        (event.key === 'y' && !isMac) ||
        (event.key === 'z' && event.shiftKey && isMac)
      ) {
        if (canRedo()) {
          event.preventDefault();
          redo();
          console.log('⌨️ Keyboard shortcut: Redo');
        }
        return;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);
}
