/**
 * Retry Manager
 * Handles automatic retry logic with exponential backoff
 */

import logger from './logger';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;      // Base delay in ms (e.g., 2000)
  maxDelay: number;       // Max delay in ms (e.g., 16000)
  retryableErrors: string[]; // Error types that should trigger retry
}

export class RetryManager {
  private config: RetryConfig;
  private attempt: number = 0;
  
  constructor(config: RetryConfig) {
    this.config = config;
  }
  
  shouldRetry(error: Error): boolean {
    if (this.attempt >= this.config.maxAttempts) {
      logger.info('Max retry attempts reached', { attempt: this.attempt });
      return false;
    }
    
    // Check if error is retryable
    const errorMessage = error.message.toLowerCase();
    const isRetryable = this.config.retryableErrors.some(e => errorMessage.includes(e.toLowerCase()));
    
    if (!isRetryable) {
      logger.info('Error is not retryable', { error: error.message });
    }
    
    return isRetryable;
  }
  
  getDelay(): number {
    // Exponential backoff: 2s, 4s, 8s, 16s
    const delay = this.config.baseDelay * Math.pow(2, this.attempt);
    return Math.min(delay, this.config.maxDelay);
  }
  
  incrementAttempt(): void {
    this.attempt++;
    logger.info('Incrementing retry attempt', { attempt: this.attempt });
  }
  
  getAttemptNumber(): number {
    return this.attempt + 1;
  }
  
  getTotalAttempts(): number {
    return this.config.maxAttempts;
  }
  
  reset(): void {
    this.attempt = 0;
  }
}
