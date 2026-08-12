import Joi from 'joi';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/** ─── Raw env shape ─────────────────────────────────────────── */
interface RawEnv {
  NODE_ENV: string;
  PORT: string;
  API_VERSION: string;
  SERVICE_NAME: string;
  LOG_LEVEL: string;
  LOG_DIR: string;
  LOG_MAX_FILES: string;
  LOG_MAX_SIZE: string;
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  MONGODB_POOL_SIZE: string;
  MONGODB_CONNECT_TIMEOUT_MS: string;
  VECTOR_SEARCH_INDEX_NAME: string;
  LLM_PROVIDER: string;
  SPEECH_PROVIDER: string;
  EMBEDDING_PROVIDER: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  GEMINI_MAX_TOKENS: string;
  GEMINI_TIMEOUT_MS: string;
  FASTER_WHISPER_MODEL: string;
  FASTER_WHISPER_TIMEOUT_MS: string;
  LOCAL_EMBEDDING_MODEL: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_EMBEDDING_MODEL: string;
  CACHE_PROVIDER: string;
  REDIS_URL: string;
  CACHE_DEFAULT_TTL_SECONDS: string;
  PIPELINE_MAX_RETRIES: string;
  PIPELINE_RETRY_DELAY_MS: string;
  PIPELINE_RETRY_BACKOFF_MULTIPLIER: string;
  PIPELINE_TIMEOUT_MS: string;
  PIPELINE_MAX_CONCURRENT: string;
  CHECKPOINT_ENABLED: string;
  CHECKPOINT_DIR: string;
  FFMPEG_PATH: string;
  FFMPEG_THREADS: string;
  METRICS_ENABLED: string;
  METRICS_PORT: string;
}

/** ─── Parsed / typed config shape ──────────────────────────── */
export interface AppConfig {
  app: {
    env: 'development' | 'test' | 'production';
    port: number;
    apiVersion: string;
    serviceName: string;
  };
  llmProvider: 'gemini' | 'mock';
  speechProvider: 'faster-whisper' | 'gemini-speech' | 'mock';
  embeddingProvider: 'local' | 'mock' | 'ollama';
  log: {
    level: string;
    dir: string;
    maxFiles: string;
    maxSize: string;
  };
  mongodb: {
    uri: string;
    dbName: string;
    poolSize: number;
    connectTimeoutMs: number;
    vectorSearchIndexName: string;
  };
  gemini: {
    apiKey: string;
    model: string;
    maxTokens: number;
    timeoutMs: number;
  };
  fasterWhisper: {
    model: string;
    timeoutMs: number;
  };
  localEmbedding: {
    model: string;
  };
  ollama: {
    baseUrl: string;
    model: string;
  };
  cache: {
    provider: string;
    redisUrl: string;
    defaultTtlSeconds: number;
  };
  pipeline: {
    maxRetries: number;
    retryDelayMs: number;
    retryBackoffMultiplier: number;
    timeoutMs: number;
    maxConcurrent: number;
    checkpointEnabled: boolean;
    checkpointDir: string;
  };
  ffmpeg: {
    path: string;
    threads: number;
  };
  metrics: {
    enabled: boolean;
    port: number;
  };
}

