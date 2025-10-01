import axios from 'axios';
import { LLMRequest, LLMResponse } from '@jp/shared';
import { BaseLLMProvider } from '../base';
import logger from '../../utils/logger';

export class AnthropicProvider extends BaseLLMProvider {
  getProviderName(): string {
    return 'Anthropic';
  }
  
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const mergedRequest = this.mergeWithDefaults(request);
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
    
    try {
      logger.info('Sending request to Anthropic API', {
        model: this.config.model,
        messageCount: mergedRequest.messages.length
      });
      
      // Anthropic uses a different message format
      const systemMessage = mergedRequest.messages.find(m => m.role === 'system');
      const messages = mergedRequest.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));
      
      const response = await axios.post(
        `${baseUrl}/v1/messages`,
        {
          model: this.config.model,
          messages,
          system: systemMessage?.content,
          temperature: mergedRequest.temperature,
          max_tokens: mergedRequest.maxTokens,
          top_p: mergedRequest.topP,
          stop_sequences: mergedRequest.stop
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000
        }
      );
      
      return {
        content: response.data.content[0].text,
        finishReason: this.mapFinishReason(response.data.stop_reason),
        usage: {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
        },
        model: response.data.model
      };
    } catch (error: any) {
      logger.error('Anthropic API error', {
        error: error.message,
        response: error.response?.data
      });
      
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }
  
  private mapFinishReason(reason: string): LLMResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}

