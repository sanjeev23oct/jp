/**
 * Prompt Optimizer
 * Selects appropriate prompt strategy based on request complexity
 */

import logger from './logger';

export interface PromptStrategy {
  type: 'standard' | 'concise' | 'minimal';
  maxTokens: number;
  focusAreas: string[];
}

export class PromptOptimizer {
  /**
   * Select prompt strategy based on request complexity
   */
  static selectStrategy(request: string, retryAttempt: number = 0): PromptStrategy {
    const complexity = this.assessComplexity(request);
    
    // Use more aggressive optimization on retries
    if (retryAttempt > 0) {
      logger.info('Using more concise prompt due to retry', { retryAttempt });
      
      if (retryAttempt >= 2) {
        return {
          type: 'minimal',
          maxTokens: 8192,
          focusAreas: ['core functionality only', 'minimal features']
        };
      } else {
        return {
          type: 'concise',
          maxTokens: 8192,
          focusAreas: ['working prototype', 'essential features']
        };
      }
    }
    
    // Normal strategy selection based on complexity
    if (complexity > 0.7) {
      logger.info('High complexity detected, using minimal prompt', { complexity });
      return {
        type: 'minimal',
        maxTokens: 8192,
        focusAreas: ['core functionality', 'essential features only']
      };
    } else if (complexity > 0.4) {
      logger.info('Medium complexity detected, using concise prompt', { complexity });
      return {
        type: 'concise',
        maxTokens: 8192,
        focusAreas: ['working prototype', 'key features']
      };
    } else {
      logger.info('Low complexity detected, using standard prompt', { complexity });
      return {
        type: 'standard',
        maxTokens: 6144,
        focusAreas: ['complete implementation']
      };
    }
  }
  
  /**
   * Assess complexity of request (0-1 scale)
   */
  private static assessComplexity(request: string): number {
    let score = 0;
    const lower = request.toLowerCase();
    
    // Keywords indicating high complexity
    const complexKeywords = ['dashboard', 'crm', 'admin', 'management', 'system', 'platform', 'portal'];
    const featureKeywords = ['crud', 'search', 'filter', 'sort', 'chart', 'graph', 'table', 'form', 'list'];
    
    complexKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        score += 0.2;
        logger.debug('Complex keyword found', { keyword });
      }
    });
    
    featureKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        score += 0.1;
      }
    });
    
    // Word count
    const wordCount = request.split(/\s+/).length;
    if (wordCount > 50) score += 0.2;
    if (wordCount > 100) score += 0.2;
    
    // Multiple entities mentioned
    const entityKeywords = ['user', 'customer', 'product', 'order', 'task', 'project', 'contact'];
    const entitiesFound = entityKeywords.filter(e => lower.includes(e)).length;
    if (entitiesFound > 2) score += 0.2;
    
    const finalScore = Math.min(score, 1.0);
    logger.info('Complexity assessment complete', {
      score: finalScore,
      wordCount,
      entitiesFound
    });
    
    return finalScore;
  }
}
