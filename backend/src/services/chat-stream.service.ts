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
import { JSONParser } from '../utils/json-parser';
import { RetryManager } from '../utils/retry-manager';
import { ErrorMessageMapper } from '../utils/error-message-mapper';
import { TimeoutManager } from '../utils/timeout-manager';
import { PromptOptimizer } from '../utils/prompt-optimizer';

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
      // Safely log error without circular references
      logger.error('Error in streaming processing', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
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

    // Step 2: Generate Code with Retry Logic
    const retryManager = new RetryManager({
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 16000,
      retryableErrors: ['timeout', 'econnreset', 'rate limit', 'network', 'enotfound', 'etimedout', 'parse', 'unterminated', 'truncated', 'incomplete']
    });

    // Select prompt strategy based on complexity
    const strategy = PromptOptimizer.selectStrategy(request.message);
    logger.info('Selected prompt strategy', { strategy: strategy.type });

    const messageId = uuidv4();

    while (true) {
      try {
        // Pass retry attempt to use more concise prompts on retries
        const currentStrategy = PromptOptimizer.selectStrategy(
          request.message, 
          retryManager.getAttemptNumber() - 1
        );
        
        await this.generateCodeWithStreaming(request, res, messageId, plan, currentStrategy.type);
        break; // Success, exit retry loop
      } catch (error) {
        const err = error as Error;
        
        // Log the actual error for debugging
        logger.error('Generation attempt failed', {
          message: err.message,
          stack: err.stack,
          attempt: retryManager.getAttemptNumber()
        });
        
        if (!retryManager.shouldRetry(err)) {
          // Not retryable or max attempts reached
          logger.error('Generation failed after retries', {
            error: err.message,
            attempts: retryManager.getAttemptNumber()
          });
          
          // Get user-friendly error message
          const friendlyMessage = ErrorMessageMapper.getUserFriendlyMessage(err, {
            retryAttempt: retryManager.getAttemptNumber() - 1,
            maxRetries: retryManager.getTotalAttempts()
          });
          
          const suggestions = ErrorMessageMapper.getSuggestions(err);
          
          // Send error message
          this.sendEvent(res, 'TextMessageContent', {
            type: 'TextMessageContent',
            messageId,
            delta: `\n\n${friendlyMessage}\n\n${suggestions.length > 0 ? `**Suggestions:**\n${suggestions.map(s => `- ${s}`).join('\n')}\n` : ''}`,
            timestamp: new Date().toISOString()
          });
          
          this.sendEvent(res, 'TextMessageEnd', {
            type: 'TextMessageEnd',
            messageId,
            timestamp: new Date().toISOString()
          });
          
          throw err;
        }
        
        // Notify user of retry with friendly message
        const delay = retryManager.getDelay();
        const retryMessage = ErrorMessageMapper.getUserFriendlyMessage(err, {
          retryAttempt: retryManager.getAttemptNumber() - 1,
          maxRetries: retryManager.getTotalAttempts()
        });
        
        this.sendEvent(res, 'TextMessageContent', {
          type: 'TextMessageContent',
          messageId,
          delta: `\n\n${retryMessage}\n\nWaiting ${delay / 1000}s before retry...\n\n`,
          timestamp: new Date().toISOString()
        });
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        retryManager.incrementAttempt();
      }
    }
  }

  /**
   * Generate code with streaming (extracted for retry logic)
   */
  private async generateCodeWithStreaming(
    request: ChatRequest,
    res: Response,
    messageId: string,
    plan: any,
    strategy: 'standard' | 'concise' | 'minimal' = 'standard'
  ) {

    const { systemPrompt, userPrompt } = generateAgentPrompt(
      request.message,
      { ...request.context, plan, strategy }
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

    // Initialize timeout manager
    const timeoutManager = new TimeoutManager({
      initial: 120000,      // 2 minutes
      perRetry: 60000,      // +1 minute per retry
      maximum: 600000,      // 10 minutes max
      activityWindow: 30000 // 30 seconds without data
    });

    // Stream response from LLM with real-time updates
    // DeepSeek-V2 supports max 8192 output tokens
    const response = await this.llm.streamComplete?.({
      messages,
      maxTokens: 8192 // DeepSeek max output tokens
    }, (chunk: string) => {
      // Accumulate content silently
      accumulatedContent += chunk;
      
      // Record activity for timeout monitoring
      timeoutManager.recordActivity();

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
      maxTokens: 8192 // Match streaming limit
    });

    const content = response?.content || accumulatedContent;

    logger.info('Received LLM response', {
      contentLength: content.length,
      finishReason: response?.finishReason,
      usage: response?.usage
    });
    
    // Check if we hit the token limit
    if (response?.finishReason === 'length') {
      logger.warn('Response truncated due to token limit', {
        maxTokens: 8192,
        contentLength: content.length
      });
    }
    
    logger.debug('LLM response preview', { preview: content.substring(0, 500) });

    // Try to parse as JSON for code generation
    try {
      const parsed = this.parseAgentResponse(content);
      
      // Check if response was partial
      const isPartial = parsed.explanation?.includes('partial response');
      
      logger.info('Successfully parsed agent response', {
        hasHtml: !!parsed.html,
        hasCss: !!parsed.css,
        hasJs: !!parsed.js,
        isPartial
      });
      
      if (isPartial) {
        logger.warn('Partial response detected and recovered', {
          htmlLength: parsed.html?.length || 0,
          cssLength: parsed.css?.length || 0,
          jsLength: parsed.js?.length || 0
        });
      }

      // Check if we have any usable content (html field exists, even if empty)
      if ('html' in parsed) {
        // Save to cache for future mock use (only if html has content)
        if (parsed.html) {
          responseCacheService.saveResponse(request.message, {
            html: parsed.html,
            css: parsed.css || '',
            js: parsed.js || '',
            explanation: parsed.explanation || '',
            suggestions: parsed.suggestions || []
          });
        }

        // Format detailed implementation summary
        const explanation = parsed.explanation || 'Code generated successfully!';
        const suggestions = parsed.suggestions || [];
        
        // Add warning if partial response or empty html
        let partialWarning = '';
        if (isPartial) {
          partialWarning = `\n\n⚠️ **Note:** Response was incomplete but recovered. The code may be missing some features. Consider regenerating if needed.\n`;
        }
        if (!parsed.html || parsed.html.trim() === '') {
          partialWarning += `\n\n⚠️ **Warning:** No HTML content was generated. Please try again with a different request.\n`;
        }

        const summaryText = `\n\n✅ **Implementation Complete!**

${explanation}${partialWarning}

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
      
      throw e; // Re-throw for retry logic
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
   * Parse agent response with recovery for incomplete JSON
   */
  private parseAgentResponse(content: string): any {
    const result = JSONParser.parseWithRecovery(content);
    
    if (!result.success) {
      logger.error('Failed to parse agent response', { error: result.error });
      throw new Error(result.error || 'Failed to parse response');
    }
    
    if (result.isPartial) {
      logger.warn('Parsed partial/incomplete response', {
        missingFields: result.missingFields
      });
    }
    
    // Fill in missing fields with defaults
    const data = result.data;
    if (!data.html) data.html = '';
    if (!data.css) data.css = '';
    if (!data.js) data.js = '';
    if (!data.explanation) data.explanation = result.isPartial 
      ? 'Code generated (partial response - may be incomplete)'
      : 'Code generated successfully';
    if (!data.suggestions) data.suggestions = [];
    
    // Add warning to suggestions if partial
    if (result.isPartial) {
      data.suggestions.unshift('Response was incomplete - consider regenerating for full code');
    }
    
    return data;
  }
}

