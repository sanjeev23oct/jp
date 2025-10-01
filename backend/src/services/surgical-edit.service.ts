/**
 * Surgical Edit Service - Handles targeted code modifications
 * Supports hybrid approach: CSS selector-based edits, SEARCH/REPLACE blocks, and whole file replacement
 */

import { LLMProvider } from '../llm/base';

export interface SurgicalEditRequest {
  description: string;
  currentCode: {
    html: string;
    css: string;
    js: string;
  };
  selectedElement?: {
    selector: string;
    tagName: string;
    className?: string;
    id?: string;
  };
}

export interface CSSEdit {
  type: 'css-selector';
  selector: string;
  property: string;
  value: string;
}

export interface SearchReplaceEdit {
  type: 'search-replace';
  file: 'html' | 'css' | 'js';
  search: string;
  replace: string;
}

export interface WholeFileEdit {
  type: 'whole-file';
  file: 'html' | 'css' | 'js';
  content: string;
}

export type SurgicalEdit = CSSEdit | SearchReplaceEdit | WholeFileEdit;

export interface SurgicalEditResponse {
  edits: SurgicalEdit[];
  explanation: string;
  editType: 'css-selector' | 'search-replace' | 'whole-file';
}

export class SurgicalEditService {
  constructor(private llm: LLMProvider) {}

  /**
   * Analyze the edit request and determine the best approach
   */
  private analyzeEditType(description: string, selectedElement?: any): 'css-selector' | 'search-replace' | 'whole-file' {
    const lowerDesc = description.toLowerCase();
    
    // CSS selector-based edits (style changes)
    const styleKeywords = ['color', 'background', 'font', 'size', 'padding', 'margin', 'border', 'width', 'height', 'style'];
    if (styleKeywords.some(keyword => lowerDesc.includes(keyword)) && selectedElement) {
      return 'css-selector';
    }
    
    // Search/replace for targeted changes
    const targetedKeywords = ['change', 'replace', 'update', 'modify', 'rename'];
    if (targetedKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'search-replace';
    }
    
    // Whole file for complex changes
    return 'whole-file';
  }

  /**
   * Generate surgical edit using LLM
   */
  async generateSurgicalEdit(request: SurgicalEditRequest): Promise<SurgicalEditResponse> {
    const editType = this.analyzeEditType(request.description, request.selectedElement);
    
    let prompt: string;
    
    if (editType === 'css-selector') {
      prompt = this.buildCSSEditPrompt(request);
    } else if (editType === 'search-replace') {
      prompt = this.buildSearchReplacePrompt(request);
    } else {
      prompt = this.buildWholeFilePrompt(request);
    }

    const response = await this.llm.complete({
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(editType)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 2000,
      temperature: 0.3 // Lower temperature for more precise edits
    });

    return this.parseResponse(response.content, editType);
  }

  /**
   * System prompts for different edit types
   */
  private getSystemPrompt(editType: 'css-selector' | 'search-replace' | 'whole-file'): string {
    if (editType === 'css-selector') {
      return `You are a CSS editing assistant. Generate precise CSS property changes using selectors.

Output ONLY valid JSON in this format:
{
  "edits": [
    {
      "type": "css-selector",
      "selector": ".button",
      "property": "background-color",
      "value": "blue"
    }
  ],
  "explanation": "Changed button background to blue"
}

Rules:
- Use CSS property names (background-color, not backgroundColor)
- Use valid CSS values
- Target specific selectors (class, id, or tag)
- Multiple edits allowed for complex changes`;
    }
    
    if (editType === 'search-replace') {
      return `You are a code editing assistant. Generate precise SEARCH/REPLACE blocks for targeted changes.

Output ONLY valid JSON in this format:
{
  "edits": [
    {
      "type": "search-replace",
      "file": "html",
      "search": "exact text to find",
      "replace": "exact replacement text"
    }
  ],
  "explanation": "What was changed"
}

CRITICAL RULES:
- search MUST match EXACTLY (including whitespace)
- Only include the minimal code that needs to change
- Preserve indentation and formatting
- Multiple edits allowed
- File can be: "html", "css", or "js"`;
    }
    
    return `You are a code generation assistant. Generate complete, updated file content.

Output ONLY valid JSON in this format:
{
  "edits": [
    {
      "type": "whole-file",
      "file": "html",
      "content": "complete file content here"
    }
  ],
  "explanation": "What was changed"
}`;
  }

