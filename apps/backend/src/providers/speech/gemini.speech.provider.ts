/**
 * Gemini Speech Provider — uses Google's Gemini API for audio transcription.
 *
 * Dramatically faster than local Whisper ONNX inference (~10-15s vs ~7min)
 * because it offloads transcription to Google's cloud infrastructure.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { AppConfig } from '../../config/index';
import type {
  ISpeechRecognitionProvider,
  TranscriptionResult,
} from '../../interfaces/index';
import { BaseProvider } from '../base.provider';
import { ProviderError } from '../../errors/index';
import { createLogger } from '../../utils/logger';

const log = createLogger('GeminiSpeechProvider');

export class GeminiSpeechProvider extends BaseProvider implements ISpeechRecognitionProvider {
  public readonly name = 'gemini-speech';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: AppConfig) {
    super(config);
    this.apiKey = config.gemini.apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  async transcribe(audioPath: string, language?: string): Promise<TranscriptionResult> {
    log.info(`Starting transcription for ${audioPath} using Gemini API`);
    const startMs = Date.now();

    try {
      const resolvedPath = path.resolve(audioPath);
      const audioBuffer = fs.readFileSync(resolvedPath);
      const base64Audio = audioBuffer.toString('base64');

      // Determine MIME type from file extension
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.mp4': 'audio/mp4',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac',
        '.webm': 'audio/webm',
      };
      const mimeType = mimeMap[ext] || 'audio/wav';

      const lang = language || 'en';
      const model = this.config.gemini.model || 'gemini-3.5-flash';

      const prompt = `You are an expert transcription system. Transcribe the following audio file accurately.

Return ONLY a valid JSON object in this exact format (no markdown, no code fences):
{
  "segments": [
    {
      "id": 0,
      "text": "transcribed text for this segment",
      "startTime": 0.0,
      "endTime": 5.0
    }
  ],
  "fullText": "complete transcribed text",
  "durationSeconds": 120.0
}

Rules:
- Split the transcript into segments of roughly 5-15 seconds each
- Provide accurate timestamps for each segment
- Use proper punctuation and capitalization
- The language is: ${lang}
- Return ONLY the JSON object, nothing else`;

      const response = await axios.post(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Audio,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.config.gemini.timeoutMs * 3, // Allow more time for audio
          maxContentLength: 200 * 1024 * 1024, // 200MB
          maxBodyLength: 200 * 1024 * 1024,
        },
      );

      const candidate = response.data?.candidates?.[0];
      if (!candidate) {
        throw new ProviderError(this.name, 'Gemini returned no candidates for transcription');
      }

      const rawText = candidate.content.parts.map((p: { text: string }) => p.text).join('');

      // Parse the JSON response
      let parsed: { segments: any[]; fullText: string; durationSeconds: number };
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // If JSON parsing fails, treat the entire response as plain text
        log.warn('Failed to parse Gemini transcription as JSON, using raw text fallback');
        parsed = {
          segments: [{ id: 0, text: rawText.trim(), startTime: 0, endTime: 60 }],
          fullText: rawText.trim(),
          durationSeconds: 60,
        };
      }

      const segments = (parsed.segments || []).map((seg: any, index: number) => ({
        id: seg.id ?? index,
        text: (seg.text || '').trim(),
        startTime: seg.startTime ?? 0,
        endTime: seg.endTime ?? (seg.startTime ?? 0) + 5,
        words: [],
        confidence: 0.95,
        language: lang,
      }));

      const fullText = parsed.fullText || segments.map((s: any) => s.text).join(' ');
      const durationSeconds = parsed.durationSeconds || (segments.length > 0
        ? segments[segments.length - 1].endTime
        : 0);

      const elapsedMs = Date.now() - startMs;
      log.info(`Gemini transcription complete for ${audioPath} in ${elapsedMs}ms`, {
        segmentsCount: segments.length,
        durationSeconds,
      });

      return {
        segments,
        fullText,
        language: lang,
        durationSeconds,
        metadata: {
          audioPath,
          provider: this.name,
          processingTimeMs: elapsedMs,
        },
      };
    } catch (err: any) {
      if (err instanceof ProviderError) throw err;
      
      // Check for specific Gemini API errors
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.error?.message || err.message;
        throw new ProviderError(
          this.name,
          `Gemini Speech API error (${status}): ${detail}`,
          err,
        );
      }
      
      throw new ProviderError(this.name, `Gemini transcription failed: ${err.message}`, err);
    }
  }
}
