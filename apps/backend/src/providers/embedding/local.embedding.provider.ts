import { pipeline, env } from '@xenova/transformers';
import type { AppConfig } from '../../config/index';
import type { IEmbeddingProvider, EmbeddingResult } from '../../interfaces/index';
import { BaseProvider } from '../base.provider';
import { ProviderError } from '../../errors/index';
import { createLogger } from '../../utils/logger';

const log = createLogger('LocalEmbeddingProvider');

// Configure Transformers.js to use local cache
env.allowLocalModels = true;
env.useBrowserCache = false;

export class LocalEmbeddingProvider extends BaseProvider implements IEmbeddingProvider {
  public readonly name = 'local';
  private extractor: any = null;

  constructor(config: AppConfig) {
    super(config);
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.extractor) {
        const modelName = this.config.localEmbedding?.model || 'Xenova/nomic-embed-text-v1.5';
        this.extractor = await pipeline('feature-extraction', modelName);
        log.info(`Initialized Local Embedding pipeline with model: ${modelName}`);
      }
      return true;
    } catch (err: any) {
      log.error(`Local Embedding availability check failed: ${err.message}`);
      return false;
    }
  }

  async embed(text: string): Promise<EmbeddingResult> {
    try {
      if (!this.extractor) {
        const modelName = this.config.localEmbedding?.model || 'Xenova/nomic-embed-text-v1.5';
        this.extractor = await pipeline('feature-extraction', modelName);
      }

      // feature-extraction output is a tensor
      const output = await this.extractor(text, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data) as number[];

      return {
        vector,
        model: this.config.localEmbedding?.model || 'Xenova/nomic-embed-text-v1.5',
        tokensUsed: 0, // Transformers.js doesn't easily expose token count in the pipeline result
      };
    } catch (err: any) {
      throw new ProviderError(this.name, `Local Embedding error: ${err.message}`, err);
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      if (!this.extractor) {
        const modelName = this.config.localEmbedding?.model || 'Xenova/nomic-embed-text-v1.5';
        this.extractor = await pipeline('feature-extraction', modelName);
      }

      const results: EmbeddingResult[] = [];
      
      // We can process in parallel or sequentially. Sequential is safer for memory.
      for (const text of texts) {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        results.push({
          vector: Array.from(output.data) as number[],
          model: this.config.localEmbedding?.model || 'Xenova/nomic-embed-text-v1.5',
          tokensUsed: 0,
        });
      }

      return results;
    } catch (err: any) {
      throw new ProviderError(this.name, `Local Embedding Batch error: ${err.message}`, err);
    }
  }
}
