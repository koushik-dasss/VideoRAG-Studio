import { HTTP_STATUS } from '../constants/index.js';

/** ─── Base application error ───────────────────────────────── */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** ─── Domain-specific errors ───────────────────────────────── */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    this.fields = fields;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} not found: ${identifier}`, HTTP_STATUS.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds?: number;

  constructor(message = 'Too many requests', retryAfterSeconds?: number) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** ─── Provider / Integration errors ───────────────────────── */
export class ProviderError extends AppError {
  public readonly provider: string;
  public readonly originalError?: Error;

  constructor(
    provider: string,
    message: string,
    originalError?: Error,
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE,
  ) {
    super(message, statusCode, true, { provider });
    this.provider = provider;
    this.originalError = originalError;
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string, timeoutMs: number) {
    super(provider, `Provider ${provider} timed out after ${timeoutMs}ms`, undefined, HTTP_STATUS.GATEWAY_TIMEOUT);
  }
}

export class ProviderRateLimitError extends ProviderError {
  public readonly retryAfterSeconds?: number;

  constructor(provider: string, retryAfterSeconds?: number) {
    super(
      provider,
      `Provider ${provider} rate limit exceeded`,
      undefined,
      HTTP_STATUS.TOO_MANY_REQUESTS,
    );
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** ─── Pipeline errors ──────────────────────────────────────── */
export class PipelineError extends AppError {
  public readonly pipelineId: string;
  public readonly stage: string;

  constructor(pipelineId: string, stage: string, message: string, cause?: Error) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, true, { pipelineId, stage });
    this.pipelineId = pipelineId;
    this.stage = stage;
    if (cause) {
      this.stack = `${this.stack ?? ''}\nCaused by: ${cause.stack ?? ''}`;
    }
  }
}

export class PipelineStageError extends PipelineError {
  constructor(pipelineId: string, stage: string, cause: Error) {
    super(pipelineId, stage, `Stage '${stage}' failed: ${cause.message}`, cause);
  }
}

export class PipelineTimeoutError extends PipelineError {
  constructor(pipelineId: string, stage: string, timeoutMs: number) {
    super(pipelineId, stage, `Pipeline stage '${stage}' timed out after ${timeoutMs}ms`);
  }
}

export class PipelineNotFoundError extends NotFoundError {
  constructor(pipelineId: string) {
    super('Pipeline', pipelineId);
  }
}

/** ─── Configuration errors ─────────────────────────────────── */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, false);
  }
}

/** ─── Type guard ───────────────────────────────────────────── */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}
