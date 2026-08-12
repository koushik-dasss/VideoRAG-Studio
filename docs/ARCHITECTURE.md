# 🏗️ Technical Architecture & Engineering Specifications

This document outlines the architectural patterns, data flow, resilience strategies, and system observability mechanisms designed into the Video Semantic Search & Automatic Chapterization Pipeline.

---

## 1. Clean Architecture & Layering

The codebase enforces unidirectional dependency rules across three distinct layers:

1. **Domain Layer (`src/interfaces/`, `src/errors/`, `src/constants/`)**
   - Contains pure TypeScript interfaces (`ISpeechProvider`, `ILLMProvider`, `IEmbeddingProvider`, `ICacheProvider`), domain error models, and invariant configuration constants.
   - Zero dependencies on external libraries or infrastructure details.

2. **Application / Service Layer (`src/services/`, `src/pipeline/`, `src/fallback/`, `src/retry/`)**
   - Implements business logic (`TranscriptCleaningService`, `SemanticChunkingService`, `ChapterGenerationService`, `PipelineOrchestrator`).
   - All services interact exclusively with **interfaces** rather than concrete provider implementations.

3. **Infrastructure & Presentation Layer (`src/app.ts`, `src/index.ts`, `src/cache/`, `src/metrics/`)**
   - Express HTTP handling, memory/Redis cache drivers, Prometheus/custom metric instrumentation, and provider concrete adapters.

---

## 2. Pipeline Execution Flow & Stage Transition

The `PipelineOrchestrator` governs step-by-step execution across 5 sequential stages:

```
[ Stage 1: TRANSCRIPTION ]
   │  Input: audioPath (string)
   │  Output: TranscriptionResult { segments: TranscriptSegment[], text: string }
   ▼
[ Stage 2: CLEANING ]
   │  Input: TranscriptionResult
   │  Output: CleanedTranscript { segments: CleanedSegment[], text: string }
   ▼
[ Stage 3: CHUNKING ]
   │  Input: CleanedTranscript
   │  Output: SemanticChunk[] (Sliding time/token windows with overlap)
   ▼
[ Stage 4: CHAPTER_GENERATION ]
   │  Input: SemanticChunk[]
   │  Output: Chapter[] (Structured JSON titles, summaries, timestamps, tags)
   ▼
[ Stage 5: EMBEDDING ]
   │  Input: Chapter[]
   │  Output: EmbeddingResult[] (1536-dim dense vectors for semantic search)
```

### Event Emission Lifecycle
At each stage transition, `PipelineOrchestrator` emits structured events across `EventBus`:
- `pipeline:started`: Initial trigger with pipeline configuration and timestamp.
- `pipeline:stage:started`: Emitted before executing any domain service stage.
- `pipeline:progress:updated`: Emitted with updated completion percentages (`percentComplete: 20`, `40`, `60`, `80`, `100`).
- `pipeline:stage:completed`: Emitted after stage completion with latency metrics.
- `pipeline:completed` or `pipeline:failed`: Final terminal event containing aggregated tokens used, execution duration, and full error context if failed.

---

## 3. Resilience & High Availability Engine

### A. Automatic Provider Fallback (`ProviderFallbackEngine`)
When communicating with third-party APIs (Faster-Whisper, Gemini, Vector Embedding providers), transient or rate-limit failures can degrade user experience. The `ProviderFallbackEngine` intercepts calls across a registered list of providers (`primary -> secondary -> tertiary`).

If a provider throws an operational error (`RateLimitError` or `TimeoutError`) or marks `isAvailable() === false`, the fallback engine immediately rotates to the next available backup provider while recording degraded health metrics.

### B. Exponential Backoff & Jitter (`ExponentialBackoffRetryEngine`)
Before failing over to a secondary provider or terminating a stage, operations are retried using exponential backoff:
$$\text{Delay} = \min\left(\text{MaxDelay}, \text{BaseDelay} \times \text{Multiplier}^{\text{Attempt}}\right)$$
To prevent "thundering herd" synchronization across high-concurrency workers, optional **Full Jitter** randomizes the delay uniformly within $[0, \text{Delay}]$.

---

## 4. Caching & Deduplication Strategy (`MemoryCacheService`)

To reduce expensive embedding generation costs, `EmbeddingService` interfaces with `ICacheProvider`.
- Every chapter title and summary is normalized and hashed into a deterministic cache key (`embed:{providerName}:{text}`).
- Before calling `provider.embedBatch(...)`, the service checks the cache.
- Only cache misses are forwarded to the remote API. Newly generated vectors are automatically persisted to the cache store with configurable TTLs (default `86,400s` / 24 hours).

---

## 5. Observability & Telemetry

### Metrics Collector (`MetricsCollector`)
Low-overhead in-memory telemetry tracks core operational health:
- **Counters**: `pipeline_executions_total`, `provider_errors_total`
- **Gauges**: `active_pipelines_count`, `cache_memory_bytes`
- **Histograms**: Bounded latency distributions for `pipeline_execution_ms` and `provider_latency_ms`.

### Health Monitor (`HealthMonitor`)
Continuous or on-demand health verification across dependent subsystems:
```json
{
  "overall": "healthy",
  "checks": [
    { "service": "cache", "status": "healthy", "latencyMs": 1 },
    { "service": "ai-providers", "status": "healthy", "latencyMs": 14 }
  ],
  "timestamp": "2026-07-14T07:00:00.000Z"
}
```
If any subsystem status degrades to `degraded` or `unhealthy`, the overall status reflects the worst-case health to alert orchestrators (e.g., Kubernetes liveness/readiness probes).
