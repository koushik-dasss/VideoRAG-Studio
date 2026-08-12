/**
 * Speech Recognition Service — high-level orchestration layer for
 * audio-to-text transcription.
 *
 * Uses Dependency Injection and the Strategy/Factory pattern to select
 * and execute the appropriate speech provider (`whisper`, `faster-whisper`, etc.).
 */

import type { AppConfig } from '../config/index';
import { ValidationError, ProviderError } from '../errors/index';
import type {
  ISpeechRecognitionService,
  ISpeechRecognitionProvider,
  TranscriptionResult,
  IProviderFactory,
} from '../interfaces/index';
import { Worker as ThreadWorker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../utils/logger';

const log = createLogger('SpeechRecognitionService');

export class SpeechRecognitionService implements ISpeechRecognitionService {
  private readonly config: AppConfig;
  private readonly providerFactory: IProviderFactory<ISpeechRecognitionProvider>;
  private readonly providerOverride?: ISpeechRecognitionProvider;

  constructor(
    config: AppConfig,
    providerFactory: IProviderFactory<ISpeechRecognitionProvider>,
    providerOverride?: ISpeechRecognitionProvider,
  ) {
    this.config = config;
    this.providerFactory = providerFactory;
    this.providerOverride = providerOverride;
    log.info('SpeechRecognitionService initialised');
  }

  /**
   * Transcribe an audio file into structured segments with word-level timings.
   */
  async transcribe(audioPath: string, language?: string): Promise<TranscriptionResult> {
    if (!audioPath || audioPath.trim().length === 0) {
      throw new ValidationError('Audio path is required for transcription', {
        audioPath: ['Must be a non-empty file path string'],
      });
    }

    const startMs = Date.now();
    const providerName = this.config.speechProvider || 'faster-whisper';
    log.info(`Starting transcription for "${audioPath}"`, { providerName, language });

    if (providerName === 'faster-whisper' && !this.providerOverride) {
      log.info(`Offloading faster-whisper transcription to background worker thread for "${audioPath}"`);
      return new Promise<TranscriptionResult>((resolve, reject) => {
        let wrapperPath = path.join(__dirname, '../workers/transcriptionThreadWrapper.js');
        if (!fs.existsSync(wrapperPath)) {
          wrapperPath = path.join(__dirname, '../workers/transcriptionThread.ts');
        }
        const worker = new ThreadWorker(wrapperPath, {
          workerData: { audioPath, language }
        });

        worker.on('message', (msg) => {
          if (msg.success) {
            log.info(`Worker thread transcription completed in ${Date.now() - startMs}ms`);
            resolve(msg.result);
          } else {
            reject(new Error(msg.error));
          }
        });

        worker.on('error', (err) => {
          log.error('Transcription worker thread error', { error: err.message });
          reject(err);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Transcription worker thread stopped with exit code ${code}`));
          }
        });
      });
    }

    const provider =
      this.providerOverride ?? this.providerFactory.create(providerName);

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new ProviderError(
        provider.name,
        `Speech provider "${provider.name}" is currently unavailable`,
      );
    }

    try {
      const result = await provider.transcribe(audioPath, language);

      const elapsedMs = Date.now() - startMs;

      log.info(`Transcription completed successfully in ${elapsedMs}ms`, {
        audioPath,
        provider: provider.name,
        segmentsCount: result.segments.length,
        durationSeconds: result.durationSeconds,
      });

      return result;
    } catch (err) {
      log.error(`Transcription failed`, {
        audioPath,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}

