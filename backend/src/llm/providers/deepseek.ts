import axios from 'axios';
import { LLMRequest, LLMResponse } from '@jp/shared';
import { BaseLLMProvider } from '../base';
import logger from '../../utils/logger';

export class DeepSeekProvider extends BaseLLMProvider {
  getProviderName(): string {
    return 'DeepSeek';
  }

  /**
   * Stream completion with callback for each chunk
   */
  async streamComplete(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    const mergedRequest = this.mergeWithDefaults(request);
    const baseUrl = this.config.baseUrl || 'https://api.deepseek.com';

    try {
      logger.info('Sending streaming request to DeepSeek API', {
        model: this.config.model,
        messageCount: mergedRequest.messages.length
      });

      const response = await axios.post(
        `${baseUrl}/v1/chat/completions`,
        {
          model: this.config.model,
          messages: mergedRequest.messages,
          temperature: mergedRequest.temperature,
          max_tokens: mergedRequest.maxTokens,
          top_p: mergedRequest.topP,
          stop: mergedRequest.stop,
          stream: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 300000, // 5 minutes for streaming
          responseType: 'stream'
        }
      );

      let fullContent = '';
      let finishReason: LLMResponse['finishReason'] = 'stop';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices[0]?.delta?.content;

                if (delta) {
                  fullContent += delta;
                  onChunk(delta);
                }

                if (parsed.choices[0]?.finish_reason) {
                  finishReason = this.mapFinishReason(parsed.choices[0].finish_reason);
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        });

        response.data.on('end', () => {
          resolve({
            content: fullContent,
            finishReason,
            model: this.config.model
          });
        });

        response.data.on('error', (error: Error) => {
          logger.error('DeepSeek streaming error', { error: error.message });
          reject(error);
        });
      });
    } catch (error: any) {
      logger.error('DeepSeek API error', {
        error: error.message,
        response: error.response?.data
      });

      throw new Error(`DeepSeek API error: ${error.message}`);
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const mergedRequest = this.mergeWithDefaults(request);
    const baseUrl = this.config.baseUrl || 'https://api.deepseek.com';
    
    try {
      logger.info('Sending request to DeepSeek API', {
        model: this.config.model,
        messageCount: mergedRequest.messages.length
      });
      
      const response = await axios.post(
        `${baseUrl}/v1/chat/completions`,
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
          timeout: 180000 // 3 minutes for complex code generation
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
      logger.error('DeepSeek API error', {
        error: error.message,
        response: error.response?.data
      });
      
      throw new Error(`DeepSeek API error: ${error.message}`);
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

