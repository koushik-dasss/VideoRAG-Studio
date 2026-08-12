/**
 * Pipeline Orchestrator — coordinates the end-to-end execution lifecycle
 * from speech recognition through transcript cleaning, semantic chunking,
 * chapter generation, and vector embedding with progress tracking, event emission,
 * and resilient retry handling.
 */

import { PIPELINE_EVENTS, PIPELINE_STAGES, PIPELINE_STATES, type PipelineState } from '../constants/index';
import { PipelineStageError, ValidationError } from '../errors/index';
import type { IEventBus } from '../events/index';
import type {
  ChapterGenerationResult,
  EmbeddingResult,
  GeneratedChapter,
  IChapterGenerationService,
  IEmbeddingService,
  ISemanticChunkingService,
  ISpeechRecognitionService,
  ITranscriptCleaningService,
  TranscriptionResult,
  TranscriptionSegment,
} from '../interfaces/index';
import type { IProgressTracker } from '../progress/index';
import type { IRetryEngine } from '../retry/index';
import { generateId, nowIso } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('PipelineOrchestrator');

export interface PipelineInput {
  pipelineId?: string;
  audioPath: string;
  videoTitle?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineOutput {
  pipelineId: string;
  status: PipelineState;
  audioPath: string;
  transcription: TranscriptionResult;
  cleanedSegments: TranscriptionSegment[];
  chunkedSegments: TranscriptionSegment[][];
  chapters: GeneratedChapter[];
  embeddings: EmbeddingResult[];
  processingTimeMs: number;
}

export interface PipelineDependencies {
  speechRecognitionService: ISpeechRecognitionService;
  transcriptCleaningService: ITranscriptCleaningService;
  semanticChunkingService: ISemanticChunkingService;
  chapterGenerationService: IChapterGenerationService;
  embeddingService: IEmbeddingService;
  eventBus?: IEventBus;
  progressTracker?: IProgressTracker;
  retryEngine?: IRetryEngine;
}

export interface IPipelineOrchestrator {
  execute(input: PipelineInput): Promise<PipelineOutput>;
  getStatus(pipelineId: string): PipelineState | null;
  getOutput(pipelineId: string): PipelineOutput | null;
  listPipelines(): string[];
}

export class PipelineOrchestrator implements IPipelineOrchestrator {
  private readonly speechService: ISpeechRecognitionService;
  private readonly cleaningService: ITranscriptCleaningService;
  private readonly chunkingService: ISemanticChunkingService;
  private readonly chapterService: IChapterGenerationService;
  private readonly embeddingService: IEmbeddingService;
  private readonly eventBus?: IEventBus;
  private readonly progressTracker?: IProgressTracker;
  private readonly retryEngine?: IRetryEngine;

  private readonly outputs = new Map<string, PipelineOutput>();
  private readonly statuses = new Map<string, PipelineState>();

  constructor(deps: PipelineDependencies) {
    if (!deps.speechRecognitionService) {
      throw new ValidationError('SpeechRecognitionService required');
    }
    if (!deps.transcriptCleaningService) {
      throw new ValidationError('TranscriptCleaningService required');
    }
    if (!deps.semanticChunkingService) {
      throw new ValidationError('SemanticChunkingService required');
    }
    if (!deps.chapterGenerationService) {
      throw new ValidationError('ChapterGenerationService required');
    }
    if (!deps.embeddingService) {
      throw new ValidationError('EmbeddingService required');
    }

    this.speechService = deps.speechRecognitionService;
    this.cleaningService = deps.transcriptCleaningService;
    this.chunkingService = deps.semanticChunkingService;
    this.chapterService = deps.chapterGenerationService;
    this.embeddingService = deps.embeddingService;
    this.eventBus = deps.eventBus;
    this.progressTracker = deps.progressTracker;
    this.retryEngine = deps.retryEngine;

    log.info('PipelineOrchestrator initialised');
  }

