import { describe, it, expect } from 'vitest';

import { ValidationError } from '../../src/errors/index';
import {
  validateCreateVideo,
  validateStartPipeline,
  validateSearchRequest,
  validateId,
  validate,
  createVideoSchema,
} from '../../src/validators/index';

describe('Validators', () => {
  // ────────────────────────────────────────────────────────────────────────
  // createVideo
  // ────────────────────────────────────────────────────────────────────────
  describe('validateCreateVideo', () => {
    it('passes valid input', () => {
      const result = validateCreateVideo({
        filePath: '/videos/test.mp4',
        title: 'My Video',
      });

      expect(result.filePath).toBe('/videos/test.mp4');
      expect(result.title).toBe('My Video');
    });

    it('passes with all optional fields', () => {
      const result = validateCreateVideo({
        filePath: '/videos/test.mp4',
        title: 'My Video',
        description: 'A test video',
        language: 'en',
        tags: ['test', 'demo'],
      });

      expect(result.description).toBe('A test video');
      expect(result.language).toBe('en');
      expect(result.tags).toEqual(['test', 'demo']);
    });

    it('throws on missing filePath', () => {
      expect(() => validateCreateVideo({ title: 'Test' })).toThrow(ValidationError);
    });

    it('throws on missing title', () => {
      expect(() => validateCreateVideo({ filePath: '/test.mp4' })).toThrow(ValidationError);
    });

    it('throws on invalid language format', () => {
      expect(() =>
        validateCreateVideo({
          filePath: '/test.mp4',
          title: 'Test',
          language: 'INVALID',
        }),
      ).toThrow(ValidationError);
    });

    it('throws on too many tags', () => {
      const tags = Array.from({ length: 25 }, (_, i) => `tag-${i}`);
      expect(() =>
        validateCreateVideo({
          filePath: '/test.mp4',
          title: 'Test',
          tags,
        }),
      ).toThrow(ValidationError);
    });

    it('provides field-level error details', () => {
      try {
        validateCreateVideo({});
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fields).toBeDefined();
        expect(Object.keys(ve.fields).length).toBeGreaterThan(0);
      }
    });

    it('trims whitespace from filePath', () => {
      const result = validateCreateVideo({
        filePath: '  /test.mp4  ',
        title: 'Test',
      });
      expect(result.filePath).toBe('/test.mp4');
    });

    it('strips unknown properties', () => {
      const result = validateCreateVideo({
        filePath: '/test.mp4',
        title: 'Test',
        unknownProp: 'should be removed',
      });
      expect((result as Record<string, unknown>)['unknownProp']).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // startPipeline
  // ────────────────────────────────────────────────────────────────────────
  describe('validateStartPipeline', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('passes valid input', () => {
      const result = validateStartPipeline({ videoId: validUuid });
      expect(result.videoId).toBe(validUuid);
    });

    it('defaults provider to gemini', () => {
      const result = validateStartPipeline({ videoId: validUuid });
      expect(result.provider).toBe('gemini');
    });

    it('accepts valid provider', () => {
      const result = validateStartPipeline({ videoId: validUuid, provider: 'gemini' });
      expect(result.provider).toBe('gemini');
    });

    it('throws on invalid UUID', () => {
      expect(() => validateStartPipeline({ videoId: 'not-a-uuid' })).toThrow(
        ValidationError,
      );
    });

    it('throws on invalid provider', () => {
      expect(() =>
        validateStartPipeline({ videoId: validUuid, provider: 'unknown-ai' }),
      ).toThrow(ValidationError);
    });

    it('accepts options', () => {
      const result = validateStartPipeline({
        videoId: validUuid,
        options: { maxChapters: 5, generateEmbeddings: false },
      });
      expect(result.options?.maxChapters).toBe(5);
      expect(result.options?.generateEmbeddings).toBe(false);
    });

    it('rejects maxChapters > 100', () => {
      expect(() =>
        validateStartPipeline({
          videoId: validUuid,
          options: { maxChapters: 200 },
        }),
      ).toThrow(ValidationError);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // searchRequest
  // ────────────────────────────────────────────────────────────────────────
  describe('validateSearchRequest', () => {
    it('passes valid query', () => {
      const result = validateSearchRequest({ query: 'machine learning' });
      expect(result.query).toBe('machine learning');
      expect(result.limit).toBe(10); // default
      expect(result.threshold).toBe(0.5); // default
    });

    it('throws on empty query', () => {
      expect(() => validateSearchRequest({ query: '' })).toThrow(ValidationError);
    });

    it('accepts custom limit and threshold', () => {
      const result = validateSearchRequest({
        query: 'test',
        limit: 20,
        threshold: 0.8,
      });
      expect(result.limit).toBe(20);
      expect(result.threshold).toBe(0.8);
    });

    it('rejects threshold > 1', () => {
      expect(() =>
        validateSearchRequest({ query: 'test', threshold: 1.5 }),
      ).toThrow(ValidationError);
    });

    it('rejects limit > 100', () => {
      expect(() =>
        validateSearchRequest({ query: 'test', limit: 500 }),
      ).toThrow(ValidationError);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // validateId
  // ────────────────────────────────────────────────────────────────────────
  describe('validateId', () => {
    it('passes a valid UUID v4', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateId(id)).toBe(id);
    });

    it('throws on invalid UUID', () => {
      expect(() => validateId('not-a-uuid')).toThrow(ValidationError);
    });

    it('throws on empty string', () => {
      expect(() => validateId('')).toThrow(ValidationError);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // generic validate()
  // ────────────────────────────────────────────────────────────────────────
  describe('validate (generic)', () => {
    it('returns validated data on success', () => {
      const result = validate(createVideoSchema, {
        filePath: '/test.mp4',
        title: 'Test',
      });
      expect(result.filePath).toBe('/test.mp4');
    });

    it('throws ValidationError with field map on failure', () => {
      try {
        validate(createVideoSchema, {});
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.message).toBe('Validation failed');
        expect(Object.keys(ve.fields).length).toBeGreaterThan(0);
      }
    });
  });
});
