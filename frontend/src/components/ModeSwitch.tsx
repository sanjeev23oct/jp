/**
 * ModeSwitch - Toggle between Prototype and BA modes
 */

import React, { useState, useRef, useEffect } from 'react';
import { useModeStore } from '../store/useModeStore';
import { Code, FileText, ChevronDown } from 'lucide-react';

export const ModeSwitch: React.FC = () => {
  const { mode, setMode } = useModeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeChange = (newMode: 'prototype' | 'ba') => {
    setMode(newMode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {mode === 'prototype' ? (
          <>
            <Code size={18} />
            <span className="font-medium">Prototype</span>
          </>
        ) : (
          <>
            <FileText size={18} />
            <span className="font-medium">BA Mode</span>
          </>
        )}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <button
            onClick={() => handleModeChange('prototype')}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              mode === 'prototype' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            <Code size={18} />
            <div>
              <div className="font-medium">Prototype Mode</div>
              <div className="text-xs text-gray-500">Build HTML prototypes</div>
            </div>
          </button>
          
          <button
            onClick={() => handleModeChange('ba')}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              mode === 'ba' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            <FileText size={18} />
            <div>
              <div className="font-medium">BA Mode</div>
              <div className="text-xs text-gray-500">Write requirements in EARS</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
