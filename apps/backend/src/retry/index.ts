/**
 * Retry Engine — provides resilient exponential backoff with jitter
 * for asynchronous operations (e.g. LLM calls, speech API requests).
 */

import { RETRY_DEFAULTS } from '../constants/index';
import { AppError } from '../errors/index';
import { calculateBackoff, sleep } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('RetryEngine');

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  isRetryable?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

export interface IRetryEngine {
  execute<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
}

export class ExponentialBackoffRetryEngine implements IRetryEngine {
  private readonly defaultOptions: Required<Omit<RetryOptions, 'isRetryable' | 'onRetry'>>;

  constructor(defaults?: Partial<RetryOptions>) {
    this.defaultOptions = {
      maxAttempts: defaults?.maxAttempts ?? RETRY_DEFAULTS.MAX_ATTEMPTS,
      baseDelayMs: defaults?.baseDelayMs ?? RETRY_DEFAULTS.BASE_DELAY_MS,
      maxDelayMs: defaults?.maxDelayMs ?? RETRY_DEFAULTS.MAX_DELAY_MS,
      backoffMultiplier: defaults?.backoffMultiplier ?? RETRY_DEFAULTS.BACKOFF_MULTIPLIER,
      jitter: defaults?.jitter ?? RETRY_DEFAULTS.JITTER,
    };
    log.info('ExponentialBackoffRetryEngine initialised', { defaults: this.defaultOptions });
  }

  /**
   * Execute an async operation with automatic retry on failure.
   */
  async execute<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T> {
    const maxAttempts = Math.max(1, options?.maxAttempts ?? this.defaultOptions.maxAttempts);
    const baseDelayMs = Math.max(1, options?.baseDelayMs ?? this.defaultOptions.baseDelayMs);
    const maxDelayMs = Math.max(baseDelayMs, options?.maxDelayMs ?? this.defaultOptions.maxDelayMs);
    const backoffMultiplier = Math.max(1, options?.backoffMultiplier ?? this.defaultOptions.backoffMultiplier);
    const jitter = options?.jitter ?? this.defaultOptions.jitter;
    const isRetryable = options?.isRetryable;
    const onRetry = options?.onRetry;

    let lastError: Error = new AppError('Operation failed without explicit error');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error;

        const isLastAttempt = attempt >= maxAttempts;
        const canRetryError = isRetryable ? isRetryable(error) : true;

        if (isLastAttempt || !canRetryError) {
          log.debug('Stopping retries', {
            attempt,
            maxAttempts,
            canRetryError,
            error: error.message,
          });
          throw error;
        }

        const delayMs = calculateBackoff(attempt, baseDelayMs, maxDelayMs, backoffMultiplier, jitter);

        log.warn('Operation failed, scheduling retry', {
          attempt,
          nextAttempt: attempt + 1,
          maxAttempts,
          delayMs,
          error: error.message,
        });

        if (onRetry) {
          try {
            onRetry(error, attempt, delayMs);
          } catch (callbackErr) {
            log.error('Error in onRetry callback', { error: String(callbackErr) });
          }
        }

        await sleep(delayMs);
      }
    }

    throw lastError;
  }
}
