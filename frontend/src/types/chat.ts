/**
 * Chat Types - Frontend
 */

export enum ChatMode {
  AGENT = 'agent',
  CHAT = 'chat'
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  mode: ChatMode;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    codeGenerated?: boolean;
    error?: string;
  };
}

export interface ChatRequest {
  message: string;
  mode: ChatMode;
  projectId?: string;
  conversationHistory?: ChatMessage[];
  context?: {
    currentCode?: string;
    selectedElement?: string;
    viewport?: 'mobile' | 'tablet' | 'desktop';
  };
}

export interface ChatResponse {
  message: ChatMessage;
  generatedCode?: {
    html: string;
    css: string;
    js: string;
  };
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'code_update' | 'create_component' | 'add_page' | 'update_styles' | 'add_interaction';
  description: string;
  payload: any;
}

