import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

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
    let needsHtmlUpdate = false;

    // Update text content
    if (updates.textContent !== undefined) {
      element.textContent = updates.textContent;
      needsHtmlUpdate = true;
    }

    // Update className
    if (updates.className !== undefined) {
      element.className = updates.className;
      needsHtmlUpdate = true;
    }

    // Update id
    if (updates.id !== undefined) {
      element.id = updates.id;
      needsHtmlUpdate = true;
    }

    // Update styles - apply directly to element without triggering HTML update
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

    // Only update HTML if structural changes were made
    if (needsHtmlUpdate) {
      const bodyContent = element.ownerDocument?.body.innerHTML || '';
      updateHtml(bodyContent);

      // After HTML update, we need to re-select the element
      // Store the path to find it again
      const path = getElementPath(element);
      setTimeout(() => {
        // Try to find the element again using the path
        const doc = element.ownerDocument;
        if (doc) {
          try {
            const newElement = doc.querySelector(path.split(' > ').pop() || '') as HTMLElement;
            if (newElement) {
              selectElement(newElement);
            }
          } catch (e) {
            // If selector fails, clear selection
            clearSelection();
          }
        }
      }, 100);
    }
  }, [selectedElement, updateHtml, selectElement, clearSelection, getElementPath]);

  const saveChanges = useCallback((iframe: HTMLIFrameElement) => {
    if (!iframe.contentDocument) return;

    // Extract the updated HTML with inline styles
    const bodyContent = iframe.contentDocument.body.innerHTML;
    updateHtml(bodyContent);
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

