/**
 * Error Message Mapper
 * Converts technical errors into user-friendly messages
 */

export class ErrorMessageMapper {
  static getUserFriendlyMessage(
    error: Error,
    context: { retryAttempt?: number; maxRetries?: number }
  ): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('econnreset') || message.includes('etimedout')) {
      if (context.retryAttempt && context.retryAttempt < context.maxRetries!) {
        return `⚠️ Generation took too long. Retrying with optimized settings (attempt ${context.retryAttempt + 1}/${context.maxRetries})...`;
      }
      return `❌ Generation timed out after ${context.maxRetries} attempts. Try simplifying your request or breaking it into smaller parts.`;
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return `⏸️ API rate limit reached. Waiting before retry...`;
    }
    
    if (message.includes('network') || message.includes('enotfound') || message.includes('econnrefused')) {
      return `🌐 Connection lost. Retrying...`;
    }
    
    if (message.includes('parse') || message.includes('json')) {
      return `⚠️ Received incomplete response. Using partial results. You may want to regenerate for complete code.`;
    }
    
    if (message.includes('token') || message.includes('length') || message.includes('too long')) {
      return `📏 Response too large. Try requesting a simpler version or specific features.`;
    }
    
    if (message.includes('401') || message.includes('unauthorized') || message.includes('api key')) {
      return `🔑 API authentication failed. Please check your API key configuration.`;
    }
    
    if (message.includes('503') || message.includes('service unavailable')) {
      return `🔧 LLM service temporarily unavailable. Retrying...`;
    }
    
    // Generic error
    return `❌ Generation failed: ${error.message}. Please try again or simplify your request.`;
  }
  
  static getSuggestions(error: Error): string[] {
    const message = error.message.toLowerCase();
    const suggestions: string[] = [];
    
    if (message.includes('timeout') || message.includes('length') || message.includes('too long')) {
      suggestions.push('Try requesting a simpler version');
      suggestions.push('Break your request into smaller parts');
      suggestions.push('Focus on core features first');
    }
    
    if (message.includes('parse') || message.includes('json')) {
      suggestions.push('Click "Try Again" to regenerate');
      suggestions.push('The partial code may still be usable');
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      suggestions.push('Wait a moment and try again');
      suggestions.push('Consider upgrading your API plan');
    }
    
    if (message.includes('network') || message.includes('enotfound')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the API endpoint is accessible');
    }
    
    if (message.includes('401') || message.includes('api key')) {
      suggestions.push('Verify your API key in .env file');
      suggestions.push('Check if your API key has expired');
    }
    
    return suggestions;
  }
}