  /**
   * Build prompts for different edit types
   */
  private buildCSSEditPrompt(request: SurgicalEditRequest): string {
    const { description, selectedElement, currentCode } = request;
    
    let context = `User request: ${description}\n\n`;
    
    if (selectedElement) {
      context += `Selected element:\n`;
      context += `- Tag: ${selectedElement.tagName}\n`;
      if (selectedElement.className) context += `- Class: ${selectedElement.className}\n`;
      if (selectedElement.id) context += `- ID: ${selectedElement.id}\n`;
      context += `- Selector: ${selectedElement.selector}\n\n`;
    }
    
    // Include relevant CSS (first 1000 chars)
    context += `Current CSS (excerpt):\n${currentCode.css.substring(0, 1000)}\n\n`;
    
    context += `Generate CSS edits to fulfill the request.`;
    
    return context;
  }

  private buildSearchReplacePrompt(request: SurgicalEditRequest): string {
    const { description, currentCode } = request;
    
    let context = `User request: ${description}\n\n`;
    
    // Include relevant code sections (limited to 2000 chars total)
    context += `Current HTML:\n${currentCode.html.substring(0, 800)}\n\n`;
    context += `Current CSS:\n${currentCode.css.substring(0, 600)}\n\n`;
    context += `Current JS:\n${currentCode.js.substring(0, 600)}\n\n`;
    
    context += `Generate SEARCH/REPLACE blocks to make the requested changes.`;
    
    return context;
  }

  private buildWholeFilePrompt(request: SurgicalEditRequest): string {
    const { description, currentCode } = request;
    
    let context = `User request: ${description}\n\n`;
    context += `Current code:\n`;
    context += `HTML:\n${currentCode.html}\n\n`;
    context += `CSS:\n${currentCode.css}\n\n`;
    context += `JS:\n${currentCode.js}\n\n`;
    context += `Generate the complete updated files.`;
    
    return context;
  }

  /**
   * Parse LLM response
   */
  private parseResponse(content: string, editType: 'css-selector' | 'search-replace' | 'whole-file'): SurgicalEditResponse {
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      const parsed = JSON.parse(cleanContent);
      
      return {
        edits: parsed.edits || [],
        explanation: parsed.explanation || 'Code updated',
        editType
      };
    } catch (error) {
      console.error('Failed to parse surgical edit response:', error);
      throw new Error('Failed to parse LLM response for surgical edit');
    }
  }

  /**
   * Apply edits to code
   */
  applyEdits(
    currentCode: { html: string; css: string; js: string },
    edits: SurgicalEdit[]
  ): { html: string; css: string; js: string } {
    let result = { ...currentCode };
    
    for (const edit of edits) {
      if (edit.type === 'css-selector') {
        result.css = this.applyCSSEdit(result.css, edit);
      } else if (edit.type === 'search-replace') {
        result = this.applySearchReplaceEdit(result, edit);
      } else if (edit.type === 'whole-file') {
        result = this.applyWholeFileEdit(result, edit);
      }
    }
    
    return result;
  }

  private applyCSSEdit(css: string, edit: CSSEdit): string {
    // Find the selector and update the property
    const selectorRegex = new RegExp(`(${this.escapeRegex(edit.selector)}\\s*{[^}]*)(${this.escapeRegex(edit.property)}\\s*:[^;]+;)`, 'g');
    
    // Check if property exists
    if (selectorRegex.test(css)) {
      // Replace existing property
      return css.replace(selectorRegex, `$1${edit.property}: ${edit.value};`);
    } else {
      // Add property to selector
      const addPropertyRegex = new RegExp(`(${this.escapeRegex(edit.selector)}\\s*{)`, 'g');
      return css.replace(addPropertyRegex, `$1\n  ${edit.property}: ${edit.value};`);
    }
  }

  private applySearchReplaceEdit(
    code: { html: string; css: string; js: string },
    edit: SearchReplaceEdit
  ): { html: string; css: string; js: string } {
    const result = { ...code };
    
    if (edit.file === 'html') {
      result.html = result.html.replace(edit.search, edit.replace);
    } else if (edit.file === 'css') {
      result.css = result.css.replace(edit.search, edit.replace);
    } else if (edit.file === 'js') {
      result.js = result.js.replace(edit.search, edit.replace);
    }
    
    return result;
  }

  private applyWholeFileEdit(
    code: { html: string; css: string; js: string },
    edit: WholeFileEdit
  ): { html: string; css: string; js: string } {
    const result = { ...code };
    
    if (edit.file === 'html') {
      result.html = edit.content;
    } else if (edit.file === 'css') {
      result.css = edit.content;
    } else if (edit.file === 'js') {
      result.js = edit.content;
    }
    
    return result;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

