/**
 * Chapter Generation Service — coordinates LLM interaction and prompt rendering
 * to generate structured video chapters (`GeneratedChapter[]`) from chunked transcripts.
 */

import { ProviderError, ValidationError } from '../errors/index';
import type {
  ChapterGenerationResult,
  GeneratedChapter,
  IChapterGenerationService,
  ILLMProvider,
  IPromptTemplateEngine,
  TranscriptionSegment,
} from '../interfaces/index';
import { createLogger } from '../utils/logger';

const log = createLogger('ChapterGenerationService');

export interface ChapterGenerationOptions {
  templateName?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export class ChapterGenerationService implements IChapterGenerationService {
  private readonly llmProvider: ILLMProvider;
  private readonly promptEngine: IPromptTemplateEngine;
  private readonly templateName: string;
  private readonly systemPrompt?: string;
  private readonly temperature: number;
  private readonly maxTokens?: number;

  constructor(
    llmProvider: ILLMProvider,
    promptEngine: IPromptTemplateEngine,
    options?: ChapterGenerationOptions,
  ) {
    if (!llmProvider) {
      throw new ValidationError('LLMProvider is required for ChapterGenerationService');
    }
    if (!promptEngine) {
      throw new ValidationError('PromptTemplateEngine is required for ChapterGenerationService');
    }

    this.llmProvider = llmProvider;
    this.promptEngine = promptEngine;
    this.templateName = options?.templateName ?? 'chapter_generation';
    this.systemPrompt =
      options?.systemPrompt ?? 'You are a precise video chapter generator. Always return valid JSON.';
    this.temperature = options?.temperature ?? 0.3;
    this.maxTokens = options?.maxTokens;

    log.info('ChapterGenerationService initialised', {
      provider: this.llmProvider.name,
      template: this.templateName,
      temperature: this.temperature,
    });
  }

  /**
   * Generate chapters (`ChapterGenerationResult`) from semantic segments.
   */
  async generate(
    segments: TranscriptionSegment[][],
    videoTitle?: string,
  ): Promise<ChapterGenerationResult> {
    const startMs = Date.now();

    if (!Array.isArray(segments) || segments.length === 0) {
      return {
        chapters: [],
        modelUsed: this.llmProvider.name,
        tokensUsed: 0,
        processingTimeMs: Date.now() - startMs,
      };
    }

    log.info('Generating chapters for video', {
      chunksCount: segments.length,
      videoTitle: videoTitle ?? 'Untitled',
    });

    // Format chunked segments into readable text for prompt substitution
    const chunksText = segments
      .map((chunk, index) => {
        if (!Array.isArray(chunk) || chunk.length === 0) {
          return `[Chunk ${index + 1} | empty]`;
        }
        const firstSeg = chunk[0];
        const lastSeg = chunk[chunk.length - 1];
        if (!firstSeg || !lastSeg) {
          return `[Chunk ${index + 1} | empty]`;
        }
        const start = firstSeg.startTime;
        const end = lastSeg.endTime;
        const text = chunk.map((s) => s.text).join(' ');
        return `[Chunk ${index + 1} | ${start.toFixed(1)}s - ${end.toFixed(1)}s]: ${text}`;
      })
      .join('\n\n');

    let prompt: string;
    try {
      prompt = this.promptEngine.render(this.templateName, {
        videoTitle: videoTitle ?? 'Untitled Video',
        chunksText,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('Failed to render chapter generation prompt', { error: error.message });
      throw error;
    }

    try {
      const response = await this.llmProvider.complete({
        prompt,
        systemPrompt: this.systemPrompt,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        responseFormat: 'json',
      });

      const parsedChapters = this.parseAndValidateResponse(response.content, segments);
      const processingTimeMs = Date.now() - startMs;

      log.info('Successfully generated chapters', {
        chaptersCount: parsedChapters.length,
        model: response.model,
        tokensUsed: response.tokensUsed.total,
        processingTimeMs,
      });

      return {
        chapters: parsedChapters,
        modelUsed: response.model,
        tokensUsed: response.tokensUsed.total,
        processingTimeMs,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (error instanceof ProviderError || error instanceof ValidationError) {
        throw error;
      }
      log.error('Chapter generation failed during LLM completion or parsing', { error: error.message });
      throw new ProviderError(this.llmProvider.name, `Failed to generate chapters: ${error.message}`, error);
    }
  }

  /**
   * Helper to parse and normalize JSON string returned from LLM.
   */
  private parseAndValidateResponse(
    rawContent: string,
    segments: TranscriptionSegment[][],
  ): GeneratedChapter[] {
    // Extract JSON object or array from potential markdown fences or surrounding prose
    let cleanContent = rawContent.trim();
    const jsonMatch = cleanContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    } else {
      cleanContent = cleanContent.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new ProviderError(
        this.llmProvider.name,
        `LLM returned malformed JSON: ${cleanContent.slice(0, 100)}...`,
        error,
      );
    }

    const rawArray =
      Array.isArray(parsed) ? parsed : (parsed as { chapters?: unknown[] })?.chapters ?? [];

    if (!Array.isArray(rawArray)) {
      throw new ProviderError(
        this.llmProvider.name,
        'LLM response JSON did not contain a valid array of chapters',
      );
    }

    return rawArray.map((item, idx) => {
      const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;

      const fallbackChunk = segments[idx];
      const fallbackStart = fallbackChunk?.[0]?.startTime ?? 0;
      const fallbackEnd = fallbackChunk?.[fallbackChunk.length - 1]?.endTime ?? fallbackStart;

      const title =
        typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : `Chapter ${idx + 1}`;
      const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';

      const startTime = typeof obj.startTime === 'number' ? obj.startTime : Number(obj.startTime ?? fallbackStart);
      const endTime = typeof obj.endTime === 'number' ? obj.endTime : Number(obj.endTime ?? fallbackEnd);

      let keywords: string[] = [];
      if (Array.isArray(obj.keywords)) {
        keywords = obj.keywords.map(String);
      } else if (Array.isArray(obj.tags)) {
        keywords = obj.tags.map(String);
      }

      return {
        index: typeof obj.index === 'number' ? obj.index : idx + 1,
        title,
        summary,
        startTime: Number.isNaN(startTime) ? fallbackStart : startTime,
        endTime: Number.isNaN(endTime) ? fallbackEnd : endTime,
        keywords,
      };
    });
  }
}