  /**
   * Execute the end-to-end video semantic search pipeline.
   */
  async execute(input: PipelineInput): Promise<PipelineOutput> {
    if (!input?.audioPath?.trim()) {
      throw new ValidationError('Audio path is required to execute pipeline');
    }

    const pipelineId = input.pipelineId?.trim() ? input.pipelineId.trim() : generateId();
    const startMs = Date.now();

    const stages = [
      PIPELINE_STAGES.TRANSCRIPTION,
      PIPELINE_STAGES.TRANSCRIPT_CLEANING,
      PIPELINE_STAGES.SEMANTIC_CHUNKING,
      PIPELINE_STAGES.CHAPTER_GENERATION,
      PIPELINE_STAGES.EMBEDDING_GENERATION,
    ];

    this.statuses.set(pipelineId, PIPELINE_STATES.RUNNING);
    this.progressTracker?.initializePipeline(pipelineId, stages);
    await this.emitEvent(PIPELINE_EVENTS.PIPELINE_STARTED, { pipelineId, input, timestamp: nowIso() });

    log.info('Pipeline execution started', { pipelineId, audioPath: input.audioPath });

    try {
      // Stage 1: Transcription
      const transcription = await this.runStage(
        pipelineId,
        PIPELINE_STAGES.TRANSCRIPTION,
        () => this.speechService.transcribe(input.audioPath, input.language),
      );

      // Stage 2: Transcript Cleaning
      const cleanedSegments = await this.runStage(
        pipelineId,
        PIPELINE_STAGES.TRANSCRIPT_CLEANING,
        () => Promise.resolve(this.cleaningService.cleanSegments(transcription.segments)),
      );

      // Stage 3: Semantic Chunking
      const chunkedSegments = await this.runStage(
        pipelineId,
        PIPELINE_STAGES.SEMANTIC_CHUNKING,
        () => Promise.resolve(this.chunkingService.chunk(cleanedSegments)),
      );

      // Stage 4: Chapter Generation
      const chapterRes: ChapterGenerationResult = await this.runStage(
        pipelineId,
        PIPELINE_STAGES.CHAPTER_GENERATION,
        () => this.chapterService.generate(chunkedSegments, input.videoTitle),
      );
      const chapters = chapterRes.chapters;

      // Stage 5: Vector Embedding
      const embeddings = await this.runStage(
        pipelineId,
        PIPELINE_STAGES.EMBEDDING_GENERATION,
        () => {
          const textsToEmbed = chapters.map((c) => `${c.title}: ${c.summary}`.trim());
          return this.embeddingService.embedBatch(textsToEmbed);
        },
      );

      const processingTimeMs = Date.now() - startMs;
      const output: PipelineOutput = {
        pipelineId,
        status: PIPELINE_STATES.COMPLETED,
        audioPath: input.audioPath,
        transcription,
        cleanedSegments,
        chunkedSegments,
        chapters,
        embeddings,
        processingTimeMs,
      };

      this.statuses.set(pipelineId, PIPELINE_STATES.COMPLETED);
      this.outputs.set(pipelineId, output);
      await this.emitEvent(PIPELINE_EVENTS.PIPELINE_COMPLETED, { pipelineId, processingTimeMs, timestamp: nowIso() });

      log.info('Pipeline execution completed successfully', {
        pipelineId,
        chaptersCount: chapters.length,
        embeddingsCount: embeddings.length,
        processingTimeMs,
      });

      return output;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.statuses.set(pipelineId, PIPELINE_STATES.FAILED);
      await this.emitEvent(PIPELINE_EVENTS.PIPELINE_FAILED, {
        pipelineId,
        error: error.message,
        timestamp: nowIso(),
      });
      log.error('Pipeline execution failed', { pipelineId, error: error.message });

      if (error instanceof PipelineStageError) {
        throw error;
      }
      throw new PipelineStageError(pipelineId, 'orchestration', error);
    }
  }

  getStatus(pipelineId: string): PipelineState | null {
    return this.statuses.get(pipelineId) ?? null;
  }

  getOutput(pipelineId: string): PipelineOutput | null {
    return this.outputs.get(pipelineId) ?? null;
  }

  listPipelines(): string[] {
    return Array.from(this.statuses.keys());
  }

  private async runStage<T>(
    pipelineId: string,
    stage: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    this.progressTracker?.startStage(pipelineId, stage);
    await this.emitEvent(PIPELINE_EVENTS.STAGE_STARTED, { pipelineId, stage, timestamp: nowIso() });

    try {
      let result: T;
      if (this.retryEngine) {
        result = await this.retryEngine.execute(operation);
      } else {
        result = await operation();
      }

      this.progressTracker?.completeStage(pipelineId, stage);
      await this.emitEvent(PIPELINE_EVENTS.STAGE_COMPLETED, { pipelineId, stage, timestamp: nowIso() });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.progressTracker?.failStage(pipelineId, stage, error.message);
      await this.emitEvent(PIPELINE_EVENTS.STAGE_FAILED, {
        pipelineId,
        stage,
        error: error.message,
        timestamp: nowIso(),
      });
      throw new PipelineStageError(pipelineId, stage, error);
    }
  }

  private async emitEvent(eventName: string, payload: unknown): Promise<void> {
    if (!this.eventBus) {
      return;
    }
    try {
      if (this.eventBus.emitAsync) {
        await this.eventBus.emitAsync(eventName, payload);
      } else {
        this.eventBus.emit(eventName, payload);
      }
    } catch (err) {
      log.warn('Failed to emit pipeline event', { eventName, error: String(err) });
    }
  }
}
