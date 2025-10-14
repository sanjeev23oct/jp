/**
 * Save Indicator - Shows save status
 */

import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';

export const SaveIndicator: React.FC = () => {
  const { isSaving, lastSaved, error } = useProjectStore();

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 5000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <AlertCircle size={16} />
        <span>Save failed</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader size={16} className="animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle size={16} />
        <span>Saved {formatTime(lastSaved)}</span>
      </div>
    );
  }

  return null;
};
