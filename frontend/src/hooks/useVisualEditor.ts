import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { VisualEditCommand, createSnapshot } from '../lib/commands';

interface SelectedElement {
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  styles: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontWeight?: string;
    width?: string;
    height?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    borderWidth?: string;
    borderColor?: string;
  };
  path: string;
  element?: HTMLElement;
}

export const useVisualEditor = () => {
  const [isVisualEditMode, setIsVisualEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const { currentCode, setCode, updateHtml } = useEditorStore();

  const getElementPath = (element: HTMLElement): string => {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.tagName !== 'BODY') {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  };

  const getComputedStyles = (element: HTMLElement) => {
    const computed = window.getComputedStyle(element);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      width: computed.width,
      height: computed.height,
      padding: computed.padding,
      margin: computed.margin,
      borderRadius: computed.borderRadius,
      borderWidth: computed.borderWidth,
      borderColor: computed.borderColor,
    };
  };

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const selectElement = useCallback((element: HTMLElement) => {
    const selected: SelectedElement = {
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id,
      textContent: element.textContent?.trim() || '',
      styles: getComputedStyles(element),
      path: getElementPath(element),
      element,
    };

    setSelectedElement(selected);
  }, []);

  const updateElement = useCallback((updates: Partial<SelectedElement>) => {
    if (!selectedElement?.element) return;

    const element = selectedElement.element;

    // Update text content - apply directly without HTML update
    if (updates.textContent !== undefined) {
      element.textContent = updates.textContent;
      // Update state to reflect change
      setSelectedElement(prev => prev ? {
        ...prev,
        textContent: updates.textContent || ''
      } : null);
    }

    // Update className - apply directly without HTML update
    if (updates.className !== undefined) {
      element.className = updates.className;
      setSelectedElement(prev => prev ? {
        ...prev,
        className: updates.className || ''
      } : null);
    }

    // Update id - apply directly without HTML update
    if (updates.id !== undefined) {
      element.id = updates.id;
      setSelectedElement(prev => prev ? {
        ...prev,
        id: updates.id || ''
      } : null);
    }

    // Update styles - apply directly to element as inline styles
    if (updates.styles) {
      Object.entries(updates.styles).forEach(([property, value]) => {
        if (value) {
          element.style[property as any] = value;
        }
      });

      // Update the selected element state to reflect new styles
      setSelectedElement(prev => prev ? {
        ...prev,
        styles: { ...prev.styles, ...updates.styles }
      } : null);
    }

    // Note: We don't update HTML here to avoid flicker
    // Changes will be saved when user clicks "Save Changes to Code"
  }, [selectedElement]);

  const saveChanges = useCallback((iframe: HTMLIFrameElement) => {
    if (!iframe.contentDocument) return;

    // Create snapshot before changes
    const beforeSnapshot = createSnapshot();

    // Extract the updated HTML with inline styles
    const bodyContent = iframe.contentDocument.body.innerHTML;
    updateHtml(bodyContent);

    // Create snapshot after changes
    const afterSnapshot = createSnapshot();

    // Add to history if there were actual changes
    if (beforeSnapshot.html !== afterSnapshot.html) {
      const command = new VisualEditCommand(
        beforeSnapshot,
        afterSnapshot,
        'Visual edit: Updated element styles'
      );
      useHistoryStore.getState().addCommand(command);
    }
  }, [updateHtml]);

  const enableVisualEditMode = useCallback(() => {
    setIsVisualEditMode(true);
  }, []);

  const disableVisualEditMode = useCallback(() => {
    setIsVisualEditMode(false);
    clearSelection();
  }, [clearSelection]);

  const setupIframeListeners = useCallback((iframe: HTMLIFrameElement) => {
    if (!iframe.contentDocument || !isVisualEditMode) return;

    const doc = iframe.contentDocument;

    const handleClick = (e: MouseEvent) => {
      if (!isVisualEditMode) return;
      
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (target && target.tagName !== 'BODY' && target.tagName !== 'HTML') {
        selectElement(target);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (!isVisualEditMode) return;
      
      const target = e.target as HTMLElement;
      if (target && target.tagName !== 'BODY' && target.tagName !== 'HTML') {
        target.classList.add('visual-edit-hover');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove('visual-edit-hover');
      }
    };

    doc.addEventListener('click', handleClick, true);
    doc.addEventListener('mouseover', handleMouseOver, true);
    doc.addEventListener('mouseout', handleMouseOut, true);

    // Cleanup
    return () => {
      doc.removeEventListener('click', handleClick, true);
      doc.removeEventListener('mouseover', handleMouseOver, true);
      doc.removeEventListener('mouseout', handleMouseOut, true);
    };
  }, [isVisualEditMode, selectElement]);

  return {
    isVisualEditMode,
    selectedElement,
    selectElement,
    updateElement,
    clearSelection,
    saveChanges,
    enableVisualEditMode,
    disableVisualEditMode,
    setupIframeListeners,
  };
};

