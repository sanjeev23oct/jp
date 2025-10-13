/**
 * Chat Service - Handles chat interactions in both Agent and Chat modes
 */

import { LLMFactory } from '../llm';
import { ChatRequest, ChatResponse, ChatMessage, MessageRole, ChatMode } from '../types/chat.types';
import { generateChatResponse } from '../llm/prompts/chat-mode';
import { generateAgentPrompt } from '../llm/prompts/agent-mode';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private llm = LLMFactory.createLLM();

  /**
   * Process a chat message based on the mode
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      logger.info('Processing chat message', {
        mode: request.mode,
        messageLength: request.message.length,
        hasContext: !!request.context
      });

      if (request.mode === ChatMode.CHAT) {
        return await this.processChatMode(request);
      } else {
        return await this.processAgentMode(request);
      }
    } catch (error) {
      logger.error('Error processing chat message', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Process message in Chat Mode (conversational)
   */
  private async processChatMode(request: ChatRequest): Promise<ChatResponse> {
    const { systemPrompt, userPrompt } = generateChatResponse(
      request.message,
      request.context
    );

    // Build conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(request.conversationHistory || []).map(msg => ({
        role: (msg.role === MessageRole.USER ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await this.llm.complete({ messages });

    const chatMessage: ChatMessage = {
      id: uuidv4(),
      role: MessageRole.ASSISTANT,
      content: response.content,
      timestamp: new Date(),
      mode: ChatMode.CHAT,
      metadata: {
        tokensUsed: response.usage?.totalTokens,
        model: response.model
      }
    };

    // Extract suggestions if any
    const suggestions = this.extractSuggestions(response.content);

    return {
      message: chatMessage,
      suggestions
    };
  }

  /**
   * Process message in Agent Mode (code generation)
   */
  private async processAgentMode(request: ChatRequest): Promise<ChatResponse> {
    // Determine action type based on context
    const action = this.determineAgentAction(request);

    const { systemPrompt, userPrompt } = generateAgentPrompt(
      action,
      request.message,
      request.context?.currentCode
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await this.llm.complete({ messages });

    // Parse JSON response
    let generatedCode;
    let explanation = '';
    let suggestions: string[] = [];

    try {
      const parsed = this.parseAgentResponse(response.content);

      // Validate the parsed response has required fields
      if (!parsed.html && !parsed.css && !parsed.js) {
        throw new Error('Parsed response missing code fields');
      }

      generatedCode = {
        html: parsed.html || '',
        css: parsed.css || '',
        js: parsed.js || ''
      };
      explanation = parsed.explanation || 'Code generated successfully';
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

      logger.info('Successfully generated code', {
        htmlLength: generatedCode.html.length,
        cssLength: generatedCode.css.length,
        jsLength: generatedCode.js.length,
        suggestionsCount: suggestions.length
      });
    } catch (error) {
      logger.error('Failed to parse agent response', {
        error: error instanceof Error ? error.message : String(error),
        responsePreview: response.content.substring(0, 500)
      });

      // Fallback: treat entire response as HTML
      generatedCode = {
        html: response.content,
        css: '',
        js: ''
      };
      explanation = 'Generated code (parsing failed, using raw response)';
      suggestions = ['Try rephrasing your request', 'Be more specific about what you want'];
    }

    const chatMessage: ChatMessage = {
      id: uuidv4(),
      role: MessageRole.ASSISTANT,
      content: explanation,
      timestamp: new Date(),
      mode: ChatMode.AGENT,
      metadata: {
        tokensUsed: response.usage?.totalTokens,
        model: response.model,
        codeGenerated: true
      }
    };

    return {
      message: chatMessage,
      generatedCode,
      suggestions,
      actions: [{
        type: 'code_update',
        description: explanation,
        payload: generatedCode
      }]
    };
  }

  /**
   * Determine what action the agent should take
   */
  private determineAgentAction(request: ChatRequest): 'create' | 'modify' | 'fix' {
    const message = request.message.toLowerCase();
    
    if (request.context?.currentCode) {
      if (message.includes('fix') || message.includes('bug') || message.includes('error')) {
        return 'fix';
      }
      return 'modify';
    }
    
    return 'create';
  }

  /**
   * Parse agent response (expects JSON)
   */
  private parseAgentResponse(content: string): any {
    logger.info('Parsing agent response', { contentLength: content.length });

    // Strategy 1: Try direct JSON parse (if LLM followed instructions)
    try {
      const trimmed = content.trim();
      if (trimmed.startsWith('{')) {
        // Try to fix truncated JSON by adding closing braces
        let jsonStr = trimmed;
        if (!trimmed.endsWith('}')) {
          // Count opening and closing braces
          const openBraces = (trimmed.match(/\{/g) || []).length;
          const closeBraces = (trimmed.match(/\}/g) || []).length;
          const missing = openBraces - closeBraces;

          if (missing > 0) {
            logger.warn('JSON appears truncated, attempting to fix', { missing });
            // Close any open strings first
            if ((trimmed.match(/"/g) || []).length % 2 !== 0) {
              jsonStr += '"';
            }
            // Add missing closing braces
            jsonStr += '}'.repeat(missing);
          }
        }

        const parsed = JSON.parse(jsonStr);
        logger.info('Successfully parsed JSON directly');
        return parsed;
      }
    } catch (e) {
      logger.debug('Direct JSON parse failed, trying fallbacks', {
        error: e instanceof Error ? e.message : String(e)
      });
    }

    // Strategy 2: Extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        logger.info('Successfully parsed JSON from markdown block');
        return parsed;
      } catch (e) {
        logger.warn('Found JSON markdown block but failed to parse');
      }
    }

    // Strategy 3: Find first JSON object and try to fix it
    const objectMatch = content.match(/\{[\s\S]*$/);
    if (objectMatch) {
      try {
        let jsonStr = objectMatch[0];

        // Try to fix truncated JSON
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;

        if (openBraces > closeBraces) {
          // Close any open strings
          if ((jsonStr.match(/"/g) || []).length % 2 !== 0) {
            jsonStr += '"';
          }
          // Add missing closing braces
          jsonStr += '}'.repeat(openBraces - closeBraces);
        }

        const parsed = JSON.parse(jsonStr);
        logger.info('Successfully parsed and fixed JSON object from content');
        return parsed;
      } catch (e) {
        logger.warn('Found JSON-like object but failed to parse even after fixing');
      }
    }

    logger.error('All JSON parsing strategies failed', {
      contentPreview: content.substring(0, 500),
      contentEnd: content.substring(Math.max(0, content.length - 200))
    });
    throw new Error('Failed to parse agent response as JSON');
  }

  /**
   * Extract suggestions from chat response
   */
  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    
    // Look for bullet points or numbered lists
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.match(/^[\-\*\d\.]\s+/)) {
        const suggestion = line.replace(/^[\-\*\d\.]\s+/, '').trim();
        if (suggestion.length > 10 && suggestion.length < 100) {
          suggestions.push(suggestion);
        }
      }
    }
    
    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  /**
   * Get conversation summary (for context management)
   */
  async summarizeConversation(messages: ChatMessage[]): Promise<string> {
    if (messages.length === 0) return '';

    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const summary = await this.llm.complete({
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation in 2-3 sentences, focusing on the key points and decisions.'
        },
        {
          role: 'user',
          content: conversationText
        }
      ]
    });

    return summary.content;
  }
}

