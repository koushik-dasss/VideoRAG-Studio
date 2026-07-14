import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

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
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  OPENAI_EMBEDDING_MODEL: string;
  OPENAI_MAX_TOKENS: string;
  OPENAI_TEMPERATURE: string;
  OPENAI_TIMEOUT_MS: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  GEMINI_MAX_TOKENS: string;
  GEMINI_TIMEOUT_MS: string;
  WHISPER_PROVIDER: string;
  WHISPER_MODEL: string;
  FASTER_WHISPER_HOST: string;
  FASTER_WHISPER_TIMEOUT_MS: string;
  LOCAL_LLM_HOST: string;
  LOCAL_LLM_MODEL: string;
  LOCAL_LLM_TIMEOUT_MS: string;
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
  };
  openai: {
    apiKey: string;
    model: string;
    embeddingModel: string;
    maxTokens: number;
    temperature: number;
    timeoutMs: number;
  };
  gemini: {
    apiKey: string;
    model: string;
    maxTokens: number;
    timeoutMs: number;
  };
  whisper: {
    provider: string;
    model: string;
    fasterWhisperHost: string;
    fasterWhisperTimeoutMs: number;
  };
  localLlm: {
    host: string;
    model: string;
    timeoutMs: number;
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

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
  LOG_DIR: Joi.string().default('logs'),
  LOG_MAX_FILES: Joi.string().default('14d'),
  LOG_MAX_SIZE: Joi.string().default('20m'),

  MONGODB_URI: Joi.string().uri().default('mongodb://localhost:27017/semantic_video_search'),
  MONGODB_DB_NAME: Joi.string().default('semantic_video_search'),
  MONGODB_POOL_SIZE: Joi.number().default(10),
  MONGODB_CONNECT_TIMEOUT_MS: Joi.number().default(30000),

  OPENAI_API_KEY: Joi.string().default(''),
  OPENAI_MODEL: Joi.string().default('gpt-4o'),
  OPENAI_EMBEDDING_MODEL: Joi.string().default('text-embedding-3-small'),
  OPENAI_MAX_TOKENS: Joi.number().default(4096),
  OPENAI_TEMPERATURE: Joi.number().min(0).max(2).default(0.3),
  OPENAI_TIMEOUT_MS: Joi.number().default(60000),

  GEMINI_API_KEY: Joi.string().default(''),
  GEMINI_MODEL: Joi.string().default('gemini-1.5-pro'),
  GEMINI_MAX_TOKENS: Joi.number().default(8192),
  GEMINI_TIMEOUT_MS: Joi.number().default(60000),

  WHISPER_PROVIDER: Joi.string().valid('openai', 'faster-whisper').default('openai'),
  WHISPER_MODEL: Joi.string().default('whisper-1'),
  FASTER_WHISPER_HOST: Joi.string().uri().default('http://localhost:9000'),
  FASTER_WHISPER_TIMEOUT_MS: Joi.number().default(300000),

  LOCAL_LLM_HOST: Joi.string().uri().default('http://localhost:11434'),
  LOCAL_LLM_MODEL: Joi.string().default('llama3'),
  LOCAL_LLM_TIMEOUT_MS: Joi.number().default(120000),

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

  const { error, value } = envSchema.validate(process.env, { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message).join('\n  ');
    throw new Error(`Environment configuration validation failed:\n  ${messages}`);
  }

  const env = value as RawEnv;

  _config = {
    app: {
      env: env.NODE_ENV as AppConfig['app']['env'],
      port: Number(env.PORT),
      apiVersion: env.API_VERSION,
      serviceName: env.SERVICE_NAME,
    },
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
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL,
      maxTokens: Number(env.OPENAI_MAX_TOKENS),
      temperature: Number(env.OPENAI_TEMPERATURE),
      timeoutMs: Number(env.OPENAI_TIMEOUT_MS),
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
      maxTokens: Number(env.GEMINI_MAX_TOKENS),
      timeoutMs: Number(env.GEMINI_TIMEOUT_MS),
    },
    whisper: {
      provider: env.WHISPER_PROVIDER,
      model: env.WHISPER_MODEL,
      fasterWhisperHost: env.FASTER_WHISPER_HOST,
      fasterWhisperTimeoutMs: Number(env.FASTER_WHISPER_TIMEOUT_MS),
    },
    localLlm: {
      host: env.LOCAL_LLM_HOST,
      model: env.LOCAL_LLM_MODEL,
      timeoutMs: Number(env.LOCAL_LLM_TIMEOUT_MS),
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
