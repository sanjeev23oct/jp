# Design Document

## Overview

This design focuses on improving the existing streaming implementation to handle large prototype generation reliably. The current system has streaming in place but needs enhancements in timeout handling, retry logic, incomplete response handling, and user feedback.

### Core Design Principles

1. **Fail Gracefully**: Preserve partial results when possible
2. **Retry Automatically**: Don't make users manually retry
3. **Keep Users Informed**: Show progress and clear error messages
4. **Optimize for Success**: Use smarter prompts for large requests

## Architecture

### Current System (What Works)

```
User Request → ChatStreamService → LLM Provider (streamComplete)
                                  ↓
                            SSE Stream → Frontend
                                  ↓
                            Parse JSON → Update Editor
```

**Existing Components:**
- ✅ `ChatStreamService` - Handles SSE streaming
- ✅ `streamComplete()` - Streams LLM responses
- ✅ Frontend SSE consumer in `useChatStore`
- ✅ Progress dots during generation

### What Needs Improvement

1. **Timeout Handling** - Current: 600s fixed timeout
2. **Retry Logic** - Current: None
3. **Incomplete JSON** - Current: Fails completely
4. **Error Messages** - Current: Generic errors
5. **Progress Feedback** - Current: Just dots

## Components and Interfaces

### 1. Enhanced Timeout Manager

**Service**: Add to `ChatStreamService`

**Purpose**: Manage dynamic timeouts based on request complexity

**Interface**:
```typescript
interface TimeoutConfig {
  initial: number;      // Initial timeout (e.g., 120s)
  perRetry: number;     // Additional time per retry (e.g., +60s)
  maximum: number;      // Max timeout (e.g., 600s)
  activityWindow: number; // Time without data before timeout (e.g., 30s)
}

class TimeoutManager {
  private config: TimeoutConfig;
  private lastActivity: number;
  private timeoutHandle: NodeJS.Timeout | null;
  
  constructor(config: TimeoutConfig) {
    this.config = config;
    this.lastActivity = Date.now();
  }
  
  // Update activity timestamp when data is received
  recordActivity(): void {
    this.lastActivity = Date.now();
  }
  
  // Check if we should timeout
  shouldTimeout(): boolean {
    return Date.now() - this.lastActivity > this.config.activityWindow * 1000;
  }
  
  // Get timeout for current retry attempt
  getTimeout(retryAttempt: number): number {
    const timeout = this.config.initial + (retryAttempt * this.config.perRetry);
    return Math.min(timeout, this.config.maximum);
  }
}
```

**Usage in ChatStreamService**:
```typescript
private async processAgentModeStreaming(...) {
  const timeoutManager = new TimeoutManager({
    initial: 120000,      // 2 minutes
    perRetry: 60000,      // +1 minute per retry
    maximum: 600000,      // 10 minutes max
    activityWindow: 30000 // 30 seconds without data
  });
  
  // Monitor activity during streaming
  const response = await this.llm.streamComplete({...}, (chunk) => {
    timeoutManager.recordActivity();
    // ... existing chunk handling
  });
}
```


### 2. Retry Logic with Exponential Backoff

**Service**: Add to `ChatStreamService`

**Purpose**: Automatically retry failed requests with intelligent backoff

**Interface**:
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;      // Base delay in ms (e.g., 2000)
  maxDelay: number;       // Max delay in ms (e.g., 16000)
  retryableErrors: string[]; // Error types that should trigger retry
}

class RetryManager {
  private config: RetryConfig;
  private attempt: number = 0;
  
  constructor(config: RetryConfig) {
    this.config = config;
  }
  
  shouldRetry(error: Error): boolean {
    if (this.attempt >= this.config.maxAttempts) {
      return false;
    }
    
    // Check if error is retryable
    const errorMessage = error.message.toLowerCase();
    return this.config.retryableErrors.some(e => errorMessage.includes(e));
  }
  
  getDelay(): number {
    // Exponential backoff: 2s, 4s, 8s, 16s
    const delay = this.config.baseDelay * Math.pow(2, this.attempt);
    return Math.min(delay, this.config.maxDelay);
  }
  
  incrementAttempt(): void {
    this.attempt++;
  }
  
