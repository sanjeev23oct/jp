/**
 * Surgical Edit Panel - Quick edits using AI
 */

import React, { useState } from 'react';
import { useSurgicalEdit } from '../hooks/useSurgicalEdit';
import './SurgicalEditPanel.css';

interface SurgicalEditPanelProps {
  selectedElement?: {
    selector: string;
    tagName: string;
    className?: string;
    id?: string;
  };
  onClose: () => void;
}

export const SurgicalEditPanel: React.FC<SurgicalEditPanelProps> = ({
  selectedElement,
  onClose,
}) => {
  const [description, setDescription] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const { applySurgicalEditStream, isLoading } = useSurgicalEdit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) return;

    setResult(null);
    setProgressMessage('');

    const editResult = await applySurgicalEditStream(
      {
        description,
        selectedElement,
      },
      (message) => {
        setProgressMessage(message);
      }
    );

    if (editResult.success) {
      setResult(`✅ ${editResult.explanation || 'Edit applied successfully!'}`);
      setDescription('');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setResult(`❌ ${editResult.error || 'Failed to apply edit'}`);
    }
  };

  const quickActions = [
    { label: 'Make it blue', value: 'Change the background color to blue' },
    { label: 'Increase size', value: 'Make the font size bigger' },
    { label: 'Add padding', value: 'Add more padding' },
    { label: 'Center it', value: 'Center this element' },
    { label: 'Add shadow', value: 'Add a subtle box shadow' },
    { label: 'Round corners', value: 'Add rounded corners' },
  ];

  return (
    <div className="surgical-edit-panel">
      <div className="surgical-edit-header">
        <h3>✨ Quick Edit with AI</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      {selectedElement && (
        <div className="selected-element-info">
          <span className="element-tag">&lt;{selectedElement.tagName}&gt;</span>
          {selectedElement.className && (
            <span className="element-class">.{selectedElement.className.split(' ')[0]}</span>
          )}
          {selectedElement.id && (
            <span className="element-id">#{selectedElement.id}</span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="surgical-edit-form">
        <div className="form-group">
          <label>What would you like to change?</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Make the button blue, increase font size..."
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div className="quick-actions">
          <label>Quick actions:</label>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="quick-action-btn"
                onClick={() => setDescription(action.value)}
                disabled={isLoading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="apply-btn"
          disabled={isLoading || !description.trim()}
        >
          {isLoading ? '⏳ Applying...' : '✨ Apply Edit'}
        </button>
      </form>

      {progressMessage && (
        <div className="progress-message">
          {progressMessage}
        </div>
      )}

      {result && (
        <div className={`result-message ${result.startsWith('✅') ? 'success' : 'error'}`}>
          {result}
        </div>
      )}

      <div className="surgical-edit-info">
        <p>💡 <strong>Tip:</strong> Surgical edits make targeted changes without regenerating the entire prototype.</p>
        <div className="edit-types">
          <span className="edit-type">🎨 Style changes</span>
          <span className="edit-type">📝 Content updates</span>
          <span className="edit-type">🔧 Structural edits</span>
        </div>
      </div>
    </div>
  );
};

