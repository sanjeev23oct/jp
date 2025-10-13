/**
 * Chat Store - Manages chat state and conversation history
 */

import { create } from 'zustand';
import { ChatMessage, ChatMode, MessageRole } from '../types/chat';
import { useEditorStore } from './useEditorStore';
import { useHistoryStore } from './useHistoryStore';
import { AgentGenerationCommand, createSnapshot } from '../lib/commands';

interface GenerationProgress {
  status: 'planning' | 'generating' | 'parsing' | 'complete' | 'error' | 'retrying';
  message: string;
  startTime: Date;
  lastActivity: Date;
  retryAttempt?: number;
  maxRetries?: number;
}

interface ChatState {
  messages: ChatMessage[];
  mode: ChatMode;
  isLoading: boolean;
  error: string | null;
  currentProjectId: string | null;
  useMockMode: boolean; // For testing without LLM tokens
  generationProgress: GenerationProgress | null;

  // Actions
  setMode: (mode: ChatMode) => void;
  sendMessage: (content: string, context?: any) => Promise<void>;
  clearMessages: () => void;
  setProjectId: (projectId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  toggleMockMode: () => void;
  updateProgress: (progress: Partial<GenerationProgress>) => void;
  clearProgress: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  mode: ChatMode.AGENT,
  isLoading: false,
  error: null,
  currentProjectId: null,
  useMockMode: false, // Default to real mode for actual generation
  generationProgress: null,

  setMode: (mode) => set({ mode }),

  toggleMockMode: () => set(state => ({ useMockMode: !state.useMockMode })),

  updateProgress: (progress) => set(state => ({
    generationProgress: state.generationProgress 
      ? { ...state.generationProgress, ...progress }
      : { 
          status: 'generating', 
          message: '', 
          startTime: new Date(), 
          lastActivity: new Date(),
          ...progress 
        }
  })),

  clearProgress: () => set({ generationProgress: null }),

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

    // Initialize progress tracking
    const startTime = Date.now();
    let lastActivityTime = Date.now();
    
    get().updateProgress({
      status: 'generating',
      message: '🎯 Starting generation...',
      startTime: new Date(),
      lastActivity: new Date()
    });

    // Monitor for inactivity
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityTime;
      const totalElapsed = Math.floor((Date.now() - startTime) / 1000);
      
      if (elapsed > 10000) { // 10 seconds without activity
        get().updateProgress({
          message: `⏳ Still working... (${totalElapsed}s elapsed)`,
          lastActivity: new Date()
        });
      }
    }, 3000); // Check every 3 seconds

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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Track messages by their IDs
      const messageMap = new Map<string, ChatMessage>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ Stream completed');
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (!data) continue;

            try {
              const event = JSON.parse(data);
              console.log('📨 Received event:', event.type, event);
              lastActivityTime = Date.now();

              if (event.type === 'TextMessageStart') {
                console.log('🆕 Creating new message:', event.messageId);
                lastActivityTime = Date.now();
                
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
                
                get().updateProgress({
                  status: 'generating',
                  message: '✨ Generating code...',
                  lastActivity: new Date()
                });
              } else if (event.type === 'TextMessageContent') {
                console.log('📝 Updating message:', event.messageId, 'Delta:', event.delta);
                lastActivityTime = Date.now();
                
                // Update the specific message by ID
                const messageId = event.messageId;

                set(state => ({
                  messages: state.messages.map(msg =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + event.delta }
                      : msg
                  )
                }));
                
                get().updateProgress({
                  lastActivity: new Date()
                });
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
              console.error('Failed to parse event:', e, 'Data:', data);
              // Continue processing other events even if one fails
            }
          }
        }
      }

      // Clear progress interval
      clearInterval(progressInterval);
      
      get().updateProgress({
        status: 'complete',
        message: '✅ Generation complete!',
        lastActivity: new Date()
      });
      
      // Clear progress after a short delay
      setTimeout(() => {
        get().clearProgress();
      }, 2000);

      set({ isLoading: false });

    } catch (error) {
      // Clear progress interval
      clearInterval(progressInterval);
      
      get().updateProgress({
        status: 'error',
        message: `❌ ${error instanceof Error ? error.message : 'Failed to send message'}`,
        lastActivity: new Date()
      });
      
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

