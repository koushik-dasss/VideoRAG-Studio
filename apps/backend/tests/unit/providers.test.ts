import { describe, it, expect, beforeEach } from 'vitest';

import { loadConfig, resetConfig } from '../../src/config/index';
import type { AppConfig } from '../../src/config/index';
import { ConfigurationError } from '../../src/errors/index';
import {
  MockLLMProvider,
  MockSpeechProvider,
  MockEmbeddingProvider,
  LLMProviderFactory,
  SpeechProviderFactory,
  EmbeddingProviderFactory,
} from '../../src/providers/index';

describe('Providers', () => {
  let config: AppConfig;

  beforeEach(() => {
    resetConfig();
    process.env['NODE_ENV'] = 'test';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017/test';
    config = loadConfig();
  });

  // ────────────────────────────────────────────────────────────────────
  // Mock LLM Provider
  // ────────────────────────────────────────────────────────────────────
  describe('MockLLMProvider', () => {
    it('reports itself as available', async () => {
      const provider = new MockLLMProvider(config);
      expect(await provider.isAvailable()).toBe(true);
    });

    it('returns a text completion', async () => {
      const provider = new MockLLMProvider(config);
      const result = await provider.complete({ prompt: 'Hello' });

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.model).toBe('mock-llm');
      expect(result.tokensUsed.total).toBeGreaterThan(0);
      expect(result.finishReason).toBe('stop');
    });

    it('returns JSON when responseFormat is json', async () => {
      const provider = new MockLLMProvider(config);
      const result = await provider.complete({
        prompt: 'Generate chapters',
        responseFormat: 'json',
      });

      const parsed = JSON.parse(result.content) as { chapters: unknown[] };
      expect(parsed.chapters).toBeDefined();
      expect(Array.isArray(parsed.chapters)).toBe(true);
      expect(parsed.chapters.length).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Mock Speech Provider
  // ────────────────────────────────────────────────────────────────────
  describe('MockSpeechProvider', () => {
    it('reports itself as available', async () => {
      const provider = new MockSpeechProvider(config);
      expect(await provider.isAvailable()).toBe(true);
    });

    it('returns transcription with segments', async () => {
      const provider = new MockSpeechProvider(config);
      const result = await provider.transcribe('/audio/test.wav');

      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.fullText.length).toBeGreaterThan(0);
      expect(result.language).toBe('en');
      expect(result.durationSeconds).toBeGreaterThan(0);
    });

    it('respects language parameter', async () => {
      const provider = new MockSpeechProvider(config);
      const result = await provider.transcribe('/audio/test.wav', 'fr');

      expect(result.language).toBe('fr');
      expect(result.segments[0].language).toBe('fr');
    });

    it('includes word-level timing in first segment', async () => {
      const provider = new MockSpeechProvider(config);
      const result = await provider.transcribe('/audio/test.wav');

      expect(result.segments[0].words.length).toBeGreaterThan(0);
      expect(result.segments[0].words[0].startTime).toBeDefined();
      expect(result.segments[0].words[0].confidence).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Mock Embedding Provider
  // ────────────────────────────────────────────────────────────────────
  describe('MockEmbeddingProvider', () => {
    it('reports itself as available', async () => {
      const provider = new MockEmbeddingProvider(config);
      expect(await provider.isAvailable()).toBe(true);
    });

    it('returns 256-dimensional vector', async () => {
      const provider = new MockEmbeddingProvider(config);
      const result = await provider.embed('test text');

      expect(result.vector).toHaveLength(256);
      expect(result.model).toBe('mock-embedding');
      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('produces deterministic embeddings', async () => {
      const provider = new MockEmbeddingProvider(config);
      const r1 = await provider.embed('hello world');
      const r2 = await provider.embed('hello world');

      expect(r1.vector).toEqual(r2.vector);
    });

    it('produces different embeddings for different texts', async () => {
      const provider = new MockEmbeddingProvider(config);
      const r1 = await provider.embed('hello world');
      const r2 = await provider.embed('goodbye world');

      expect(r1.vector).not.toEqual(r2.vector);
    });

    it('handles batch embeddings', async () => {
      const provider = new MockEmbeddingProvider(config);
      const results = await provider.embedBatch(['text A', 'text B', 'text C']);

      expect(results).toHaveLength(3);
      results.forEach((r) => {
        expect(r.vector).toHaveLength(256);
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // LLM Provider Factory
  // ────────────────────────────────────────────────────────────────────
  describe('LLMProviderFactory', () => {


    it('creates Gemini provider', () => {
      const factory = new LLMProviderFactory(config);
      const provider = factory.create('gemini');
      expect(provider.name).toBe('gemini');
    });

    it('caches providers', () => {
      const factory = new LLMProviderFactory(config);
      const p1 = factory.create('gemini');
      const p2 = factory.create('gemini');
      expect(p1).toBe(p2);
    });

    it('throws on unknown provider', () => {
      const factory = new LLMProviderFactory(config);
      expect(() => factory.create('unknown')).toThrow(ConfigurationError);
    });

    it('lists available providers', () => {
      const factory = new LLMProviderFactory(config);
      const providers = factory.getAvailableProviders();
      expect(providers).toContain('gemini');
      expect(providers).toContain('local-llm');
    });

    it('createAvailable falls back to mock when no API keys', async () => {
      const factory = new LLMProviderFactory(config);
      const provider = await factory.createAvailable();
      // Without real API keys, mock provider is last resort
      expect(provider).toBeDefined();
      expect(await provider.isAvailable()).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Speech Provider Factory
  // ────────────────────────────────────────────────────────────────────
  describe('SpeechProviderFactory', () => {


    it('creates faster-whisper provider', () => {
      const factory = new SpeechProviderFactory(config);
      const provider = factory.create('faster-whisper');
      expect(provider).toBeDefined();
    });

    it('throws on unknown provider', () => {
      const factory = new SpeechProviderFactory(config);
      expect(() => factory.create('unknown')).toThrow(ConfigurationError);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // Embedding Provider Factory
  // ────────────────────────────────────────────────────────────────────
  describe('EmbeddingProviderFactory', () => {
    it('creates local embedding provider', () => {
      const factory = new EmbeddingProviderFactory(config);
      const provider = factory.create('local');
      expect(provider).toBeDefined();
    });

    it('throws on unknown provider', () => {
      const factory = new EmbeddingProviderFactory(config);
      expect(() => factory.create('unknown')).toThrow(ConfigurationError);
    });

    it('lists available providers', () => {
      const factory = new EmbeddingProviderFactory(config);
      expect(factory.getAvailableProviders()).toContain('local');
    });
  });
});
