import { LLMRequest, LLMResponse, LLMConfig } from '@jp/shared';

/**
 * Base interface for LLM providers
 */
export interface ILLMProvider {
  /**
   * Send a completion request to the LLM
   */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Stream a completion request with callback for each chunk
   */
  streamComplete?(request: LLMRequest, onChunk: (chunk: string) => void): Promise<LLMResponse>;

  /**
   * Get provider name
   */
  getProviderName(): string;

  /**
   * Validate configuration
   */
  validateConfig(): boolean;
}

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  protected config: LLMConfig;
  
  constructor(config: LLMConfig) {
    this.config = config;
  }
  
  abstract complete(request: LLMRequest): Promise<LLMResponse>;
  
  abstract getProviderName(): string;
  
  validateConfig(): boolean {
    if (!this.config.apiKey && this.config.provider !== 'ollama') {
      return false;
    }
    if (!this.config.model) {
      return false;
    }
    return true;
  }
  
  /**
   * Merge request with default config
   */
  protected mergeWithDefaults(request: LLMRequest): LLMRequest {
    return {
      ...request,
      temperature: request.temperature ?? this.config.defaultTemperature ?? 0.7,
      maxTokens: request.maxTokens ?? this.config.defaultMaxTokens ?? 4000
    };
  }
}

