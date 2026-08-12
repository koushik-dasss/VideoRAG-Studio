import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import { PIPELINE_STATES } from '../../src/constants/index';
import { PipelineStageError, ValidationError } from '../../src/errors/index';
import type {
  IChapterGenerationService,
  IEmbeddingService,
  ISemanticChunkingService,
  ISpeechRecognitionService,
  ITranscriptCleaningService,
  TranscriptionResult,
  TranscriptionSegment,
} from '../../src/interfaces/index';
import { PipelineOrchestrator } from '../../src/pipeline/index';

describe('PipelineOrchestrator', () => {
  let mockSpeech: ISpeechRecognitionService;
  let mockCleaning: ITranscriptCleaningService;
  let mockChunking: ISemanticChunkingService;
  let mockChapter: IChapterGenerationService;
  let mockEmbedding: IEmbeddingService;
  let orchestrator: PipelineOrchestrator;

  let transcribeMock: MockInstance;
  let cleanSegmentsMock: MockInstance;
  let chunkMock: MockInstance;
  let generateMock: MockInstance;
  let embedBatchMock: MockInstance;

  beforeEach(() => {
    const segments: TranscriptionSegment[] = [
      { id: 1, text: 'Raw audio text.', startTime: 0, endTime: 10, words: [], confidence: 0.95 },
    ];

    const transcription: TranscriptionResult = {
      segments,
      text: 'Raw audio text.',
      language: 'en',
      duration: 10,
    };

    transcribeMock = vi.fn().mockResolvedValue(transcription);
    mockSpeech = {
      transcribe: transcribeMock,
    };

    cleanSegmentsMock = vi.fn().mockReturnValue([
      { id: 1, text: 'Cleaned audio text.', startTime: 0, endTime: 10, words: [], confidence: 0.95 },
    ]);
    mockCleaning = {
      clean: vi.fn().mockReturnValue('Cleaned audio text.'),
      cleanSegments: cleanSegmentsMock,
    };

    chunkMock = vi.fn().mockReturnValue([
      [
        { id: 1, text: 'Cleaned audio text.', startTime: 0, endTime: 10, words: [], confidence: 0.95 },
      ],
    ]);
    mockChunking = {
      chunk: chunkMock,
    };

    generateMock = vi.fn().mockResolvedValue({
      chapters: [
        {
          index: 1,
          title: 'Intro Chapter',
          summary: 'Summary of intro',
          startTime: 0,
          endTime: 10,
          keywords: ['intro'],
        },
      ],
      modelUsed: 'mock-llm',
      tokensUsed: 50,
      processingTimeMs: 10,
    });
    mockChapter = {
      generate: generateMock,
    };

    embedBatchMock = vi.fn().mockResolvedValue([
      { vector: [0.1, 0.2], model: 'mock-embed', tokensUsed: 10 },
    ]);
    mockEmbedding = {
      embed: vi.fn(),
      embedBatch: embedBatchMock,
    };

    orchestrator = new PipelineOrchestrator({
      speechRecognitionService: mockSpeech,
      transcriptCleaningService: mockCleaning,
      semanticChunkingService: mockChunking,
      chapterGenerationService: mockChapter,
      embeddingService: mockEmbedding,
    });
  });

  it('throws ValidationError if initialized without required dependencies', () => {
    expect(() => new PipelineOrchestrator({
      // @ts-expect-error missing deps
      speechRecognitionService: mockSpeech,
    })).toThrow(ValidationError);
  });

  it('throws ValidationError if execute called without audioPath', async () => {
    await expect(orchestrator.execute({ audioPath: '' })).rejects.toThrow(ValidationError);
  });

  it('executes pipeline end-to-end successfully returning formatted output', async () => {
    const output = await orchestrator.execute({
      pipelineId: 'test-pipe-1',
      audioPath: '/videos/test.mp4',
      videoTitle: 'Test Video',
    });

    expect(output.pipelineId).toBe('test-pipe-1');
    expect(output.status).toBe(PIPELINE_STATES.COMPLETED);
    expect(output.audioPath).toBe('/videos/test.mp4');
    expect(output.chapters).toHaveLength(1);
    expect(output.embeddings).toHaveLength(1);

    expect(transcribeMock).toHaveBeenCalledWith('/videos/test.mp4', undefined);
    expect(cleanSegmentsMock).toHaveBeenCalledTimes(1);
    expect(chunkMock).toHaveBeenCalledTimes(1);
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(embedBatchMock).toHaveBeenCalledWith(['Intro Chapter: Summary of intro']);

    expect(orchestrator.getStatus('test-pipe-1')).toBe(PIPELINE_STATES.COMPLETED);
    expect(orchestrator.getOutput('test-pipe-1')).toEqual(output);
    expect(orchestrator.listPipelines()).toContain('test-pipe-1');
  });

  it('wraps errors in PipelineStageError and marks pipeline status as failed', async () => {
    transcribeMock.mockRejectedValueOnce(new Error('Audio processing failure'));

    await expect(
      orchestrator.execute({ pipelineId: 'fail-pipe', audioPath: '/videos/bad.mp4' }),
    ).rejects.toThrow(PipelineStageError);

    expect(orchestrator.getStatus('fail-pipe')).toBe(PIPELINE_STATES.FAILED);
    expect(orchestrator.getOutput('fail-pipe')).toBeNull();
  });
});