  getAttemptNumber(): number {
    return this.attempt + 1;
  }
}
```

**Usage Pattern**:
```typescript
private async processAgentModeStreaming(...) {
  const retryManager = new RetryManager({
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 16000,
    retryableErrors: ['timeout', 'econnreset', 'rate limit', 'network']
  });
  
  while (true) {
    try {
      // Attempt generation
      await this.generateCode(...);
      break; // Success, exit loop
      
    } catch (error) {
      if (!retryManager.shouldRetry(error)) {
        throw error; // Not retryable or max attempts reached
      }
      
      // Notify user of retry
      this.sendEvent(res, 'TextMessageContent', {
        type: 'TextMessageContent',
        messageId,
        delta: `\n\n⚠️ Generation interrupted. Retrying (attempt ${retryManager.getAttemptNumber()}/${retryManager.config.maxAttempts})...\n\n`,
        timestamp: new Date().toISOString()
      });
      
      // Wait before retry
      const delay = retryManager.getDelay();
      await new Promise(resolve => setTimeout(resolve, delay));
      
      retryManager.incrementAttempt();
    }
  }
}
```


### 3. Incomplete JSON Handler

**Service**: Enhance existing `parseAgentResponse` in `ChatStreamService`

**Purpose**: Salvage partial responses when JSON is truncated

**Enhanced Implementation**:
```typescript
interface ParseResult {
  success: boolean;
  data?: any;
  isPartial: boolean;
  missingFields: string[];
  error?: string;
}

class JSONParser {
  /**
   * Parse JSON with automatic completion of truncated responses
   */
  static parseWithRecovery(content: string): ParseResult {
    const trimmed = content.trim();
    
    // Remove markdown code blocks
    let cleanContent = trimmed;
    if (trimmed.startsWith('```')) {
      cleanContent = trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    if (!cleanContent.startsWith('{')) {
      return {
        success: false,
        isPartial: false,
        missingFields: [],
        error: 'Content does not start with {'
      };
    }
    
    // Try direct parse first
    try {
      const parsed = JSON.parse(cleanContent);
      return {
        success: true,
        data: parsed,
        isPartial: false,
        missingFields: []
      };
    } catch (e) {
      // JSON is malformed, try to fix it
    }
    
    // Attempt to complete truncated JSON
    const completed = this.completeJSON(cleanContent);
    
    try {
      const parsed = JSON.parse(completed.json);
      const missingFields = this.checkRequiredFields(parsed);
      
      return {
        success: true,
        data: parsed,
        isPartial: completed.wasModified,
        missingFields
      };
    } catch (e) {
      return {
        success: false,
        isPartial: true,
        missingFields: [],
        error: `Failed to parse even after completion: ${e.message}`
      };
    }
  }
  
  /**
   * Complete truncated JSON by adding missing closing braces/quotes
   */
  private static completeJSON(json: string): { json: string; wasModified: boolean } {
    let completed = json;
    let wasModified = false;
    
    // Count braces
    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    
    // Check if we're in an unclosed string
    const quotes = (json.match(/"/g) || []).length;
    if (quotes % 2 !== 0) {
      completed += '"';
      wasModified = true;
    }
    
    // Add missing closing braces
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      completed += '}'.repeat(missing);
      wasModified = true;
    }
    
    return { json: completed, wasModified };
  }
  
  /**
   * Check if required fields are present
   */
  private static checkRequiredFields(parsed: any): string[] {
    const required = ['html', 'css', 'js'];
    const missing: string[] = [];
    
    for (const field of required) {
      if (!parsed[field]) {
        missing.push(field);
      }
    }
    
    return missing;
  }
}
```

**Usage in ChatStreamService**:
```typescript
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
  if (!data.explanation) data.explanation = 'Code generated (partial response)';
  if (!data.suggestions) data.suggestions = [];
  
  return data;
}
```


### 4. Enhanced Progress Feedback

**Frontend Component**: Enhance `useChatStore`

**Purpose**: Show detailed progress during long operations

**Interface**:
```typescript
interface GenerationProgress {
  status: 'planning' | 'generating' | 'parsing' | 'complete' | 'error' | 'retrying';
  message: string;
  startTime: Date;
  lastActivity: Date;
  retryAttempt?: number;
  maxRetries?: number;
}

// Add to ChatState
interface ChatState {
  // ... existing fields
  generationProgress: GenerationProgress | null;
  
