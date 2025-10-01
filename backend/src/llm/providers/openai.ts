import axios from 'axios';
import { LLMRequest, LLMResponse } from '@jp/shared';
import { BaseLLMProvider } from '../base';
import logger from '../../utils/logger';

export class OpenAIProvider extends BaseLLMProvider {
  getProviderName(): string {
    return 'OpenAI';
  }
  
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const mergedRequest = this.mergeWithDefaults(request);
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    
    try {
      logger.info('Sending request to OpenAI API', {
        model: this.config.model,
        messageCount: mergedRequest.messages.length
      });
      
      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: this.config.model,
          messages: mergedRequest.messages,
          temperature: mergedRequest.temperature,
          max_tokens: mergedRequest.maxTokens,
          top_p: mergedRequest.topP,
          stop: mergedRequest.stop,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 60000
        }
      );
      
      const choice = response.data.choices[0];
      
      return {
        content: choice.message.content,
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        },
        model: response.data.model
      };
    } catch (error: any) {
      logger.error('OpenAI API error', {
        error: error.message,
        response: error.response?.data
      });
      
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
  
  private mapFinishReason(reason: string): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}

