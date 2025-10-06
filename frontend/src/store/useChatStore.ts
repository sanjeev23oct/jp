/**
 * Chat Store - Manages chat state and conversation history
 */

import { create } from 'zustand';
import { ChatMessage, ChatMode, MessageRole } from '../types/chat';
import { useEditorStore } from './useEditorStore';
import { useHistoryStore } from './useHistoryStore';
import { AgentGenerationCommand, createSnapshot } from '../lib/commands';

interface ChatState {
  messages: ChatMessage[];
  mode: ChatMode;
  isLoading: boolean;
  error: string | null;
  currentProjectId: string | null;
  useMockMode: boolean; // For testing without LLM tokens

  // Actions
  setMode: (mode: ChatMode) => void;
  sendMessage: (content: string, context?: any) => Promise<void>;
  clearMessages: () => void;
  setProjectId: (projectId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  toggleMockMode: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  mode: ChatMode.AGENT,
  isLoading: false,
  error: null,
  currentProjectId: null,
  useMockMode: false, // Default to real mode for actual generation

  setMode: (mode) => set({ mode }),

  toggleMockMode: () => set(state => ({ useMockMode: !state.useMockMode })),

  sendMessage: async (content, context) => {
    const state = get();

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: MessageRole.USER,
      content,
      timestamp: new Date(),
      mode: state.mode,
    };

    set({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null
    });

    try {
      // Use streaming endpoint (mock or real based on useMockMode)
      const endpoint = state.useMockMode
        ? 'http://localhost:3001/api/chat/mock'
        : 'http://localhost:3001/api/chat/stream';

      console.log(`🔌 Using ${state.useMockMode ? 'MOCK' : 'REAL'} endpoint:`, endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          mode: state.mode,
          projectId: state.currentProjectId || undefined,
          conversationHistory: state.messages.slice(-10),
          context,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Track messages by their IDs
      const messageMap = new Map<string, ChatMessage>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (!data) continue;

            try {
              const event = JSON.parse(data);
              console.log('📨 Received event:', event.type, event);

              if (event.type === 'TextMessageStart') {
                console.log('🆕 Creating new message:', event.messageId);
                // Create a new message for this messageId
                const newMessage: ChatMessage = {
                  id: event.messageId,
                  role: MessageRole.ASSISTANT,
                  content: '',
                  timestamp: new Date(),
                  mode: state.mode,
                };
                messageMap.set(event.messageId, newMessage);

                // Add to messages array
                set(state => ({
                  messages: [...state.messages, newMessage]
                }));
              } else if (event.type === 'TextMessageContent') {
                console.log('📝 Updating message:', event.messageId, 'Delta:', event.delta);
                // Update the specific message by ID
                const messageId = event.messageId;

                set(state => ({
                  messages: state.messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + event.delta }
                      : msg
                  )
                }));
              } else if (event.type === 'Custom' && event.name === 'code_generated') {
                console.log('📦 Received code_generated event:', event.value);

                // Create snapshot before generation
                const beforeSnapshot = createSnapshot();

                // Immediately update the editor with generated code
                const { html, css, js } = event.value;
                console.log('📝 Updating editor with code:', {
                  htmlLength: html?.length || 0,
                  cssLength: css?.length || 0,
                  jsLength: js?.length || 0
                });
                useEditorStore.getState().setCode({
                  html: html || '',
                  css: css || '',
                  js: js || ''
                });

                // Create snapshot after generation
                const afterSnapshot = createSnapshot();

                // Add to history if in agent mode
                if (state.mode === ChatMode.AGENT) {
                  const command = new AgentGenerationCommand(
                    beforeSnapshot,
                    afterSnapshot,
                    content
                  );
                  useHistoryStore.getState().addCommand(command);
                }
              }
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }
      }

      set({ isLoading: false });

    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
      throw error;
    }
  },

  clearMessages: () => set({ messages: [], error: null }),

  setProjectId: (projectId) => set({ currentProjectId: projectId }),

  addMessage: (message) => set(state => ({
    messages: [...state.messages, message]
  })),
}));