  // Actions
  updateProgress: (progress: Partial<GenerationProgress>) => void;
  clearProgress: () => void;
}
```

**Progress Messages**:
```typescript
const progressMessages = {
  planning: '🎯 Analyzing your request...',
  generating: '✨ Generating your prototype...',
  parsing: '📦 Processing generated code...',
  retrying: (attempt: number, max: number) => 
    `⚠️ Retrying generation (attempt ${attempt}/${max})...`,
  stillWorking: (elapsed: number) => 
    `⏳ Still working... (${Math.floor(elapsed / 1000)}s elapsed)`,
  complete: '✅ Generation complete!',
  error: (message: string) => `❌ Error: ${message}`
};
```

**Progress Monitor**:
```typescript
// In useChatStore.sendMessage()
const startTime = Date.now();
let lastActivityTime = Date.now();

// Start progress monitoring
const progressInterval = setInterval(() => {
  const elapsed = Date.now() - lastActivityTime;
  
  if (elapsed > 10000) { // 10 seconds without activity
    set(state => ({
      generationProgress: {
        ...state.generationProgress!,
        message: progressMessages.stillWorking(Date.now() - startTime)
      }
    }));
  }
}, 3000); // Check every 3 seconds

// Update lastActivityTime when receiving events
if (event.type === 'TextMessageContent') {
  lastActivityTime = Date.now();
}

// Clear interval when done
clearInterval(progressInterval);
```


### 5. Prompt Optimization for Large Requests

**Service**: Enhance `agent-mode.ts` prompts

**Purpose**: Use more concise prompts for complex requests

**Strategy**:
```typescript
interface PromptStrategy {
  type: 'standard' | 'concise' | 'minimal';
  maxTokens: number;
  focusAreas: string[];
}

class PromptOptimizer {
  static selectStrategy(request: string): PromptStrategy {
    const complexity = this.assessComplexity(request);
    
    if (complexity > 0.7) {
      return {
        type: 'minimal',
        maxTokens: 8192,
        focusAreas: ['core functionality', 'essential features only']
      };
    } else if (complexity > 0.4) {
      return {
        type: 'concise',
        maxTokens: 6144,
        focusAreas: ['working prototype', 'key features']
      };
    } else {
      return {
        type: 'standard',
        maxTokens: 4096,
        focusAreas: ['complete implementation']
      };
    }
  }
  
  private static assessComplexity(request: string): number {
    let score = 0;
    const lower = request.toLowerCase();
    
    // Keywords indicating complexity
    const complexKeywords = ['dashboard', 'crm', 'admin', 'management', 'system', 'platform'];
    const featureKeywords = ['crud', 'search', 'filter', 'sort', 'chart', 'graph', 'table'];
    
    complexKeywords.forEach(keyword => {
      if (lower.includes(keyword)) score += 0.2;
    });
    
    featureKeywords.forEach(keyword => {
      if (lower.includes(keyword)) score += 0.1;
    });
    
    // Word count
    const wordCount = request.split(/\s+/).length;
    if (wordCount > 50) score += 0.2;
    if (wordCount > 100) score += 0.2;
    
    return Math.min(score, 1.0);
  }
}
```

**Concise Prompt Template**:
```typescript
export const AGENT_MODE_CREATE_PROMPT_CONCISE = (description: string) => {
  return `Create a working HTML prototype for: ${description}

CRITICAL - KEEP IT CONCISE:
1. Focus on CORE functionality only
2. Minimize comments - code should be self-explanatory
3. Use compact, production-ready code
4. Prioritize working features over extensive styling
5. Include only essential JavaScript
6. If data-driven, use localStorage (simpler than IndexedDB)
7. Generate 5-10 sample records (not 20-50)

OUTPUT (JSON only, no markdown):
{
  "html": "body content only",
  "css": "essential styles",
  "js": "core functionality",
  "explanation": "brief summary",
  "suggestions": ["next step 1", "next step 2"]
}`;
};

export const AGENT_MODE_CREATE_PROMPT_MINIMAL = (description: string) => {
  return `Create minimal viable prototype: ${description}

ULTRA-CONCISE MODE:
- Core features ONLY
- Minimal styling (functional, not fancy)
- Essential JavaScript only
- 3-5 sample records max
- No comments unless critical
- Compact code

JSON output only:
{"html":"...","css":"...","js":"...","explanation":"...","suggestions":[]}`;
};
```

**Usage**:
```typescript
const strategy = PromptOptimizer.selectStrategy(request.message);

let promptFunction;
if (strategy.type === 'minimal') {
  promptFunction = AGENT_MODE_CREATE_PROMPT_MINIMAL;
} else if (strategy.type === 'concise') {
  promptFunction = AGENT_MODE_CREATE_PROMPT_CONCISE;
} else {
  promptFunction = AGENT_MODE_CREATE_PROMPT; // existing
}

const userPrompt = promptFunction(request.message);
```


### 6. Enhanced Error Messages

**Service**: Add to `ChatStreamService`

**Purpose**: Provide clear, actionable error messages

**Error Message Mapper**:
```typescript
class ErrorMessageMapper {
  static getUserFriendlyMessage(error: Error, context: { retryAttempt?: number; maxRetries?: number }): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('econnreset')) {
      if (context.retryAttempt && context.retryAttempt < context.maxRetries!) {
        return `⚠️ Generation took too long. Retrying with optimized settings (attempt ${context.retryAttempt + 1}/${context.maxRetries})...`;
      }
      return `❌ Generation timed out after ${context.maxRetries} attempts. Try simplifying your request or breaking it into smaller parts.`;
    }
    
