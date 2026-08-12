import { describe, it, expect, beforeEach } from 'vitest';

import { NotFoundError, ValidationError } from '../../src/errors/index';
import { PromptTemplateEngine } from '../../src/services/prompt.template.engine';

describe('PromptTemplateEngine', () => {
  let engine: PromptTemplateEngine;

  beforeEach(() => {
    engine = new PromptTemplateEngine();
  });

  it('initializes with default templates', () => {
    expect(engine.hasTemplate('chapter_generation')).toBe(true);
  });

  it('registers and checks existence of new templates', () => {
    expect(engine.hasTemplate('custom_prompt')).toBe(false);
    engine.registerTemplate('custom_prompt', 'Hello {{name}}!');
    expect(engine.hasTemplate('custom_prompt')).toBe(true);
  });

  it('throws ValidationError when registering invalid template name or content', () => {
    expect(() => engine.registerTemplate('', 'content')).toThrow(ValidationError);
    // @ts-expect-error invalid args
    expect(() => engine.registerTemplate('valid', null)).toThrow(ValidationError);
  });

  it('throws NotFoundError when rendering non-existent template', () => {
    expect(() => engine.render('missing_template', {})).toThrow(NotFoundError);
  });

  it('renders template substituting simple and nested variables', () => {
    engine.registerTemplate('greeting', 'Hello {{user.name}}! Welcome to {{app.title}}.');
    const result = engine.render('greeting', {
      user: { name: 'Alice' },
      app: { title: 'Video Search' },
    });
    expect(result).toBe('Hello Alice! Welcome to Video Search.');
  });

  it('handles objects by stringifying them as JSON', () => {
    engine.registerTemplate('dump', 'Data: {{metadata}}');
    const result = engine.render('dump', {
      metadata: { count: 5, status: 'ok' },
    });
    expect(result).toContain('"count": 5');
    expect(result).toContain('"status": "ok"');
  });

  it('replaces missing variables with empty string in non-strict mode', () => {
    engine.registerTemplate('optional', 'Hello {{name}}! Your role is {{role}}.');
    const result = engine.render('optional', { name: 'Bob' });
    expect(result).toBe('Hello Bob! Your role is .');
  });

  it('throws ValidationError when required variables are missing in strict mode', () => {
    const strictEngine = new PromptTemplateEngine({ strict: true });
    strictEngine.registerTemplate('strict_test', 'User {{userId}}');
    expect(() => strictEngine.render('strict_test', {})).toThrow(ValidationError);
  });
});
