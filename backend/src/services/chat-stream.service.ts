/**
 * Chat Stream Service - AG-UI Protocol Implementation
 * Handles streaming responses using Server-Sent Events
 */

import { Response } from 'express';
import { LLMFactory } from '../llm';
import { ChatRequest, ChatMode, MessageRole } from '../types/chat.types';
import { generateChatResponse } from '../llm/prompts/chat-mode';
import { generateAgentPrompt, generatePlanPrompt } from '../llm/prompts/agent-mode';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { responseCacheService } from './response-cache.service';

export class ChatStreamService {
  private llm = LLMFactory.createLLM();

  /**
   * Send an AG-UI event via SSE
   */
  private sendEvent(res: Response, eventType: string, data: any) {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Force flush to ensure immediate delivery
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  }

  /**
   * Process streaming message
   */
  async processStreamingMessage(request: ChatRequest, res: Response) {
    const runId = uuidv4();
    const threadId = request.projectId || uuidv4();

    try {
      // Send RunStarted event
      this.sendEvent(res, 'RunStarted', {
        type: 'RunStarted',
        threadId,
        runId,
        timestamp: new Date().toISOString()
      });

      if (request.mode === ChatMode.AGENT) {
        await this.processAgentModeStreaming(request, res, runId, threadId);
      } else {
        await this.processChatModeStreaming(request, res, runId, threadId);
      }

      // Send RunFinished event
      this.sendEvent(res, 'RunFinished', {
        type: 'RunFinished',
        threadId,
        runId,
        timestamp: new Date().toISOString()
      });

      res.end();

    } catch (error) {
      logger.error('Error in streaming processing', { error });
      
      // Send RunError event
      this.sendEvent(res, 'RunError', {
        type: 'RunError',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      res.end();
    }
  }

  /**
   * Process Agent Mode with streaming
   */
  private async processAgentModeStreaming(
    request: ChatRequest,
    res: Response,
    runId: string,
    threadId: string
  ) {
    // Step 1: Generate Plan
    const planMessageId = uuidv4();

    logger.info('Sending TextMessageStart for plan', { planMessageId });
    this.sendEvent(res, 'TextMessageStart', {
      type: 'TextMessageStart',
      messageId: planMessageId,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

    logger.info('Sending initial analyzing message');
    this.sendEvent(res, 'TextMessageContent', {
      type: 'TextMessageContent',
      messageId: planMessageId,
      delta: '🎯 **Analyzing your request...**\n\n',
      timestamp: new Date().toISOString()
    });

    // Generate plan
    const { systemPrompt: planSystemPrompt, userPrompt: planUserPrompt } = generatePlanPrompt(request.message);
    const planMessages = [
      { role: 'system' as const, content: planSystemPrompt },
      { role: 'user' as const, content: planUserPrompt }
    ];

    logger.info('Generating implementation plan', { message: request.message.substring(0, 50) });
    const planResponse = await this.llm.complete({ messages: planMessages });

    let plan: any = null;
    try {
      plan = JSON.parse(planResponse.content);

      // Stream the plan to user
      const planText = `📋 **Implementation Plan:**

**Understanding:** ${plan.understanding}

**Components to Build:**
${plan.components?.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

**Key Features:**
${plan.features?.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

${plan.dataModel ? `**Data Model:** ${plan.dataModel}\n\n` : ''}**Tech Stack:** ${plan.techStack?.join(', ')}

**Complexity:** ${plan.estimatedComplexity}

---

✨ **Now generating your prototype...**
`;

      this.sendEvent(res, 'TextMessageContent', {
        type: 'TextMessageContent',
        messageId: planMessageId,
        delta: planText,
        timestamp: new Date().toISOString()
      });

    } catch (e) {
      logger.warn('Failed to parse plan, continuing with generation', { error: e });
      this.sendEvent(res, 'TextMessageContent', {
        type: 'TextMessageContent',
        messageId: planMessageId,
        delta: '✨ **Generating your prototype...**\n\n',
        timestamp: new Date().toISOString()
      });
    }

    this.sendEvent(res, 'TextMessageEnd', {
      type: 'TextMessageEnd',
      messageId: planMessageId,
      timestamp: new Date().toISOString()
    });

    // Step 2: Generate Code
    const messageId = uuidv4();

    const { systemPrompt, userPrompt } = generateAgentPrompt(
      request.message,
      { ...request.context, plan }
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(request.conversationHistory || []).map(msg => ({
        role: (msg.role === MessageRole.USER ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: userPrompt }
    ];

    logger.info('Sending streaming request to LLM', {
      model: this.llm.constructor.name,
      messageCount: messages.length
    });

    // Send a "generating" status message
    this.sendEvent(res, 'TextMessageStart', {
      type: 'TextMessageStart',
      messageId,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

    this.sendEvent(res, 'TextMessageContent', {
      type: 'TextMessageContent',
      messageId,
      delta: '✨ **Generating your prototype...**\n\n',
      timestamp: new Date().toISOString()
    });

    let accumulatedContent = '';
    let lastProgressUpdate = Date.now();

    // Stream response from LLM with real-time updates
    const response = await this.llm.streamComplete?.({
      messages,
      maxTokens: 8192 // Maximum for DeepSeek
    }, (chunk: string) => {
      // Accumulate content silently
      accumulatedContent += chunk;

      // Send progress updates every 2 seconds
      const now = Date.now();
      if (now - lastProgressUpdate > 2000) {
        this.sendEvent(res, 'TextMessageContent', {
          type: 'TextMessageContent',
          messageId,
          delta: '.',
          timestamp: new Date().toISOString()
        });
        lastProgressUpdate = now;
      }
    }) || await this.llm.complete({
      messages,
      maxTokens: 8192
    });

    const content = response?.content || accumulatedContent;

    logger.info('Received LLM response', {
      contentLength: content.length,
      finishReason: response?.finishReason,
      usage: response?.usage
    });
    logger.debug('LLM response preview', { preview: content.substring(0, 500) });

    // Try to parse as JSON for code generation
    try {
      const parsed = this.parseAgentResponse(content);
      logger.info('Successfully parsed agent response', {
        hasHtml: !!parsed.html,
        hasCss: !!parsed.css,
        hasJs: !!parsed.js
      });

      if (parsed.html) {
        // Save to cache for future mock use
        responseCacheService.saveResponse(request.message, {
          html: parsed.html,
          css: parsed.css || '',
          js: parsed.js || '',
          explanation: parsed.explanation || '',
          suggestions: parsed.suggestions || []
        });

        // Format detailed implementation summary
        const explanation = parsed.explanation || 'Code generated successfully!';
        const suggestions = parsed.suggestions || [];

        const summaryText = `\n\n✅ **Implementation Complete!**

${explanation}

${suggestions.length > 0 ? `**Next Steps & Suggestions:**
${suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}` : ''}

💡 **Tip:** Click the "💻 View Code" button to see the generated HTML, CSS, and JavaScript!
`;

        // Update the existing message with the summary
        this.sendEvent(res, 'TextMessageContent', {
          type: 'TextMessageContent',
          messageId,
          delta: summaryText,
          timestamp: new Date().toISOString()
        });

        // Send TextMessageEnd
        this.sendEvent(res, 'TextMessageEnd', {
          type: 'TextMessageEnd',
          messageId,
          timestamp: new Date().toISOString()
        });

        // Send custom event with generated code
        this.sendEvent(res, 'Custom', {
          type: 'Custom',
          name: 'code_generated',
          value: {
            html: parsed.html,
            css: parsed.css || '',
            js: parsed.js || '',
            explanation: parsed.explanation || '',
            suggestions: parsed.suggestions || []
          },
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('No HTML in response');
      }
    } catch (e) {
      logger.error('Failed to parse agent response', {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        contentPreview: content.substring(0, 1000)
      });

      // Send error message
      this.sendEvent(res, 'TextMessageStart', {
        type: 'TextMessageStart',
        messageId,
        role: 'assistant',
        timestamp: new Date().toISOString()
      });

      this.sendEvent(res, 'TextMessageContent', {
        type: 'TextMessageContent',
        messageId,
        delta: 'Sorry, I had trouble generating the code. Please try again with a simpler request.',
        timestamp: new Date().toISOString()
      });

      this.sendEvent(res, 'TextMessageEnd', {
        type: 'TextMessageEnd',
        messageId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Process Chat Mode with streaming
   */
  private async processChatModeStreaming(
    request: ChatRequest,
    res: Response,
    runId: string,
    threadId: string
  ) {
    const messageId = uuidv4();
    
    // Send TextMessageStart
    this.sendEvent(res, 'TextMessageStart', {
      type: 'TextMessageStart',
      messageId,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

    const { systemPrompt, userPrompt } = generateChatResponse(
      request.message,
      request.context
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(request.conversationHistory || []).map(msg => ({
        role: (msg.role === MessageRole.USER ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await this.llm.complete({ messages });
    const content = response.content;

    // Stream the content in chunks
    const chunkSize = 100;
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, Math.min(i + chunkSize, content.length));
      
      this.sendEvent(res, 'TextMessageContent', {
        type: 'TextMessageContent',
        messageId,
        delta: chunk,
        timestamp: new Date().toISOString()
      });

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Send TextMessageEnd
    this.sendEvent(res, 'TextMessageEnd', {
      type: 'TextMessageEnd',
      messageId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Parse agent response (same logic as non-streaming)
   */
  private parseAgentResponse(content: string): any {
    const trimmed = content.trim();

    // Remove markdown code blocks if present
    let cleanContent = trimmed;
    if (trimmed.startsWith('```')) {
      cleanContent = trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    if (cleanContent.startsWith('{')) {
      // Find the actual end of the JSON object by counting braces
      let depth = 0;
      let inString = false;
      let escape = false;
      let jsonEnd = -1;

      for (let i = 0; i < cleanContent.length; i++) {
        const char = cleanContent[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
      }

      let jsonStr = jsonEnd > 0 ? cleanContent.substring(0, jsonEnd) : cleanContent;

      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        logger.error('JSON parse error', {
          error: e instanceof Error ? e.message : String(e),
          jsonPreview: jsonStr.substring(0, 500),
          jsonEnd
        });
        throw e;
      }
    }

    throw new Error('Not valid JSON - content does not start with {');
  }
}

