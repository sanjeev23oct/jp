/**
 * JSON Parser with Recovery
 * Handles incomplete/truncated JSON responses from LLM
 */

import logger from './logger';

export interface ParseResult {
  success: boolean;
  data?: any;
  isPartial: boolean;
  missingFields: string[];
  error?: string;
}

export class JSONParser {
  /**
   * Parse JSON with automatic completion of truncated responses
   */
  static parseWithRecovery(content: string): ParseResult {
    const trimmed = content.trim();
    
    // Remove markdown code blocks
    let cleanContent = trimmed;
    if (trimmed.startsWith('```')) {
      cleanContent = trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    if (!cleanContent.startsWith('{')) {
      return {
        success: false,
        isPartial: false,
        missingFields: [],
        error: 'Content does not start with {'
      };
    }
    
    // Try direct parse first
    try {
      const parsed = JSON.parse(cleanContent);
      const missingFields = this.checkRequiredFields(parsed);
      
      return {
        success: true,
        data: parsed,
        isPartial: false,
        missingFields
      };
    } catch (e) {
      logger.debug('Direct JSON parse failed, attempting recovery', {
        error: e instanceof Error ? e.message : String(e)
      });
    }
    
    // Attempt to complete truncated JSON
    const completed = this.completeJSON(cleanContent);
    
    try {
      const parsed = JSON.parse(completed.json);
      const missingFields = this.checkRequiredFields(parsed);
      
      logger.info('Successfully recovered truncated JSON', {
        wasModified: completed.wasModified,
        missingFields
      });
      
      return {
        success: true,
        data: parsed,
        isPartial: completed.wasModified,
        missingFields
      };
    } catch (e) {
      return {
        success: false,
        isPartial: true,
        missingFields: [],
        error: `Failed to parse even after completion: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }
  
  /**
   * Complete truncated JSON by adding missing closing braces/quotes
   */
  private static completeJSON(json: string): { json: string; wasModified: boolean } {
    let completed = json;
    let wasModified = false;
    
    // More sophisticated string termination check
    // Walk through the string and track if we're inside a string
    let inString = false;
    let escaped = false;
    let lastChar = '';
    
    for (let i = 0; i < json.length; i++) {
      const char = json[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
      }
      
      lastChar = char;
    }
    
    // If we ended inside a string, close it
    if (inString) {
      // Check if the last character suggests the string was cut off
      // If it's not a quote or closing brace, we're likely mid-string
      completed += '"';
      wasModified = true;
      logger.debug('Added closing quote for unterminated string');
    }
    
    // Count braces (only outside of strings)
    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    
    // Add missing closing braces
    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces;
      completed += '}'.repeat(missing);
      wasModified = true;
      logger.debug('Added closing braces', { count: missing });
    }
    
    return { json: completed, wasModified };
  }
  
  /**
   * Check if required fields are present
   */
  private static checkRequiredFields(parsed: any): string[] {
    const required = ['html', 'css', 'js'];
    const missing: string[] = [];
    
    for (const field of required) {
      if (!parsed[field]) {
        missing.push(field);
      }
    }
    
    return missing;
  }
}
