import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCacheService } from '../../src/cache/index';
import { PIPELINE_EVENTS, PIPELINE_STATES } from '../../src/constants/index';
import { EventEmitterEventBus } from '../../src/events/index';
import { type ProviderWithAvailability } from '../../src/fallback/index';
import { HealthMonitor } from '../../src/health/index';
import type { ILLMProvider, IPromptTemplateEngine } from '../../src/interfaces/index';
import { MetricsCollector } from '../../src/metrics/index';
import { PipelineOrchestrator, type PipelineOutput } from '../../src/pipeline/index';
import { ProgressTracker } from '../../src/progress/index';
import { ServiceRegistry } from '../../src/registry/index';
import { ExponentialBackoffRetryEngine } from '../../src/retry/index';
import { ChapterGenerationService } from '../../src/services/chapter.generation.service';
import { EmbeddingService } from '../../src/services/embedding.service';
import { PromptTemplateEngine } from '../../src/services/prompt.template.engine';
import { SemanticChunkingService } from '../../src/services/semantic.chunking.service';
import { SpeechRecognitionService } from '../../src/services/speech.recognition.service';
import { TranscriptCleaningService } from '../../src/services/transcript.cleaning.service';

describe('Integration & Benchmark E2E Pipeline', () => {
  let sampleData: {
    videoTitle: string;
    language: string;
    durationSeconds: number;
    transcription: { segments: unknown[] };
    expectedChapters: unknown[];
  };

  beforeEach(() => {
    const dataPath = path.resolve(__dirname, '../../data/dummy/video_sample.json');
    const rawJson = fs.readFileSync(dataPath, 'utf-8');
    sampleData = JSON.parse(rawJson) as typeof sampleData;
  });

  it('runs the end-to-end pipeline with all phase 3 and phase 4 engines integrated', async () => {
    // 1. Foundational Engines
    const eventBus = new EventEmitterEventBus();
    const registry = new ServiceRegistry<ProviderWithAvailability>('ai-providers');
    const progressTracker = new ProgressTracker(eventBus);
    const retryEngine = new ExponentialBackoffRetryEngine({ maxAttempts: 2, baseDelayMs: 1, jitter: false });
    const cacheService = new MemoryCacheService(600);
    const metricsCollector = new MetricsCollector();
    const healthMonitor = new HealthMonitor('e2e-pipeline');

    // 2. Speech Provider & Service
    const mockSpeechProvider = {
      name: 'mock-speech',
      isAvailable: vi.fn().mockResolvedValue(true),
      transcribe: vi.fn().mockResolvedValue({
        segments: sampleData.transcription.segments,
        text: 'Full transcribed audio text',
        language: sampleData.language,
        duration: sampleData.durationSeconds,
      }),
    };
    registry.register('speech', mockSpeechProvider);
    const speechService = new SpeechRecognitionService(
      {
        whisper: { provider: 'mock-speech', model: 'mock', apiKey: 'test', timeoutMs: 1000 },
        llm: { provider: 'mock', model: 'mock', apiKey: 'test', timeoutMs: 1000 },
        embeddings: { provider: 'mock', model: 'mock', apiKey: 'test', dimensions: 1536 },
      },
      undefined,
      mockSpeechProvider,
    );

    // 3. Cleaning & Chunking Services
    const cleaningService = new TranscriptCleaningService();
    const chunkingService = new SemanticChunkingService(3);

    // 4. Chapter Generation Service
    const mockLLM: ILLMProvider = {
      complete: vi.fn().mockResolvedValue({
        content: JSON.stringify({ chapters: sampleData.expectedChapters }),
        model: 'mock-llm-e2e',
        tokensUsed: { prompt: 100, completion: 150, total: 250 },
        finishReason: 'stop',
      }),
      completeStream: vi.fn(),
    };
    const promptEngine: IPromptTemplateEngine = new PromptTemplateEngine();
    const chapterService = new ChapterGenerationService(mockLLM, promptEngine);

    // 5. Embedding Service
    const mockEmbedProvider = {
      name: 'mock-embed-e2e',
      embed: vi.fn(),
      embedBatch: vi.fn().mockResolvedValue([
        { vector: new Array(1536).fill(0.1), model: 'mock-embed-e2e', tokensUsed: 40 },
        { vector: new Array(1536).fill(0.2), model: 'mock-embed-e2e', tokensUsed: 45 },
        { vector: new Array(1536).fill(0.3), model: 'mock-embed-e2e', tokensUsed: 50 },
      ]),
    };
    const embeddingService = new EmbeddingService(mockEmbedProvider, cacheService);

    // Register health check
    healthMonitor.registerChecker('cache', {
      check: async () => ({
        status: 'healthy',
        service: 'cache',
        latencyMs: 1,
        timestamp: new Date().toISOString(),
      }),
    });

    // 6. Assemble Pipeline Orchestrator
    const orchestrator = new PipelineOrchestrator({
      speechRecognitionService: speechService,
      transcriptCleaningService: cleaningService,
      semanticChunkingService: chunkingService,
      chapterGenerationService: chapterService,
      embeddingService: embeddingService,
      eventBus,
      progressTracker,
      retryEngine,
    });

    // Track events
    const progressEvents: unknown[] = [];
    eventBus.on(PIPELINE_EVENTS.PROGRESS_UPDATED, (payload) => {
      progressEvents.push(payload);
    });

    // Execute pipeline
    const startTime = Date.now();
    const output: PipelineOutput = await orchestrator.execute({
      pipelineId: 'benchmark-pipe-001',
      audioPath: '/audio/sample_recording.mp3',
      videoTitle: sampleData.videoTitle,
      language: sampleData.language,
    });

    const totalTimeMs = Date.now() - startTime;
    metricsCollector.observeHistogram('pipeline_execution_ms', totalTimeMs, { status: output.status });

    // Assertions
    expect(output.pipelineId).toBe('benchmark-pipe-001');
    expect(output.status).toBe(PIPELINE_STATES.COMPLETED);
    expect(output.chapters).toHaveLength(sampleData.expectedChapters.length);
    expect(output.embeddings).toHaveLength(3);
    expect(progressEvents.length).toBeGreaterThanOrEqual(5);

    // Verify cache hit on second embedding run
    const firstChapter = output.chapters[0];
    if (firstChapter) {
      const cacheKey = `embed:mock-embed-e2e:${firstChapter.title}: ${firstChapter.summary}`;
      const cachedHas = await cacheService.has(cacheKey);
      expect(cachedHas).toBe(true);
    }

    // Verify health monitor check
    const healthReport = await healthMonitor.checkAll();
    expect(healthReport.overall).toBe('healthy');
  });
});
