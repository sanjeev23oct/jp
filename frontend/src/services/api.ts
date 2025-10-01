/**
 * API Service - HTTP client for backend communication
 */

import { ChatRequest, ChatResponse, ChatMessage } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Summarize a conversation
   */
  async summarizeConversation(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.summary;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    return response.json();
  }
}

export const apiService = new ApiService();

