/**
 * History Timeline Component - Displays undo/redo history
 */

import React, { useState } from 'react';
import { useHistoryStore } from '../store/useHistoryStore';
import { CommandType } from '../types/history';
import './HistoryTimeline.css';

const getCommandIcon = (type: CommandType): string => {
  switch (type) {
    case CommandType.VISUAL_EDIT:
      return '🎨';
    case CommandType.SURGICAL_EDIT:
      return '✂️';
    case CommandType.AGENT_GENERATION:
      return '🤖';
    case CommandType.COMPONENT_ADD:
      return '➕';
    case CommandType.COMPONENT_DELETE:
      return '🗑️';
    default:
      return '📝';
  }
};

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

interface HistoryTimelineProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ isOpen, onClose }) => {
  const { undoStack, redoStack, clearHistory, undo, redo } = useHistoryStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allCommands = [...undoStack].reverse();
  const filteredCommands = searchQuery
    ? allCommands.filter(cmd =>
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allCommands;

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearHistory();
    }
  };

  const handleJumpToPoint = (targetIndex: number) => {
    const currentIndex = undoStack.length - 1;
    const stepsToMove = currentIndex - targetIndex;

    if (stepsToMove > 0) {
      // Need to undo
      for (let i = 0; i < stepsToMove; i++) {
        undo();
      }
    } else if (stepsToMove < 0) {
      // Need to redo
      for (let i = 0; i < Math.abs(stepsToMove); i++) {
        redo();
      }
    }
  };

  return (
    <div className="history-timeline-overlay" onClick={onClose}>
      <div className="history-timeline" onClick={(e) => e.stopPropagation()}>
        <div className="history-timeline-header">
          <h2>History Timeline</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-timeline-controls">
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="history-search"
          />
          <button
            className="clear-history-button"
            onClick={handleClearHistory}
            disabled={undoStack.length === 0}
          >
            Clear History
          </button>
        </div>

        <div className="history-timeline-stats">
          <span>{undoStack.length} action{undoStack.length !== 1 ? 's' : ''} in history</span>
          {redoStack.length > 0 && (
            <span className="redo-available">
              {redoStack.length} action{redoStack.length !== 1 ? 's' : ''} available to redo
            </span>
          )}
        </div>

        <div className="history-timeline-list">
          {filteredCommands.length === 0 ? (
            <div className="history-empty">
              {searchQuery ? 'No matching history items' : 'No history yet'}
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const actualIndex = undoStack.length - 1 - index;
              return (
                <div
                  key={command.id}
                  className="history-item"
                  onClick={() => handleJumpToPoint(actualIndex)}
                  title="Click to jump to this point in history"
                >
                  <div className="history-item-icon">
                    {getCommandIcon(command.type)}
                  </div>
                  <div className="history-item-content">
                    <div className="history-item-description">
                      {command.description}
                    </div>
                    <div className="history-item-meta">
                      <span className="history-item-type">{command.type}</span>
                      <span className="history-item-time">
                        {formatTimestamp(command.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
