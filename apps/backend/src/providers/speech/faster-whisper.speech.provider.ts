import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import fs from 'fs';
import { WaveFile } from 'wavefile';
import type { AppConfig } from '../../config/index';
import type {
  ISpeechRecognitionProvider,
  TranscriptionResult,
} from '../../interfaces/index';
import { BaseProvider } from '../base.provider';
import { ProviderError } from '../../errors/index';
import { createLogger } from '../../utils/logger';

const log = createLogger('FasterWhisperSpeechProvider');

// Configure Transformers.js to use local cache and avoid downloading if already present
env.allowLocalModels = true;
env.useBrowserCache = false;

export class FasterWhisperSpeechProvider extends BaseProvider implements ISpeechRecognitionProvider {
  public readonly name = 'faster-whisper';
  private transcriber: any = null;

  constructor(config: AppConfig) {
    super(config);
  }

  private async initTranscriber(modelName: string) {
    if (this.transcriber) return;
    try {
      this.transcriber = await pipeline('automatic-speech-recognition', modelName);
      log.info(`Initialized Faster-Whisper pipeline with model: ${modelName}`);
    } catch (err: any) {
      log.error(`Failed to initialize Faster-Whisper pipeline: ${err.message}`);
      throw err;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Ensure model is available, initialize pipeline if not
      if (!this.transcriber) {
        const modelName = this.config.fasterWhisper.model || 'Xenova/whisper-base';
        await this.initTranscriber(modelName);
      }
      return true;
    } catch (err: any) {
      log.error(`Faster-Whisper availability check failed: ${err.message}`);
      return false;
    }
  }

  async transcribe(audioPath: string, language?: string): Promise<TranscriptionResult> {
    log.info(`Starting transcription for ${audioPath} using ${this.name}`);
    const startMs = Date.now();

    try {
      if (!this.transcriber) {
        const modelName = this.config.fasterWhisper.model || 'Xenova/whisper-base';
        await this.initTranscriber(modelName);
      }

      // Convert audioPath to absolute if it isn't already, although Xenova can read from local file path or URL
      const resolvedPath = path.resolve(audioPath);

      // Read audio file and convert to Float32Array for transformers.js
      const buffer = fs.readFileSync(resolvedPath);
      const wav = new WaveFile(buffer);
      wav.toBitDepth('32f');
      if ((wav.fmt as any).sampleRate !== 16000) {
        wav.toSampleRate(16000);
      }
      let audioData = wav.getSamples();
      if (Array.isArray(audioData)) {
        if (audioData.length > 0 && audioData[0] instanceof Float64Array) {
          audioData = audioData[0];
        } else if (audioData.length > 0) {
          audioData = audioData[0];
        }
      }
      const audioFloat32 = new Float32Array(audioData as any);

      // Perform transcription in 60-second windowed chunks to keep ONNX runtime fast and memory efficient
      const chunkSize = 60 * 16000;
      const totalSamples = audioFloat32.length;
      const segments: any[] = [];
      let fullText = '';
      let totalDuration = 0;

      for (let offset = 0; offset < totalSamples; offset += chunkSize) {
        // Yield event loop so Express can handle concurrent HTTP requests during CPU processing
        await new Promise((resolve) => setTimeout(resolve, 50));

        const slice = audioFloat32.subarray(offset, Math.min(offset + chunkSize, totalSamples));
        const timeOffset = offset / 16000;

        const res = await this.transcriber(slice, {
          chunk_length_s: 30,
          stride_length_s: 5,
          return_timestamps: true,
          language: language || 'english',
        });

        if (res.text) {
          fullText += (fullText ? ' ' : '') + res.text.trim();
        }

        const subChunks = res.chunks || [];
        subChunks.forEach((chunk: any) => {
          const startTime = (chunk.timestamp[0] || 0) + timeOffset;
          const endTime = (chunk.timestamp[1] || (chunk.timestamp[0] || 0) + 5) + timeOffset;
          totalDuration = Math.max(totalDuration, endTime);

          segments.push({
            id: segments.length,
            text: chunk.text.trim(),
            startTime: Math.round(startTime * 10) / 10,
            endTime: Math.round(endTime * 10) / 10,
            words: [],
            confidence: 0.95,
            language: language || 'en',
          });
        });
      }

      log.info(`Transcription complete for ${audioPath} in ${Date.now() - startMs}ms`);

      return {
        segments,
        fullText,
        language: language || 'en',
        durationSeconds: totalDuration,
        metadata: {
          audioPath,
          provider: this.name,
          processingTimeMs: Date.now() - startMs,
        },
      };
    } catch (err: any) {
      throw new ProviderError(this.name, `Faster-Whisper transcription failed: ${err.message}`, err);
    }
  }
}
