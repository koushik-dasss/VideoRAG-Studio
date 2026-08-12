/**
 * Gemini LLM Provider — production-ready implementation for
 * Google's Gemini API.
 */

import axios from 'axios';

import type { AppConfig } from '../../config/index';
import { ProviderError, ProviderTimeoutError, ProviderRateLimitError } from '../../errors/index';
import type {
  ILLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
} from '../../interfaces/index';
import { createLogger } from '../../utils/logger';
import { BaseProvider } from '../base.provider';

const log = createLogger('GeminiLLMProvider');

interface GeminiContent {
  parts: { text: string }[];
  role: string;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
}

interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata: GeminiUsageMetadata;
  modelVersion: string;
}

export class GeminiLLMProvider extends BaseProvider implements ILLMProvider {
  public readonly name = 'gemini';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: AppConfig) {
    super(config);
    this.apiKey = config.gemini.apiKey;
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(this.apiKey.length > 0);
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const contents: GeminiContent[] = [];

    if (request.systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `System instruction: ${request.systemPrompt}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow those instructions.' }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: request.prompt }] });

    const model = this.config.gemini.model;

    try {
      const response = await axios.post<GeminiResponse>(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents,
          generationConfig: {
            maxOutputTokens: request.maxTokens ?? this.config.gemini.maxTokens,
            temperature: request.temperature ?? 0.3,
            ...(request.responseFormat === 'json'
              ? { responseMimeType: 'application/json' }
              : {}),
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.config.gemini.timeoutMs,
        },
      );

      const candidate = response.data.candidates[0];
      if (!candidate) {
        throw new ProviderError(this.name, 'Gemini returned no candidates');
      }

      const text = candidate.content.parts.map((p) => p.text).join('');

      log.debug('Gemini completion successful', { model: response.data.modelVersion ?? model });
      return {
        content: text,
        model: response.data.modelVersion ?? model,
        tokensUsed: {
          prompt: response.data.usageMetadata.promptTokenCount,
          completion: response.data.usageMetadata.candidatesTokenCount,
          total: response.data.usageMetadata.totalTokenCount,
        },
        finishReason: candidate.finishReason,
      };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          throw new ProviderTimeoutError(this.name, this.config.gemini.timeoutMs);
        }
        if (err.response?.status === 429) {
          throw new ProviderRateLimitError(this.name);
        }
        throw new ProviderError(
          this.name,
          `Gemini API error: ${err.response?.status ?? 'unknown'} — ${err.message}`,
          err,
        );
      }
      throw err;
    }
  }
}
