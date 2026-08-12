/**
 * Mock Speech Recognition Provider — returns deterministic transcription
 * segments for testing and local development.
 */

import type { AppConfig } from '../../config/index';
import type {
  ISpeechRecognitionProvider,
  TranscriptionResult,
} from '../../interfaces/index';
import { BaseProvider } from '../base.provider';

export class MockSpeechProvider extends BaseProvider implements ISpeechRecognitionProvider {
  public readonly name = 'mock-speech';

  constructor(config: AppConfig) {
    super(config);
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  transcribe(audioPath: string, language?: string): Promise<TranscriptionResult> {
    return Promise.resolve({
      segments: [
        {
          id: 0,
          text: 'Welcome to this presentation. Today we will discuss the fundamentals of AI.',
          startTime: 0,
          endTime: 10,
          words: [
            { word: 'Welcome', startTime: 0, endTime: 0.5, confidence: 0.99 },
            { word: 'to', startTime: 0.5, endTime: 0.7, confidence: 0.99 },
            { word: 'this', startTime: 0.7, endTime: 0.9, confidence: 0.98 },
            { word: 'presentation', startTime: 0.9, endTime: 1.5, confidence: 0.97 },
          ],
          confidence: 0.98,
          language: language ?? 'en',
        },
        {
          id: 1,
          text: 'Machine learning is a subset of artificial intelligence that focuses on data-driven models.',
          startTime: 10,
          endTime: 22,
          words: [],
          confidence: 0.96,
          language: language ?? 'en',
        },
        {
          id: 2,
          text: 'Deep learning uses neural networks with many layers to learn complex patterns.',
          startTime: 22,
          endTime: 34,
          words: [],
          confidence: 0.95,
          language: language ?? 'en',
        },
        {
          id: 3,
          text: 'Thank you for watching. Please like and subscribe.',
          startTime: 34,
          endTime: 42,
          words: [],
          confidence: 0.99,
          language: language ?? 'en',
        },
      ],
      fullText:
        'Welcome to this presentation. Today we will discuss the fundamentals of AI. ' +
        'Machine learning is a subset of artificial intelligence that focuses on data-driven models. ' +
        'Deep learning uses neural networks with many layers to learn complex patterns. ' +
        'Thank you for watching. Please like and subscribe.',
      language: language ?? 'en',
      durationSeconds: 42,
      metadata: { audioPath, provider: this.name },
    });
  }
}
