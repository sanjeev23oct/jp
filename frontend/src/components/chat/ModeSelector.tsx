/**
 * ModeSelector Component - Toggle between Agent and Chat modes
 */

import { ChatMode } from '../../types/chat';
import { Zap, MessageCircle } from 'lucide-react';

interface ModeSelectorProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <button
        onClick={() => onChange(ChatMode.AGENT)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === ChatMode.AGENT
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Zap size={16} />
        Agent Mode
      </button>
      <button
        onClick={() => onChange(ChatMode.CHAT)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          mode === ChatMode.CHAT
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <MessageCircle size={16} />
        Chat Mode
      </button>
    </div>
  );
}

