/**
 * Timeout Manager
 * Manages dynamic timeouts based on activity
 */

import logger from './logger';

export interface TimeoutConfig {
  initial: number;      // Initial timeout in ms (e.g., 120000 = 2 minutes)
  perRetry: number;     // Additional time per retry in ms (e.g., 60000 = 1 minute)
  maximum: number;      // Max timeout in ms (e.g., 600000 = 10 minutes)
  activityWindow: number; // Time without data before timeout in ms (e.g., 30000 = 30 seconds)
}

export class TimeoutManager {
  private config: TimeoutConfig;
  private lastActivity: number;
  private timeoutHandle: NodeJS.Timeout | null = null;
  
  constructor(config: TimeoutConfig) {
    this.config = config;
    this.lastActivity = Date.now();
  }
  
  /**
   * Update activity timestamp when data is received
   */
  recordActivity(): void {
    this.lastActivity = Date.now();
  }
  
  /**
   * Check if we should timeout based on inactivity
   */
  shouldTimeout(): boolean {
    const inactiveTime = Date.now() - this.lastActivity;
    const shouldTimeout = inactiveTime > this.config.activityWindow;
    
    if (shouldTimeout) {
      logger.warn('Timeout detected due to inactivity', {
        inactiveTime,
        activityWindow: this.config.activityWindow
      });
    }
    
    return shouldTimeout;
  }
  
  /**
   * Get timeout duration for current retry attempt
   */
  getTimeout(retryAttempt: number = 0): number {
    const timeout = this.config.initial + (retryAttempt * this.config.perRetry);
    return Math.min(timeout, this.config.maximum);
  }
  
  /**
   * Get time since last activity in seconds
   */
  getTimeSinceLastActivity(): number {
    return Math.floor((Date.now() - this.lastActivity) / 1000);
  }
  
  /**
   * Reset activity timer
   */
  reset(): void {
    this.lastActivity = Date.now();
  }
}