    if (message.includes('rate limit')) {
      return `⏸️ API rate limit reached. Waiting before retry...`;
    }
    
    if (message.includes('network') || message.includes('enotfound')) {
      return `🌐 Connection lost. Retrying...`;
    }
    
    if (message.includes('parse') || message.includes('json')) {
      return `⚠️ Received incomplete response. Using partial results. You may want to regenerate for complete code.`;
    }
    
    if (message.includes('token') || message.includes('length')) {
      return `📏 Response too large. Try requesting a simpler version or specific features.`;
    }
    
    // Generic error
    return `❌ Generation failed: ${error.message}. Please try again or simplify your request.`;
  }
  
  static getSuggestions(error: Error): string[] {
    const message = error.message.toLowerCase();
    const suggestions: string[] = [];
    
    if (message.includes('timeout') || message.includes('length')) {
      suggestions.push('Try requesting a simpler version');
      suggestions.push('Break your request into smaller parts');
      suggestions.push('Focus on core features first');
    }
    
    if (message.includes('parse')) {
      suggestions.push('Click "Try Again" to regenerate');
      suggestions.push('The partial code may still be usable');
    }
    
    if (message.includes('rate limit')) {
      suggestions.push('Wait a moment and try again');
      suggestions.push('Consider upgrading your API plan');
    }
    
    return suggestions;
  }
}
```

**Usage in Error Handling**:
```typescript
catch (error) {
  const friendlyMessage = ErrorMessageMapper.getUserFriendlyMessage(error, {
    retryAttempt: retryManager.getAttemptNumber() - 1,
    maxRetries: retryManager.config.maxAttempts
  });
  
  const suggestions = ErrorMessageMapper.getSuggestions(error);
  
  // Send user-friendly error message
  this.sendEvent(res, 'TextMessageContent', {
    type: 'TextMessageContent',
    messageId,
    delta: `\n\n${friendlyMessage}\n\n${suggestions.length > 0 ? `**Suggestions:**\n${suggestions.map(s => `- ${s}`).join('\n')}` : ''}`,
    timestamp: new Date().toISOString()
  });
}
```


## Implementation Strategy

### Phase 1: Core Reliability (Priority: High)
1. Implement incomplete JSON handler
2. Add retry logic with exponential backoff
3. Enhance error messages
4. Add timeout monitoring

### Phase 2: User Experience (Priority: Medium)
1. Add progress feedback
2. Implement "still working" messages
3. Add retry attempt indicators
4. Show estimated time remaining

### Phase 3: Optimization (Priority: Low)
1. Implement prompt optimization
2. Add complexity detection
3. Create concise prompt templates
4. Add automatic prompt simplification on retry

## Testing Strategy

### Unit Tests
1. Test JSON completion logic with various truncated inputs
2. Test retry logic with different error types
3. Test timeout calculation
4. Test error message mapping

### Integration Tests
1. Test full generation flow with simulated timeout
2. Test retry flow with mock LLM failures
3. Test partial response handling
4. Test progress updates

### Manual Testing
1. Generate large CRM dashboard
2. Test with intentional network interruption
3. Test with rate limit simulation
4. Verify error messages are clear and helpful

## Success Metrics

1. **Reliability**
   - 95%+ success rate for large prototypes
   - <5% complete failures (no partial results)
   - Automatic recovery from 80%+ of transient errors

2. **User Experience**
   - Clear progress indication within 3 seconds
   - Error messages actionable 100% of the time
   - Retry success rate >60%

3. **Performance**
   - Average generation time <2 minutes for complex prototypes
   - Timeout rate <10%
   - Retry overhead <30 seconds

## Rollout Plan

1. **Deploy to staging** - Test with various prototype sizes
2. **Monitor metrics** - Track timeout rate, retry success, user feedback
3. **Gradual rollout** - Enable for 10%, 50%, 100% of users
4. **Gather feedback** - Collect user reports on reliability
5. **Iterate** - Adjust timeouts, retry logic based on data

## Conclusion

These focused improvements to the existing streaming implementation will significantly improve reliability for large prototype generation without requiring a complete architectural overhaul. The key is handling failures gracefully, retrying automatically, and keeping users informed throughout the process.
