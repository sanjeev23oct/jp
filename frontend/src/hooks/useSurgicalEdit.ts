/**
 * Surgical Edit Hook - Handle targeted code modifications
 */

import { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';

interface SurgicalEditRequest {
  description: string;
  selectedElement?: {
    selector: string;
    tagName: string;
    className?: string;
    id?: string;
  };
}

interface SurgicalEditResult {
  success: boolean;
  updatedCode?: {
    html: string;
    css: string;
    js: string;
  };
  explanation?: string;
  editType?: 'css-selector' | 'search-replace' | 'whole-file';
  error?: string;
}

export const useSurgicalEdit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentCode, setCode } = useEditorStore();

  const applySurgicalEdit = async (request: SurgicalEditRequest): Promise<SurgicalEditResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/surgical-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: request.description,
          currentCode,
          selectedElement: request.selectedElement,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply surgical edit');
      }

      const data = await response.json();

      if (data.success && data.updatedCode) {
        // Update the editor with new code
        setCode(data.updatedCode);

        return {
          success: true,
          updatedCode: data.updatedCode,
          explanation: data.explanation,
          editType: data.editType,
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to apply surgical edit';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const applySurgicalEditStream = async (
    request: SurgicalEditRequest,
    onProgress?: (message: string) => void
  ): Promise<SurgicalEditResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/surgical-edit/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: request.description,
          currentCode,
          selectedElement: request.selectedElement,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start surgical edit stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let result: SurgicalEditResult = { success: false };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const event = line.substring(7);
            const nextLine = lines[lines.indexOf(line) + 1];
            
            if (nextLine && nextLine.startsWith('data: ')) {
              const data = JSON.parse(nextLine.substring(6));

              if (event === 'progress' && onProgress) {
                onProgress(data.message);
              } else if (event === 'complete') {
                setCode(data.updatedCode);
                result = {
                  success: true,
                  updatedCode: data.updatedCode,
                  explanation: data.explanation,
                  editType: data.editType,
                };
              } else if (event === 'error') {
                throw new Error(data.message);
              }
            }
          }
        }
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to apply surgical edit';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    applySurgicalEdit,
    applySurgicalEditStream,
    isLoading,
    error,
  };
};

