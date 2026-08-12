/**
 * Embedding Service — generates and caches dense vector representations
 * of text segments/chapters using configured embedding providers.
 */

import { ProviderError, ValidationError } from '../errors/index';
import type {
  EmbeddingResult,
  ICacheService,
  IEmbeddingProvider,
  IEmbeddingService,
} from '../interfaces/index';
import { createLogger } from '../utils/logger';

const log = createLogger('EmbeddingService');

export class EmbeddingService implements IEmbeddingService {
  private readonly provider: IEmbeddingProvider;
  private readonly cacheService?: ICacheService;

  constructor(provider: IEmbeddingProvider, cacheService?: ICacheService) {
    if (!provider) {
      throw new ValidationError('EmbeddingProvider is required for EmbeddingService');
    }
    this.provider = provider;
    this.cacheService = cacheService;

    log.info('EmbeddingService initialised', {
      provider: this.provider.name,
      cachingEnabled: Boolean(this.cacheService),
    });
  }

  /**
   * Generate an embedding vector for a single text string.
   */
  async embed(text: string): Promise<EmbeddingResult> {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new ValidationError('Text is required for embedding');
    }

    const cleanText = text.trim();
    const cacheKey = `embed:${this.provider.name}:${cleanText}`;

    if (this.cacheService) {
      try {
        const cached = await this.cacheService.get<EmbeddingResult>(cacheKey);
        if (cached && Array.isArray(cached.vector)) {
          log.debug('Embedding cache hit', { provider: this.provider.name });
          return cached;
        }
      } catch (err) {
        log.warn('Cache lookup failed during embed', { error: String(err) });
      }
    }

    try {
      const result = await this.provider.embed(cleanText);

      if (this.cacheService && result && Array.isArray(result.vector)) {
        try {
          await this.cacheService.set(cacheKey, result, 86400); // 24-hour cache TTL
        } catch (err) {
          log.warn('Cache store failed during embed', { error: String(err) });
        }
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('Embedding failed via provider', { provider: this.provider.name, error: error.message });
      throw new ProviderError(this.provider.name, `Failed to generate embedding: ${error.message}`, error);
    }
  }

  /**
   * Generate embedding vectors for a batch of text strings.
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    const cleanTexts = texts.map((t) => (typeof t === 'string' ? t.trim() : ''));
    if (cleanTexts.some((t) => !t)) {
      throw new ValidationError('All texts in batch must be non-empty strings');
    }

    if (!this.cacheService) {
      try {
        return await this.provider.embedBatch(cleanTexts);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error('Batch embedding failed via provider', { provider: this.provider.name, error: error.message });
        throw new ProviderError(
          this.provider.name,
          `Failed to generate batch embeddings: ${error.message}`,
          error,
        );
      }
    }

    const results: Array<EmbeddingResult | null> = cleanTexts.map(() => null);
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];

    // Check cache for each item
    for (let i = 0; i < cleanTexts.length; i++) {
      const t = cleanTexts[i];
      if (!t) {
        continue;
      }
      const cacheKey = `embed:${this.provider.name}:${t}`;
      try {
        const cached = await this.cacheService.get<EmbeddingResult>(cacheKey);
        if (cached && Array.isArray(cached.vector)) {
          results[i] = cached;
          continue;
        }
      } catch (err) {
        log.warn('Cache lookup failed during embedBatch', { error: String(err) });
      }
      missingIndices.push(i);
      missingTexts.push(t);
    }

    if (missingIndices.length === 0) {
      log.debug('Batch embedding full cache hit', { count: cleanTexts.length });
      return results as EmbeddingResult[];
    }

    try {
      const missingResults = await this.provider.embedBatch(missingTexts);

      for (let j = 0; j < missingIndices.length; j++) {
        const targetIdx = missingIndices[j];
        if (targetIdx === undefined) {
          continue;
        }
        const res = missingResults[j];
        if (!res) {
          continue;
        }

        results[targetIdx] = res;

        const targetText = cleanTexts[targetIdx];
        if (targetText && Array.isArray(res.vector)) {
          const cacheKey = `embed:${this.provider.name}:${targetText}`;
          try {
            await this.cacheService.set(cacheKey, res, 86400);
          } catch (err) {
            log.warn('Cache store failed during embedBatch', { error: String(err) });
          }
        }
      }

      return results as EmbeddingResult[];
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('Batch embedding failed via provider', { provider: this.provider.name, error: error.message });
      throw new ProviderError(
        this.provider.name,
        `Failed to generate batch embeddings: ${error.message}`,
        error,
      );
    }
  }
}
