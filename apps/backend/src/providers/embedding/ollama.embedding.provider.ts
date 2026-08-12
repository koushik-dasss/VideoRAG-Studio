import axios from 'axios';
import type { AppConfig } from '../../config/index';
import type { IEmbeddingProvider, EmbeddingResult } from '../../interfaces/index';
import { BaseProvider } from '../base.provider';
import { ProviderError } from '../../errors/index';
import { createLogger } from '../../utils/logger';

const log = createLogger('OllamaEmbeddingProvider');

interface OllamaEmbeddingResponse {
  embedding: number[];
}

export class OllamaEmbeddingProvider extends BaseProvider implements IEmbeddingProvider {
  public readonly name = 'ollama';
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: AppConfig) {
    super(config);
    this.baseUrl = config.ollama.baseUrl;
    this.model = config.ollama.model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if Ollama is running and responsive
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      return response.status === 200;
    } catch (err: any) {
      log.error(`Ollama availability check failed: ${err.message}`);
      return false;
    }
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const startMs = Date.now();
    try {
      const response = await axios.post<OllamaEmbeddingResponse>(
        `${this.baseUrl}/api/embeddings`,
        {
          model: this.model,
          prompt: text,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        }
      );

      if (!response.data.embedding || !Array.isArray(response.data.embedding)) {
        throw new ProviderError(this.name, 'Ollama returned an invalid embedding format');
      }

      log.debug(`Ollama embedded text in ${Date.now() - startMs}ms`);

      return {
        vector: response.data.embedding,
        model: this.model,
        tokensUsed: 0, // Ollama embedding API doesn't currently return token count
      };
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        throw new ProviderError(
          this.name,
          `Ollama API error: ${err.response?.status ?? 'unknown'} — ${err.message}`,
          err
        );
      }
      throw new ProviderError(this.name, `Ollama Embedding error: ${err.message}`, err);
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    // We process sequentially for Ollama to prevent overloading local GPU/CPU
    for (const text of texts) {
      try {
        const result = await this.embed(text);
        results.push(result);
      } catch (err: any) {
        throw new ProviderError(this.name, `Ollama Batch Embedding error: ${err.message}`, err);
      }
    }

    return results;
  }
}
