/**
 * Application-wide constants.
 * Never hard-code magic strings or numbers elsewhere in the codebase — reference these.
 */

export const APP_NAME = 'semantic-video-search';
export const API_VERSION = 'v1';
export const DEFAULT_PORT = 3000;

/** ─── Pipeline ──────────────────────────────────────────────── */
export const PIPELINE_STAGES = {
  AUDIO_EXTRACTION: 'audio-extraction',
  TRANSCRIPTION: 'transcription',
  TRANSCRIPT_CLEANING: 'transcript-cleaning',
  SEMANTIC_CHUNKING: 'semantic-chunking',
  CHAPTER_GENERATION: 'chapter-generation',
  EMBEDDING: 'embedding',
  STORAGE: 'storage',
} as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[keyof typeof PIPELINE_STAGES];

export const PIPELINE_STATES = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type PipelineState = (typeof PIPELINE_STATES)[keyof typeof PIPELINE_STATES];

/** ─── AI Providers ───────────────────────────────────────────── */
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  WHISPER: 'whisper',
  FASTER_WHISPER: 'faster-whisper',
  LOCAL_LLM: 'local-llm',
} as const;

export type AIProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

/** ─── Cache ──────────────────────────────────────────────────── */
export const CACHE_PROVIDERS = {
  MEMORY: 'memory',
  REDIS: 'redis',
} as const;

export type CacheProvider = (typeof CACHE_PROVIDERS)[keyof typeof CACHE_PROVIDERS];

/** ─── HTTP ───────────────────────────────────────────────────── */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/** ─── Logging ────────────────────────────────────────────────── */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug',
} as const;

/** ─── Time ───────────────────────────────────────────────────── */
export const MILLISECONDS = {
  ONE_SECOND: 1_000,
  ONE_MINUTE: 60_000,
  ONE_HOUR: 3_600_000,
  ONE_DAY: 86_400_000,
} as const;

/** ─── Retry ──────────────────────────────────────────────────── */
export const RETRY_DEFAULTS = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1_000,
  MAX_DELAY_MS: 30_000,
  BACKOFF_MULTIPLIER: 2,
  JITTER: true,
} as const;

/** ─── Chunking ───────────────────────────────────────────────── */
export const CHUNKING_DEFAULTS = {
  MIN_CHUNK_DURATION_SECONDS: 30,
  MAX_CHUNK_DURATION_SECONDS: 300,
  OVERLAP_SECONDS: 5,
  MAX_CHUNK_TOKENS: 1_500,
} as const;

/** ─── Events ─────────────────────────────────────────────────── */
export const PIPELINE_EVENTS = {
  STAGE_STARTED: 'pipeline:stage:started',
  STAGE_COMPLETED: 'pipeline:stage:completed',
  STAGE_FAILED: 'pipeline:stage:failed',
  PIPELINE_STARTED: 'pipeline:started',
  PIPELINE_COMPLETED: 'pipeline:completed',
  PIPELINE_FAILED: 'pipeline:failed',
  PROGRESS_UPDATED: 'pipeline:progress:updated',
  CHECKPOINT_SAVED: 'pipeline:checkpoint:saved',
} as const;

export type PipelineEvent = (typeof PIPELINE_EVENTS)[keyof typeof PIPELINE_EVENTS];
