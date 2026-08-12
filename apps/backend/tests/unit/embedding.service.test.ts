import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';

import { ProviderError, ValidationError } from '../../src/errors/index';
import type { ICacheService, IEmbeddingProvider } from '../../src/interfaces/index';
import { EmbeddingService } from '../../src/services/embedding.service';

describe('EmbeddingService', () => {
  let mockProvider: IEmbeddingProvider;
  let mockCache: ICacheService;
  let service: EmbeddingService;
  let embedMock: MockInstance;
  let embedBatchMock: MockInstance;
  let cacheGetMock: MockInstance;
  let cacheSetMock: MockInstance;

  beforeEach(() => {
    embedMock = vi.fn().mockResolvedValue({
      vector: [0.1, 0.2, 0.3],
      model: 'test-embedding-model',
      tokensUsed: 5,
    });

    embedBatchMock = vi.fn().mockResolvedValue([
      { vector: [0.1, 0.2, 0.3], model: 'test-embedding-model', tokensUsed: 5 },
      { vector: [0.4, 0.5, 0.6], model: 'test-embedding-model', tokensUsed: 5 },
    ]);

    mockProvider = {
      name: 'test-embedding',
      isAvailable: () => true,
      embed: embedMock,
      embedBatch: embedBatchMock,
    };

    cacheGetMock = vi.fn().mockResolvedValue(null);
    cacheSetMock = vi.fn().mockResolvedValue(undefined);

    mockCache = {
      get: cacheGetMock,
      set: cacheSetMock,
      delete: vi.fn().mockResolvedValue(true),
      has: vi.fn().mockResolvedValue(false),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    service = new EmbeddingService(mockProvider, mockCache);
  });

  it('throws ValidationError when initialized without a provider', () => {
    // @ts-expect-error missing args
    expect(() => new EmbeddingService(null)).toThrow(ValidationError);
  });

  it('embeds single text and caches the result when cache is enabled', async () => {
    const result = await service.embed('Hello world');
    expect(cacheGetMock).toHaveBeenCalledWith('embed:test-embedding:Hello world');
    expect(embedMock).toHaveBeenCalledWith('Hello world');
    expect(cacheSetMock).toHaveBeenCalledWith(
      'embed:test-embedding:Hello world',
      expect.objectContaining({ vector: [0.1, 0.2, 0.3] }),
      86400,
    );
    expect(result.vector).toEqual([0.1, 0.2, 0.3]);
  });

  it('returns cached embedding on cache hit without calling provider', async () => {
    cacheGetMock.mockResolvedValue({
      vector: [0.9, 0.8, 0.7],
      model: 'cached-model',
      tokensUsed: 0,
    });

    const result = await service.embed('Cached text');
    expect(cacheGetMock).toHaveBeenCalledWith('embed:test-embedding:Cached text');
    expect(embedMock).not.toHaveBeenCalled();
    expect(result.vector).toEqual([0.9, 0.8, 0.7]);
  });

  it('throws ValidationError for empty string on embed', async () => {
    await expect(service.embed('')).rejects.toThrow(ValidationError);
  });

  it('throws ProviderError when provider embed fails', async () => {
    embedMock.mockRejectedValue(new Error('Provider API down'));
    await expect(service.embed('Failed text')).rejects.toThrow(ProviderError);
  });

  it('embeds batch of texts handling partial cache hits', async () => {
    // Make item 0 a cache hit, and item 1 a cache miss
    cacheGetMock.mockImplementation((key: string) => {
      if (key === 'embed:test-embedding:first') {
        return Promise.resolve({ vector: [1, 1, 1], model: 'cached-model', tokensUsed: 0 });
      }
      return Promise.resolve(null);
    });

    embedBatchMock.mockResolvedValue([
      { vector: [2, 2, 2], model: 'test-embedding-model', tokensUsed: 5 },
    ]);

    const results = await service.embedBatch(['first', 'second']);

    expect(cacheGetMock).toHaveBeenCalledTimes(2);
    expect(embedBatchMock).toHaveBeenCalledWith(['second']);
    expect(cacheSetMock).toHaveBeenCalledWith(
      'embed:test-embedding:second',
      expect.objectContaining({ vector: [2, 2, 2] }),
      86400,
    );
    expect(results).toHaveLength(2);
    expect(results[0]?.vector).toEqual([1, 1, 1]);
    expect(results[1]?.vector).toEqual([2, 2, 2]);
  });

  it('returns empty array when embedBatch called with empty list', async () => {
    const results = await service.embedBatch([]);
    expect(results).toEqual([]);
    expect(embedBatchMock).not.toHaveBeenCalled();
  });
});
