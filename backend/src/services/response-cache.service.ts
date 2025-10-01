/**
 * Response Cache Service - Saves and loads LLM responses for testing
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

const CACHE_DIR = path.join(__dirname, '../../llm-responses');

export class ResponseCacheService {
  constructor() {
    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      logger.info('Created LLM response cache directory', { path: CACHE_DIR });
    }
  }

  /**
   * Save a response to cache
   */
  saveResponse(prompt: string, response: any): void {
    try {
      // Create a filename from the prompt (sanitized)
      const filename = this.generateFilename(prompt);
      const filepath = path.join(CACHE_DIR, filename);

      const cacheData = {
        prompt,
        response,
        timestamp: new Date().toISOString(),
        metadata: {
          htmlLength: response.html?.length || 0,
          cssLength: response.css?.length || 0,
          jsLength: response.js?.length || 0,
        }
      };

      fs.writeFileSync(filepath, JSON.stringify(cacheData, null, 2));
      logger.info('Saved LLM response to cache', { filename, prompt: prompt.substring(0, 50) });
    } catch (error) {
      logger.error('Failed to save response to cache', { error });
    }
  }

  /**
   * Load a response from cache
   */
  loadResponse(prompt: string): any | null {
    try {
      const filename = this.generateFilename(prompt);
      const filepath = path.join(CACHE_DIR, filename);

      if (fs.existsSync(filepath)) {
        const data = fs.readFileSync(filepath, 'utf-8');
        const cacheData = JSON.parse(data);
        logger.info('Loaded response from cache', { filename });
        return cacheData.response;
      }

      return null;
    } catch (error) {
      logger.error('Failed to load response from cache', { error });
      return null;
    }
  }

  /**
   * Get all cached responses
   */
  getAllResponses(): Array<{ filename: string; prompt: string; timestamp: string }> {
    try {
      const files = fs.readdirSync(CACHE_DIR);
      const responses = files
        .filter(f => f.endsWith('.json'))
        .map(filename => {
          try {
            const filepath = path.join(CACHE_DIR, filename);
            const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            return {
              filename,
              prompt: data.prompt,
              timestamp: data.timestamp,
              metadata: data.metadata
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      return responses as any;
    } catch (error) {
      logger.error('Failed to list cached responses', { error });
      return [];
    }
  }

  /**
   * Find best matching cached response
   */
  findBestMatch(prompt: string): any | null {
    try {
      const allResponses = this.getAllResponses();
      const promptLower = prompt.toLowerCase();

      // Try exact match first
      const exactMatch = this.loadResponse(prompt);
      if (exactMatch) return exactMatch;

      // Try fuzzy matching based on keywords
      const keywords = this.extractKeywords(promptLower);
      
      for (const cached of allResponses) {
        const cachedKeywords = this.extractKeywords(cached.prompt.toLowerCase());
        const matchScore = this.calculateMatchScore(keywords, cachedKeywords);
        
        if (matchScore > 0.5) {
          logger.info('Found fuzzy match for prompt', { 
            prompt: prompt.substring(0, 50),
            matched: cached.prompt.substring(0, 50),
            score: matchScore
          });
          const filepath = path.join(CACHE_DIR, cached.filename);
          const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
          return data.response;
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to find best match', { error });
      return null;
    }
  }

  /**
   * Generate filename from prompt
   */
  private generateFilename(prompt: string): string {
    // Extract key words and create a readable filename
    const sanitized = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join('-');
    
    return `${sanitized}.json`;
  }

  /**
   * Extract keywords from prompt
   */
  private extractKeywords(text: string): string[] {
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'create', 'make', 'build'];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  /**
   * Calculate match score between two keyword sets
   */
  private calculateMatchScore(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const matches = keywords1.filter(k => keywords2.includes(k)).length;
    return matches / Math.max(keywords1.length, keywords2.length);
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    try {
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      });
      logger.info('Cleared all cached responses');
    } catch (error) {
      logger.error('Failed to clear cache', { error });
    }
  }
}

export const responseCacheService = new ResponseCacheService();