/** ─── Joi validation schema ─────────────────────────────────── */
const envSchema = Joi.object<RawEnv>({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  API_VERSION: Joi.string().default('v1'),
  SERVICE_NAME: Joi.string().default('semantic-video-search'),

  LLM_PROVIDER: Joi.string().valid('gemini', 'mock').default('gemini'),
  SPEECH_PROVIDER: Joi.string().valid('faster-whisper', 'gemini-speech', 'mock').default('faster-whisper'),
  EMBEDDING_PROVIDER: Joi.string().valid('local', 'mock', 'ollama').default('ollama'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
  LOG_DIR: Joi.string().default('logs'),
  LOG_MAX_FILES: Joi.string().default('14d'),
  LOG_MAX_SIZE: Joi.string().default('20m'),

  MONGODB_URI: Joi.string().uri().default('mongodb://localhost:27017/semantic_video_search'),
  MONGODB_DB_NAME: Joi.string().default('semantic_video_search'),
  MONGODB_POOL_SIZE: Joi.number().default(10),
  MONGODB_CONNECT_TIMEOUT_MS: Joi.number().default(30000),
  VECTOR_SEARCH_INDEX_NAME: Joi.string().default('vector_index'),

  GEMINI_API_KEY: Joi.string().default(''),
  GEMINI_MODEL: Joi.string().default('gemini-2.5-flash'),
  GEMINI_MAX_TOKENS: Joi.number().default(8192),
  GEMINI_TIMEOUT_MS: Joi.number().default(60000),

  FASTER_WHISPER_MODEL: Joi.string().default('base'),
  FASTER_WHISPER_TIMEOUT_MS: Joi.number().default(300000),

  LOCAL_EMBEDDING_MODEL: Joi.string().default('Xenova/nomic-embed-text-v1.5'),

  OLLAMA_BASE_URL: Joi.string().default('http://localhost:11434'),
  OLLAMA_EMBEDDING_MODEL: Joi.string().default('nomic-embed-text'),

  CACHE_PROVIDER: Joi.string().valid('memory', 'redis').default('memory'),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  CACHE_DEFAULT_TTL_SECONDS: Joi.number().default(3600),

  PIPELINE_MAX_RETRIES: Joi.number().default(3),
  PIPELINE_RETRY_DELAY_MS: Joi.number().default(1000),
  PIPELINE_RETRY_BACKOFF_MULTIPLIER: Joi.number().default(2),
  PIPELINE_TIMEOUT_MS: Joi.number().default(600000),
  PIPELINE_MAX_CONCURRENT: Joi.number().default(5),
  CHECKPOINT_ENABLED: Joi.boolean().default(true),
  CHECKPOINT_DIR: Joi.string().default('.checkpoints'),

  FFMPEG_PATH: Joi.string().default('ffmpeg'),
  FFMPEG_THREADS: Joi.number().default(4),

  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().default(9090),
})
  .unknown(true) // allow extra env vars from the OS
  .required();

/** ─── Loader ────────────────────────────────────────────────── */
let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (_config) {
    return _config;
  }

  const result = envSchema.validate(process.env, { abortEarly: false });

  if (result.error) {
    const messages = result.error.details.map((d) => d.message).join('\n  ');
    throw new Error(`Environment configuration validation failed:\n  ${messages}`);
  }

  const env: RawEnv = result.value;

  _config = {
    app: {
      env: env.NODE_ENV as AppConfig['app']['env'],
      port: Number(env.PORT),
      apiVersion: env.API_VERSION,
      serviceName: env.SERVICE_NAME,
    },
    llmProvider: env.LLM_PROVIDER as AppConfig['llmProvider'],
    speechProvider: env.SPEECH_PROVIDER as AppConfig['speechProvider'],
    embeddingProvider: env.EMBEDDING_PROVIDER as AppConfig['embeddingProvider'],
    log: {
      level: env.LOG_LEVEL,
      dir: env.LOG_DIR,
      maxFiles: env.LOG_MAX_FILES,
      maxSize: env.LOG_MAX_SIZE,
    },
    mongodb: {
      uri: env.MONGODB_URI,
      dbName: env.MONGODB_DB_NAME,
      poolSize: Number(env.MONGODB_POOL_SIZE),
      connectTimeoutMs: Number(env.MONGODB_CONNECT_TIMEOUT_MS),
      vectorSearchIndexName: env.VECTOR_SEARCH_INDEX_NAME,
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
      maxTokens: Number(env.GEMINI_MAX_TOKENS),
      timeoutMs: Number(env.GEMINI_TIMEOUT_MS),
    },
    fasterWhisper: {
      model: env.FASTER_WHISPER_MODEL,
      timeoutMs: Number(env.FASTER_WHISPER_TIMEOUT_MS),
    },
    localEmbedding: {
      model: env.LOCAL_EMBEDDING_MODEL,
    },
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_EMBEDDING_MODEL,
    },
    cache: {
      provider: env.CACHE_PROVIDER,
      redisUrl: env.REDIS_URL,
      defaultTtlSeconds: Number(env.CACHE_DEFAULT_TTL_SECONDS),
    },
    pipeline: {
      maxRetries: Number(env.PIPELINE_MAX_RETRIES),
      retryDelayMs: Number(env.PIPELINE_RETRY_DELAY_MS),
      retryBackoffMultiplier: Number(env.PIPELINE_RETRY_BACKOFF_MULTIPLIER),
      timeoutMs: Number(env.PIPELINE_TIMEOUT_MS),
      maxConcurrent: Number(env.PIPELINE_MAX_CONCURRENT),
      checkpointEnabled: env.CHECKPOINT_ENABLED === 'true',
      checkpointDir: env.CHECKPOINT_DIR,
    },
    ffmpeg: {
      path: env.FFMPEG_PATH,
      threads: Number(env.FFMPEG_THREADS),
    },
    metrics: {
      enabled: env.METRICS_ENABLED === 'true',
      port: Number(env.METRICS_PORT),
    },
  };

  return _config;
}

/** Reset singleton — useful in tests */
export function resetConfig(): void {
  _config = null;
}

/** Convenience accessor after app boot */
export function getConfig(): AppConfig {
  if (!_config) {
    return loadConfig();
  }
  return _config;
}
