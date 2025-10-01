import { LLMProvider, LLMConfig } from '@jp/shared';
import { ILLMProvider } from './base';
import { DeepSeekProvider } from './providers/deepseek';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';
import logger from '../utils/logger';

/**
 * Factory for creating LLM provider instances
 */
export class LLMProviderFactory {
  private static instance: ILLMProvider | null = null;
  
  /**
   * Create or get LLM provider instance
   */
  static getProvider(config: LLMConfig): ILLMProvider {
    // Return cached instance if provider hasn't changed
    if (this.instance && this.instance.getProviderName().toLowerCase() === config.provider) {
      return this.instance;
    }
    
    logger.info('Creating LLM provider', { provider: config.provider });
    
    switch (config.provider) {
      case 'deepseek':
        this.instance = new DeepSeekProvider(config);
        break;
      case 'openai':
        this.instance = new OpenAIProvider(config);
        break;
      case 'anthropic':
        this.instance = new AnthropicProvider(config);
        break;
      case 'ollama':
        this.instance = new OllamaProvider(config);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
    
    if (!this.instance.validateConfig()) {
      throw new Error(`Invalid configuration for provider: ${config.provider}`);
    }
    
    return this.instance;
  }
  
  /**
   * Reset the cached instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}

