/**
 * Provider Factory — Strategy pattern implementation that resolves
 * the correct AI provider at runtime based on configuration.
 *
 * Falls back to mock providers when real API keys are not configured.
 */

import type { AppConfig } from '../../config/index';
import { AI_PROVIDERS } from '../../constants/index';
import { ConfigurationError } from '../../errors/index';
import type {
  ILLMProvider,
  ISpeechRecognitionProvider,
  IEmbeddingProvider,
  IProviderFactory,
} from '../../interfaces/index';
import { createLogger } from '../../utils/logger';
import { MockEmbeddingProvider } from '../embedding/mock.embedding.provider';
import { GeminiLLMProvider } from '../llm/gemini.llm.provider';
import { MockLLMProvider } from '../llm/mock.llm.provider';
import { MockSpeechProvider } from '../speech/mock.speech.provider';
import { FasterWhisperSpeechProvider } from '../speech/faster-whisper.speech.provider';
import { GeminiSpeechProvider } from '../speech/gemini.speech.provider';
import { LocalEmbeddingProvider } from '../embedding/local.embedding.provider';
import { OllamaEmbeddingProvider } from '../embedding/ollama.embedding.provider';

const log = createLogger('ProviderFactory');

// ──────────────────────────────────────────────────────────────────────────────
// LLM Factory
// ──────────────────────────────────────────────────────────────────────────────

export class LLMProviderFactory implements IProviderFactory<ILLMProvider> {
  private readonly config: AppConfig;
  private readonly providers = new Map<string, ILLMProvider>();

  constructor(config: AppConfig) {
    this.config = config;
  }

  create(providerName: string): ILLMProvider {
    const cached = this.providers.get(providerName);
    if (cached) {
      return cached;
    }

    let provider: ILLMProvider;

    switch (providerName) {
      case AI_PROVIDERS.GEMINI:
        provider = new GeminiLLMProvider(this.config);
        break;
      case AI_PROVIDERS.LOCAL_LLM:
      case 'mock':
        provider = new MockLLMProvider(this.config);
        break;
      default:
        throw new ConfigurationError(`Unknown LLM provider: "${providerName}"`);
    }

    this.providers.set(providerName, provider);
    log.info(`LLM provider created: ${providerName}`);
    return provider;
  }

  /** Return a provider that is actually configured and available */
  async createAvailable(preferred?: string): Promise<ILLMProvider> {
    if (preferred) {
      const p = this.create(preferred);
      if (await p.isAvailable()) {
        return p;
      }
      log.warn(`Preferred LLM provider "${preferred}" is not available, trying fallbacks`);
    }

    // Try each provider in order of preference
    const order = [AI_PROVIDERS.GEMINI, AI_PROVIDERS.LOCAL_LLM];
    for (const name of order) {
      const p = this.create(name);
      if (await p.isAvailable()) {
        log.info(`Using LLM provider: ${name}`);
        return p;
      }
    }

    // Last resort — mock provider for development
    log.warn('No real LLM providers available — using mock provider');
    const mock = new MockLLMProvider(this.config);
    this.providers.set('mock', mock);
    return mock;
  }

  getAvailableProviders(): string[] {
    return [AI_PROVIDERS.GEMINI, AI_PROVIDERS.LOCAL_LLM, 'mock'];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Speech Factory
// ──────────────────────────────────────────────────────────────────────────────

export class SpeechProviderFactory implements IProviderFactory<ISpeechRecognitionProvider> {
  private readonly config: AppConfig;
  private readonly providers = new Map<string, ISpeechRecognitionProvider>();

  constructor(config: AppConfig) {
    this.config = config;
  }

  create(providerName: string): ISpeechRecognitionProvider {
    const cached = this.providers.get(providerName);
    if (cached) {
      return cached;
    }

    let provider: ISpeechRecognitionProvider;

    switch (providerName) {
      case AI_PROVIDERS.FASTER_WHISPER:
        provider = new FasterWhisperSpeechProvider(this.config);
        break;
      case AI_PROVIDERS.GEMINI_SPEECH:
        provider = new GeminiSpeechProvider(this.config);
        break;
      case 'mock':
        provider = new MockSpeechProvider(this.config);
        break;
      default:
        throw new ConfigurationError(`Unknown speech provider: "${providerName}"`);
    }

    this.providers.set(providerName, provider);
    log.info(`Speech provider created: ${providerName}`);
    return provider;
  }

  getAvailableProviders(): string[] {
    return [AI_PROVIDERS.FASTER_WHISPER, AI_PROVIDERS.GEMINI_SPEECH, 'mock'];
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Embedding Factory
// ──────────────────────────────────────────────────────────────────────────────

export class EmbeddingProviderFactory implements IProviderFactory<IEmbeddingProvider> {
  private readonly config: AppConfig;
  private readonly providers = new Map<string, IEmbeddingProvider>();

  constructor(config: AppConfig) {
    this.config = config;
  }

  create(providerName: string): IEmbeddingProvider {
    const cached = this.providers.get(providerName);
    if (cached) {
      return cached;
    }

    let provider: IEmbeddingProvider;

    switch (providerName) {
      case 'local':
        provider = new LocalEmbeddingProvider(this.config);
        break;
      case 'ollama':
        provider = new OllamaEmbeddingProvider(this.config);
        break;
      case 'mock':
        provider = new MockEmbeddingProvider(this.config);
        break;
      default:
        throw new ConfigurationError(`Unknown embedding provider: "${providerName}"`);
    }

    this.providers.set(providerName, provider);
    log.info(`Embedding provider created: ${providerName}`);
    return provider;
  }

  getAvailableProviders(): string[] {
    return ['local', 'mock', 'ollama'];
  }
}
