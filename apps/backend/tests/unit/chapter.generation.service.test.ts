import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';

import { ProviderError, ValidationError } from '../../src/errors/index';
import type { ILLMProvider, IPromptTemplateEngine, TranscriptionSegment } from '../../src/interfaces/index';
import { ChapterGenerationService } from '../../src/services/chapter.generation.service';

describe('ChapterGenerationService', () => {
  let mockLLM: ILLMProvider;
  let mockPromptEngine: IPromptTemplateEngine;
  let service: ChapterGenerationService;
  let completeMock: MockInstance;
  let renderMock: MockInstance;

  beforeEach(() => {
    completeMock = vi.fn().mockResolvedValue({
      content: JSON.stringify({
        chapters: [
          {
            index: 1,
            title: 'Introduction',
            summary: 'Welcome to the video.',
            startTime: 0,
            endTime: 15,
            tags: ['intro', 'welcome'],
          },
          {
            index: 2,
            title: 'Core Concepts',
            summary: 'Deep dive into semantic search.',
            startTime: 15,
            endTime: 45,
            keywords: ['search', 'semantics'],
          },
        ],
      }),
      model: 'test-llm-model',
      tokensUsed: { prompt: 50, completion: 100, total: 150 },
      finishReason: 'stop',
    });

    renderMock = vi.fn().mockReturnValue('rendered prompt text');

    mockLLM = {
      name: 'test-llm',
      isAvailable: () => true,
      complete: completeMock,
    };

    mockPromptEngine = {
      render: renderMock,
      registerTemplate: vi.fn(),
      hasTemplate: vi.fn().mockReturnValue(true),
    };

    service = new ChapterGenerationService(mockLLM, mockPromptEngine);
  });

  it('throws ValidationError when initialized without required dependencies', () => {
    // @ts-expect-error missing args
    expect(() => new ChapterGenerationService(null, mockPromptEngine)).toThrow(ValidationError);
    // @ts-expect-error missing args
    expect(() => new ChapterGenerationService(mockLLM, null)).toThrow(ValidationError);
  });

  it('returns empty result when segments array is empty', async () => {
    const result = await service.generate([]);
    expect(result.chapters).toEqual([]);
    expect(result.tokensUsed).toBe(0);
    expect(completeMock).not.toHaveBeenCalled();
  });

  it('renders prompt and calls LLM completion with JSON format', async () => {
    const segments: TranscriptionSegment[][] = [
      [
        { id: 1, text: 'Welcome to the video.', startTime: 0, endTime: 15, words: [], confidence: 0.95 },
      ],
      [
        { id: 2, text: 'Deep dive into semantic search.', startTime: 15, endTime: 45, words: [], confidence: 0.95 },
      ],
    ];

    const result = await service.generate(segments, 'Test Video');

    expect(renderMock).toHaveBeenCalledTimes(1);
    const callArgs = renderMock.mock.calls[0] as [string, { videoTitle: string; chunksText: string }];
    expect(callArgs[0]).toBe('chapter_generation');
    expect(callArgs[1].videoTitle).toBe('Test Video');
    expect(callArgs[1].chunksText).toContain('[Chunk 1 | 0.0s - 15.0s]');

    expect(completeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'rendered prompt text',
        responseFormat: 'json',
        temperature: 0.3,
      }),
    );

    expect(result.modelUsed).toBe('test-llm-model');
    expect(result.tokensUsed).toBe(150);
    expect(result.chapters).toHaveLength(2);

    const firstChapter = result.chapters[0];
    const secondChapter = result.chapters[1];
    if (!firstChapter || !secondChapter) {
      throw new Error('Missing chapters');
    }

    expect(firstChapter).toEqual({
      index: 1,
      title: 'Introduction',
      summary: 'Welcome to the video.',
      startTime: 0,
      endTime: 15,
      keywords: ['intro', 'welcome'],
    });
    expect(secondChapter).toEqual({
      index: 2,
      title: 'Core Concepts',
      summary: 'Deep dive into semantic search.',
      startTime: 15,
      endTime: 45,
      keywords: ['search', 'semantics'],
    });
  });

  it('handles markdown code block wrapped JSON from LLM', async () => {
    completeMock.mockResolvedValue({
      content: '```json\n{"chapters": [{"title": "Wrapped Chapter", "startTime": 0, "endTime": 10}]}\n```',
      model: 'test-llm-model',
      tokensUsed: { prompt: 10, completion: 20, total: 30 },
      finishReason: 'stop',
    });

    const segments: TranscriptionSegment[][] = [
      [{ id: 1, text: 'Test text.', startTime: 0, endTime: 10, words: [], confidence: 0.9 }],
    ];

    const result = await service.generate(segments);
    expect(result.chapters).toHaveLength(1);
    const firstChapter = result.chapters[0];
    if (!firstChapter) {
      throw new Error('Missing chapter');
    }
    expect(firstChapter.title).toBe('Wrapped Chapter');
  });

  it('throws ProviderError when LLM returns malformed JSON', async () => {
    completeMock.mockResolvedValue({
      content: 'Not valid JSON syntax at all',
      model: 'test-llm-model',
      tokensUsed: { prompt: 10, completion: 10, total: 20 },
      finishReason: 'stop',
    });

    const segments: TranscriptionSegment[][] = [
      [{ id: 1, text: 'Test text.', startTime: 0, endTime: 10, words: [], confidence: 0.9 }],
    ];

    await expect(service.generate(segments)).rejects.toThrow(ProviderError);
  });
});
