import { getConfig } from '../../config';
import { IEmbeddingProvider } from '../../interfaces';
import { MockEmbeddingProvider } from './mock.embedding.provider';
import { LocalEmbeddingProvider } from './local.embedding.provider';

export class EmbeddingProviderFactory {
  static createProvider(): IEmbeddingProvider {
    const config = getConfig();
    const provider = config.embeddingProvider || 'local';

    if (provider === 'local') {
      return new LocalEmbeddingProvider(config);
    }
    
    // Fallback or explicit mock handling
    if (provider === 'mock' || config.app.env === 'development') {
      // "Mock Provider may ONLY be used when NODE_ENV=development OR embeddingProvider=mock."
      return new MockEmbeddingProvider(config);
    }
    
    if (config.app.env === 'production') {
      throw new Error(`Provider ${provider} is not implemented and cannot downgrade to mock in production.`);
    }
    
    return new MockEmbeddingProvider(config);
  }
}
