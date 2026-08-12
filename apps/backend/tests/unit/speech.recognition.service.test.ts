import { describe, it, expect, beforeEach } from 'vitest';

import { loadConfig } from '../../src/config/index';
import { ValidationError, ProviderError } from '../../src/errors/index';
import type { ISpeechRecognitionProvider } from '../../src/interfaces/index';
import { SpeechProviderFactory } from '../../src/providers/factory/provider.factory';
import { SpeechRecognitionService } from '../../src/services/speech.recognition.service';

describe('SpeechRecognitionService', () => {
  const config = loadConfig();
  let factory: SpeechProviderFactory;
  let service: SpeechRecognitionService;

  beforeEach(() => {
    config.speechProvider = 'mock';
    factory = new SpeechProviderFactory(config);
    service = new SpeechRecognitionService(config, factory);
  });

  it('transcribes valid audio path successfully using configured provider', async () => {
    const result = await service.transcribe('/audio/sample.mp3', 'en');

    expect(result).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.fullText).toContain('Welcome to this presentation');
    expect(result.language).toBe('en');
  });

  it('throws ValidationError when audioPath is empty or whitespace', async () => {
    await expect(service.transcribe('')).rejects.toThrow(ValidationError);
    await expect(service.transcribe('   ')).rejects.toThrow(ValidationError);
  });

  it('throws ProviderError when provider is not available', async () => {
    const unavailableProvider: ISpeechRecognitionProvider = {
      name: 'broken-whisper',
      isAvailable: () => Promise.resolve(false),
      transcribe: () => Promise.reject(new Error('Should not be called')),
    };

    const overrideService = new SpeechRecognitionService(
      config,
      factory,
      unavailableProvider,
    );

    await expect(overrideService.transcribe('/audio/test.mp3')).rejects.toThrow(ProviderError);
  });

  it('propagates errors thrown by the provider during transcription', async () => {
    const failingProvider: ISpeechRecognitionProvider = {
      name: 'failing-whisper',
      isAvailable: () => Promise.resolve(true),
      transcribe: () => Promise.reject(new Error('API rate limit exceeded')),
    };

    const overrideService = new SpeechRecognitionService(
      config,
      factory,
      failingProvider,
    );

    await expect(overrideService.transcribe('/audio/test.mp3')).rejects.toThrow(
      'API rate limit exceeded',
    );
  });
});
