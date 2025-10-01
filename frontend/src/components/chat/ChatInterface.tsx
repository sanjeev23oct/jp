/**
 * ChatInterface Component - Main chat UI with message list and input
 */

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useEditorStore } from '../../store/useEditorStore';
import { ChatMessage } from './ChatMessage';
import { ModeSelector } from './ModeSelector';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Loader2 } from 'lucide-react';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, mode, isLoading, error, useMockMode, setMode, sendMessage, toggleMockMode } = useChatStore();
  const { currentCode } = useEditorStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

    try {
      await sendMessage(message, {
        currentCode: currentCode ? currentCode : undefined,
        viewport: 'desktop',
      });

      // Code is automatically updated in the store via streaming events
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'agent'
                ? 'Agent Mode - Autonomous code generation'
                : 'Chat Mode - Conversational planning'}
            </p>
          </div>
          <ModeSelector mode={mode} onChange={setMode} />
        </div>
        {/* Mock Mode Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={toggleMockMode}
            className={`px-3 py-1 rounded-full transition-colors ${
              useMockMode
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-green-100 text-green-800 border border-green-300'
            }`}
          >
            {useMockMode ? '🧪 Mock Mode (Fast Testing)' : '🚀 Real Mode (Uses LLM)'}
          </button>
          <span className="text-muted-foreground">
            {useMockMode ? 'No tokens used' : 'Uses API tokens'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-4xl">👋</div>
              <h3 className="text-xl font-semibold">Welcome to HTML Prototype Builder</h3>
              <p className="text-muted-foreground">
                {mode === 'agent' 
                  ? 'Describe what you want to build, and I\'ll generate the code for you.'
                  : 'Ask me anything about your prototype, and I\'ll help you plan and debug.'}
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">Try asking:</p>
                <ul className="space-y-1">
                  {mode === 'agent' ? (
                    <>
                      <li>"Create a landing page for a SaaS product"</li>
                      <li>"Build a todo list with local storage"</li>
                      <li>"Make a pricing page with 3 tiers"</li>
                    </>
                  ) : (
                    <>
                      <li>"How should I structure my landing page?"</li>
                      <li>"What's the best way to add animations?"</li>
                      <li>"Help me debug this CSS issue"</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 bg-destructive/10 border-t border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'agent'
                ? 'Describe what you want to build...'
                : 'Ask a question or describe your idea...'
            }
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

