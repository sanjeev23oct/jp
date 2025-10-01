/**
 * ChatMessage Component - Displays a single chat message
 */

import { ChatMessage as ChatMessageType, MessageRole } from '../../types/chat';
import { User, Bot, Code } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Simple markdown-like rendering
function renderContent(content: string) {
  if (!content) return null;

  // Split by lines and process
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];

  lines.forEach((line, index) => {
    // Bold text **text**
    if (line.includes('**')) {
      const parts = line.split('**');
      elements.push(
        <div key={index}>
          {parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
          )}
        </div>
      );
    }
    // Numbered lists
    else if (/^\d+\./.test(line.trim())) {
      elements.push(<div key={index} className="ml-4">{line}</div>);
    }
    // Horizontal rule
    else if (line.trim() === '---') {
      elements.push(<hr key={index} className="my-2 border-gray-300" />);
    }
    // Regular text
    else {
      elements.push(<div key={index}>{line || '\u00A0'}</div>);
    }
  });

  return <>{elements}</>;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === MessageRole.USER;
  const hasCode = message.metadata?.codeGenerated;

  return (
    <div
      className={`chat-message flex gap-3 p-4 ${isUser ? 'bg-muted/50' : 'bg-background'}`}
      data-role={isUser ? 'user' : 'assistant'}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          {hasCode && (
            <span className="code-generated-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs">
              <Code size={12} />
              Code Generated
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
          {renderContent(message.content)}
        </div>

        {message.metadata?.error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            Error: {message.metadata.error}
          </div>
        )}
      </div>
    </div>
  );
}

