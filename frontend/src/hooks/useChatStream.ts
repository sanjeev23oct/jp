/**
 * Hook for streaming chat using AG-UI protocol
 */

import { useState, useCallback } from 'react';
import { useEditorStore } from '../store/useEditorStore';

interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChat StreamReturn {
  messages: StreamMessage[];
  isLoading: boolean;
  sendMessage: (message: string, mode: 'agent' | 'chat') => Promise<void>;
  clearMessages: () => void;
}

export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setCode } = useEditorStore();

  const sendMessage = useCallback(async (message: string, mode: 'agent' | 'chat') => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);

    let assistantMessage = '';
    let messageId = '';

    try {
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          mode,
          conversationHistory: messages,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.substring(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (!data) continue;

            try {
              const event = JSON.parse(data);

              // Handle different event types
              switch (event.type) {
                case 'TextMessageStart':
                  messageId = event.messageId;
                  assistantMessage = '';
                  break;

                case 'TextMessageContent':
                  if (event.messageId === messageId) {
                    assistantMessage += event.delta;
                    // Update the last message in real-time
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMsg = newMessages[newMessages.length - 1];
                      if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = assistantMessage;
                      } else {
                        newMessages.push({ role: 'assistant', content: assistantMessage });
                      }
                      return newMessages;
                    });
                  }
                  break;

                case 'TextMessageEnd':
                  // Message complete
                  break;

                case 'Custom':
                  if (event.name === 'code_generated' && event.value) {
                    // Update editor with generated code
                    const { html, css, js } = event.value;
                    const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Prototype</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`;
                    setCode(completeHTML);
                  }
                  break;

                case 'RunError':
                  console.error('Run error:', event.message);
                  break;
              }
            } catch (e) {
              console.error('Failed to parse event data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, setCode]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}

