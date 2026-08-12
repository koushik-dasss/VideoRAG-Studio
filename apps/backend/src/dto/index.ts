/**
 * Data Transfer Objects — define the shape of data at API boundaries.
 *
 * DTOs decouple the internal domain models from external request/response
 * payloads. Each DTO is a plain interface with an optional factory function.
 */

import type { PipelineState, AIProvider } from '../constants/index';

// ──────────────────────────────────────────────────────────────────────────────
// Common response envelope
// ──────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    requestId?: string;
  };
}

export function createApiResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
): ApiResponse<T> {
  return { success: true, data, meta };
}

// ──────────────────────────────────────────────────────────────────────────────
// Video DTOs
// ──────────────────────────────────────────────────────────────────────────────

export interface CreateVideoRequestDto {
  filePath: string;
  title: string;
  description?: string;
  language?: string;
  tags?: string[];
}

export interface VideoResponseDto {
  id: string;
  filePath: string;
  status: string;
  metadata: {
    title: string;
    description?: string;
    durationSeconds: number;
    sizeBytes: number;
    format: string;
    resolution?: string;
    language?: string;
    tags?: string[];
  };
  pipelineId?: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Pipeline DTOs
// ──────────────────────────────────────────────────────────────────────────────

export interface StartPipelineRequestDto {
  videoId: string;
  provider?: AIProvider;
  options?: {
    language?: string;
    maxChapters?: number;
    minChapterDurationSeconds?: number;
    generateEmbeddings?: boolean;
    skipStages?: string[];
  };
}

export interface PipelineStageDto {
  stage: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  retryCount: number;
}

export interface PipelineResponseDto {
  id: string;
  videoId: string;
  state: PipelineState;
  currentStage?: string;
  stages: PipelineStageDto[];
  progress: number;
  provider: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  totalDurationMs?: number;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Chapter DTOs
// ──────────────────────────────────────────────────────────────────────────────

export interface ChapterResponseDto {
  id: string;
  videoId: string;
  index: number;
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
  startTimestamp: string; // HH:MM:SS
  endTimestamp: string; // HH:MM:SS
  keywords: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Transcript DTOs
// ──────────────────────────────────────────────────────────────────────────────

export interface TranscriptSegmentDto {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface TranscriptResponseDto {
  id: string;
  videoId: string;
  language: string;
  durationSeconds: number;
  provider: string;
  isClean: boolean;
  segmentCount: number;
  fullText: string;
  segments: TranscriptSegmentDto[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Search DTOs
// ──────────────────────────────────────────────────────────────────────────────

export interface SearchRequestDto {
  query: string;
  videoId?: string;
  limit?: number;
  threshold?: number;
}

export interface SearchResultDto {
  chapterId: string;
  videoId: string;
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
  startTimestamp: string;
  endTimestamp: string;
  score: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Health DTOs
// ──────────────────────────────────────────────────────────────────────────────

export interface HealthResponseDto {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    name: string;
    status: string;
    latencyMs: number;
    message?: string;
  }[];
  timestamp: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Progress DTOs (for WebSocket / SSE)
// ──────────────────────────────────────────────────────────────────────────────

export interface PipelineProgressDto {
  pipelineId: string;
  videoId: string;
  stage: string;
  progress: number;
  message: string;
  timestamp: string;
}
