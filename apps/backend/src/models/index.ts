/**
 * Domain models — the core entities of the system.
 *
 * These are plain data structures (no ORM coupling). Each model has a
 * factory function for safe construction with defaults and ID generation.
 */

import type { PipelineStage, PipelineState, AIProvider } from '../constants/index';
import type {
  TranscriptionSegment,
  GeneratedChapter,
} from '../interfaces/index';
import { generateId, nowIso } from '../utils/index';

// ──────────────────────────────────────────────────────────────────────────────
// Base entity
// ──────────────────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ──────────────────────────────────────────────────────────────────────────────
// Video
// ──────────────────────────────────────────────────────────────────────────────

export interface VideoMetadata {
  title: string;
  description?: string;
  durationSeconds: number;
  sizeBytes: number;
  format: string;
  resolution?: string;
  frameRate?: number;
  language?: string;
  tags?: string[];
}

export interface Video extends BaseEntity {
  filePath: string;
  audioPath?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  metadata: VideoMetadata;
  pipelineId?: string;
}

export function createVideo(
  input: Pick<Video, 'filePath' | 'metadata'> & Partial<Pick<Video, 'status'>>,
): Video {
  const now = nowIso();
  return {
    id: generateId(),
    filePath: input.filePath,
    status: input.status ?? 'uploaded',
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Transcript
// ──────────────────────────────────────────────────────────────────────────────

export interface Transcript extends BaseEntity {
  videoId: string;
  segments: TranscriptionSegment[];
  fullText: string;
  language: string;
  durationSeconds: number;
  provider: string;
  isClean: boolean;
}

export function createTranscript(
  input: Omit<Transcript, 'id' | 'createdAt' | 'updatedAt' | 'isClean'>,
): Transcript {
  const now = nowIso();
  return {
    ...input,
    id: generateId(),
    isClean: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Chapter
// ──────────────────────────────────────────────────────────────────────────────

export interface Chapter extends BaseEntity {
  videoId: string;
  transcriptId: string;
  index: number;
  title: string;
  summary: string;
  startTime: number; // seconds
  endTime: number; // seconds
  keywords: string[];
  embedding?: number[];
}

export function createChapter(
  input: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>,
): Chapter {
  const now = nowIso();
  return {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
}

/** Build Chapter entities from a ChapterGenerationResult */
export function chaptersFromGenerated(
  videoId: string,
  transcriptId: string,
  generated: GeneratedChapter[],
): Chapter[] {
  return generated.map((g) =>
    createChapter({
      videoId,
      transcriptId,
      index: g.index,
      title: g.title,
      summary: g.summary,
      startTime: g.startTime,
      endTime: g.endTime,
      keywords: g.keywords,
    }),
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Embedding record (for persistence / vector search)
// ──────────────────────────────────────────────────────────────────────────────

export interface EmbeddingRecord extends BaseEntity {
  sourceId: string; // chapter ID, segment ID, etc.
  sourceType: 'chapter' | 'segment' | 'video';
  vector: number[];
  model: string;
  dimensions: number;
}

export function createEmbeddingRecord(
  input: Omit<EmbeddingRecord, 'id' | 'createdAt' | 'updatedAt' | 'dimensions'>,
): EmbeddingRecord {
  const now = nowIso();
  return {
    ...input,
    id: generateId(),
    dimensions: input.vector.length,
    createdAt: now,
    updatedAt: now,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Pipeline run
// ──────────────────────────────────────────────────────────────────────────────

export interface PipelineStageResult {
  stage: PipelineStage;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  retryCount: number;
}

export interface PipelineRun extends BaseEntity {
  videoId: string;
  state: PipelineState;
  currentStage?: PipelineStage;
  stages: PipelineStageResult[];
  progress: number; // 0-100
  provider: AIProvider;
  config: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  totalDurationMs?: number;
  checkpointData?: Record<string, unknown>;
}

export function createPipelineRun(
  input: Pick<PipelineRun, 'videoId' | 'provider'> &
    Partial<Pick<PipelineRun, 'config' | 'stages'>>,
): PipelineRun {
  const now = nowIso();
  return {
    id: generateId(),
    videoId: input.videoId,
    state: 'pending',
    stages: input.stages ?? [],
    progress: 0,
    provider: input.provider,
    config: input.config ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Search query / result (for semantic search)
// ──────────────────────────────────────────────────────────────────────────────

export interface SearchQuery {
  query: string;
  videoId?: string;
  limit: number;
  threshold: number; // minimum similarity score 0-1
}

export interface SearchResult {
  chapterId: string;
  videoId: string;
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
  score: number; // similarity score 0-1
}
