import axios from 'axios';
import { LLMRequest, LLMResponse } from '@jp/shared';
import { BaseLLMProvider } from '../base';
import logger from '../../utils/logger';

export class OllamaProvider extends BaseLLMProvider {
  getProviderName(): string {
    return 'Ollama';
  }
  
  validateConfig(): boolean {
    // Ollama doesn't require an API key
    return !!this.config.model;
  }
  
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const mergedRequest = this.mergeWithDefaults(request);
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    try {
      logger.info('Sending request to Ollama', {
        model: this.config.model,
        messageCount: mergedRequest.messages.length
      });
      
      const response = await axios.post(
        `${baseUrl}/api/chat`,
        {
          model: this.config.model,
          messages: mergedRequest.messages,
          options: {
            temperature: mergedRequest.temperature,
            num_predict: mergedRequest.maxTokens,
            top_p: mergedRequest.topP,
            stop: mergedRequest.stop
          },
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // Ollama can be slower
        }
      );
      
      return {
        content: response.data.message.content,
        finishReason: 'stop',
        usage: {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        },
        model: this.config.model
      };
    } catch (error: any) {
      logger.error('Ollama error', {
        error: error.message,
        response: error.response?.data
      });
      
      throw new Error(`Ollama error: ${error.message}`);
    }
  }
}

