import React, { useState, useEffect } from 'react';
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
  path: string; // CSS selector path to element
}

interface PropertyPanelProps {
  selectedElement: SelectedElement | null;
  onUpdateElement: (updates: Partial<SelectedElement>) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onClose,
}) => {
  const [localStyles, setLocalStyles] = useState(selectedElement?.styles || {});

  useEffect(() => {
    setLocalStyles(selectedElement?.styles || {});
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <div className="property-panel-empty">
        <div className="empty-state">
          <span className="empty-icon">🎯</span>
          <h3>No Element Selected</h3>
          <p>Click on any element in the preview to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleStyleChange = (property: string, value: string) => {
    const newStyles = { ...localStyles, [property]: value };
    setLocalStyles(newStyles);
    onUpdateElement({ styles: newStyles });
  };

  const handleTextChange = (value: string) => {
    onUpdateElement({ textContent: value });
  };

  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <div className="panel-title">
          <span className="panel-icon">⚙️</span>
          <h3>Properties</h3>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="property-panel-content">
        {/* Element Info */}
        <div className="property-section">
          <div className="section-header">Element Info</div>
          <div className="property-row">
            <label>Tag</label>
            <div className="property-value tag-badge">{selectedElement.tagName}</div>
          </div>
          {selectedElement.className && (
            <div className="property-row">
              <label>Class</label>
              <input
                type="text"
                value={selectedElement.className}
                onChange={(e) => onUpdateElement({ className: e.target.value })}
                className="property-input"
              />
            </div>
          )}
          {selectedElement.id && (
            <div className="property-row">
              <label>ID</label>
              <input
                type="text"
                value={selectedElement.id}
                onChange={(e) => onUpdateElement({ id: e.target.value })}
                className="property-input"
              />
            </div>
          )}
        </div>

        {/* Text Content */}
        {selectedElement.textContent && (
          <div className="property-section">
            <div className="section-header">Content</div>
            <div className="property-row">
              <label>Text</label>
              <textarea
                value={selectedElement.textContent}
                onChange={(e) => handleTextChange(e.target.value)}
                className="property-textarea"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Typography */}
        <div className="property-section">
          <div className="section-header">Typography</div>
          <div className="property-row">
            <label>Color</label>
            <div className="color-input-group">
              <input
                type="color"
                value={localStyles.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={localStyles.color || ''}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                placeholder="#000000"
                className="property-input color-text"
              />
            </div>
          </div>
          <div className="property-row">
            <label>Font Size</label>
            <input
              type="text"
              value={localStyles.fontSize || ''}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
              placeholder="16px"
              className="property-input"
            />
          </div>
          <div className="property-row">
            <label>Font Weight</label>
            <select
              value={localStyles.fontWeight || 'normal'}
              onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
              className="property-select"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="lighter">Lighter</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>
        </div>

        {/* Background */}
        <div className="property-section">
          <div className="section-header">Background</div>
          <div className="property-row">
            <label>Color</label>
            <div className="color-input-group">
              <input
                type="color"
                value={localStyles.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={localStyles.backgroundColor || ''}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                placeholder="#ffffff"
                className="property-input color-text"
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="property-section">
          <div className="section-header">Layout</div>
          <div className="property-row">
            <label>Width</label>
            <input
              type="text"
              value={localStyles.width || ''}
              onChange={(e) => handleStyleChange('width', e.target.value)}
              placeholder="auto"
              className="property-input"
            />
          </div>
          <div className="property-row">
            <label>Height</label>
            <input
              type="text"
              value={localStyles.height || ''}
              onChange={(e) => handleStyleChange('height', e.target.value)}
              placeholder="auto"
              className="property-input"
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="property-section">
          <div className="section-header">Spacing</div>
          <div className="property-row">
            <label>Padding</label>
            <input
              type="text"
              value={localStyles.padding || ''}
              onChange={(e) => handleStyleChange('padding', e.target.value)}
              placeholder="0px"
              className="property-input"
            />
          </div>
          <div className="property-row">
            <label>Margin</label>
            <input
              type="text"
              value={localStyles.margin || ''}
              onChange={(e) => handleStyleChange('margin', e.target.value)}
              placeholder="0px"
              className="property-input"
            />
          </div>
        </div>

        {/* Border */}
        <div className="property-section">
          <div className="section-header">Border</div>
          <div className="property-row">
            <label>Radius</label>
            <input
              type="text"
              value={localStyles.borderRadius || ''}
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
              placeholder="0px"
              className="property-input"
            />
          </div>
          <div className="property-row">
            <label>Width</label>
            <input
              type="text"
              value={localStyles.borderWidth || ''}
              onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
              placeholder="0px"
              className="property-input"
            />
          </div>
          <div className="property-row">
            <label>Color</label>
            <div className="color-input-group">
              <input
                type="color"
                value={localStyles.borderColor || '#000000'}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={localStyles.borderColor || ''}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                placeholder="#000000"
                className="property-input color-text"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

