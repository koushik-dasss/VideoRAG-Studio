/**
 * Prompt Template Engine Service — manages and renders dynamic LLM prompts
 * with variable substitution and built-in template support.
 */

import { NotFoundError, ValidationError } from '../errors/index';
import type { IPromptTemplateEngine } from '../interfaces/index';
import { createLogger } from '../utils/logger';

const log = createLogger('PromptTemplateEngine');

export const DEFAULT_PROMPT_TEMPLATES: Record<string, string> = {
  chapter_generation: `You are an expert video content analyzer and editor. Your task is to generate concise, informative, and engaging chapters for a video based on its transcript chunks.

Video Title: {{videoTitle}}

Transcript Chunks:
{{chunksText}}

Analyze the chunks and generate well-structured chapters. Each chapter should cover a distinct topic or section of the video.
Return your response in strict JSON format with a "chapters" array, where each chapter object contains:
- "title": string (Clear, engaging chapter title, max 60 characters)
- "summary": string (2-3 sentences summarizing key points covered)
- "startTime": number (Start timestamp in seconds, matching the first segment of the topic)
- "endTime": number (End timestamp in seconds, matching the last segment of the topic)
- "tags": string[] (3-5 relevant keywords for indexing/searching)`,
};

export interface PromptEngineOptions {
  strict?: boolean;
  defaultTemplates?: Record<string, string>;
}

export class PromptTemplateEngine implements IPromptTemplateEngine {
  private readonly templates: Map<string, string> = new Map();
  private readonly strict: boolean;

  constructor(options?: PromptEngineOptions) {
    this.strict = options?.strict ?? false;

    // Register default templates
    const initialTemplates = { ...DEFAULT_PROMPT_TEMPLATES, ...options?.defaultTemplates };
    for (const [name, template] of Object.entries(initialTemplates)) {
      this.templates.set(name, template);
    }

    log.info('PromptTemplateEngine initialised', {
      strict: this.strict,
      registeredCount: this.templates.size,
    });
  }

  /**
   * Register or overwrite a named template.
   */
  registerTemplate(name: string, template: string): void {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Template name must be a non-empty string');
    }
    if (!template || typeof template !== 'string') {
      throw new ValidationError('Template content must be a string');
    }

    const exists = this.templates.has(name);
    this.templates.set(name.trim(), template);

    if (exists) {
      log.warn('Overwritten existing prompt template', { name });
    } else {
      log.debug('Registered new prompt template', { name });
    }
  }

  /**
   * Check if a template is registered.
   */
  hasTemplate(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    return this.templates.has(name.trim());
  }

  /**
   * Render a template by interpolating `variables`.
   */
  render(templateName: string, variables: Record<string, unknown> = {}): string {
    if (!templateName || typeof templateName !== 'string') {
      throw new ValidationError('Template name must be provided');
    }

    const name = templateName.trim();
    if (!this.hasTemplate(name)) {
      throw new NotFoundError('PromptTemplate', name);
    }

    const template = this.templates.get(name);
    if (!template) {
      throw new NotFoundError('PromptTemplate', name);
    }

    return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
      const val = this.resolveVariable(variables, key);

      if (val === undefined || val === null) {
        if (this.strict) {
          throw new ValidationError(`Missing required template variable: "${key}" for template "${name}"`);
        }
        return '';
      }

      if (typeof val === 'object') {
        return JSON.stringify(val, null, 2);
      }

      return String(val);
    });
  }

  /**
   * Helper to resolve dot-notation property paths inside variable records.
   */
  private resolveVariable(variables: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = variables;

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}
