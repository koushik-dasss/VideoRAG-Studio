/**
 * Mock Embedding Provider — returns deterministic vectors for testing.
 */

import type { AppConfig } from '../../config/index';
import type {
  IEmbeddingProvider,
  EmbeddingResult,
} from '../../interfaces/index';
import { BaseProvider } from '../base.provider';

export class MockEmbeddingProvider extends BaseProvider implements IEmbeddingProvider {
  public readonly name = 'mock-embedding';
  private readonly dimensions = 256;

  constructor(config: AppConfig) {
    super(config);
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  embed(text: string): Promise<EmbeddingResult> {
    return Promise.resolve({
      vector: this.generateDeterministicVector(text),
      model: this.name,
      tokensUsed: Math.ceil(text.split(/\s+/).length * 1.3),
    });
  }

  embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.resolve(
      texts.map((t) => ({
        vector: this.generateDeterministicVector(t),
        model: this.name,
        tokensUsed: Math.ceil(t.split(/\s+/).length * 1.3),
      })),
    );
  }

  /**
   * Generate a deterministic vector from text content so that the same
   * input always produces the same embedding — essential for test assertions.
   */
  private generateDeterministicVector(text: string): number[] {
    const vector: number[] = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    for (let i = 0; i < this.dimensions; i++) {
      hash = (hash * 1103515245 + 12345) | 0;
      vector.push(((hash >>> 16) & 0x7fff) / 0x7fff);
    }
    return vector;
  }
}
