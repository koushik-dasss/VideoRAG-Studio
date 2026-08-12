import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppError } from '../../src/errors/index';
import { ExponentialBackoffRetryEngine } from '../../src/retry/index';

describe('ExponentialBackoffRetryEngine', () => {
  let engine: ExponentialBackoffRetryEngine;

  beforeEach(() => {
    // Disable jitter and use short delays for deterministic, fast tests
    engine = new ExponentialBackoffRetryEngine({
      baseDelayMs: 1,
      maxDelayMs: 10,
      jitter: false,
    });
  });

  it('returns immediately on successful operation without retrying', async () => {
    const op = vi.fn().mockResolvedValue('success');
    const result = await engine.execute(op);
    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries when operation fails and eventually succeeds', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('eventual success');

    const onRetry = vi.fn();
    const result = await engine.execute(op, { maxAttempts: 3, onRetry, jitter: false, baseDelayMs: 1 });

    expect(result).toBe('eventual success');
    expect(op).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, expect.any(Number));
  });

  it('throws last error when maxAttempts are exhausted', async () => {
    const op = vi.fn().mockRejectedValue(new AppError('Persistent failure'));

    await expect(
      engine.execute(op, { maxAttempts: 2, baseDelayMs: 1, jitter: false }),
    ).rejects.toThrow('Persistent failure');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does not retry when isRetryable returns false', async () => {
    const nonRetryableError = new AppError('Fatal auth error');
    const op = vi.fn().mockRejectedValue(nonRetryableError);

    const isRetryable = vi.fn().mockReturnValue(false);
    const onRetry = vi.fn();

    await expect(
      engine.execute(op, { maxAttempts: 5, isRetryable, onRetry }),
    ).rejects.toThrow('Fatal auth error');

    expect(op).toHaveBeenCalledTimes(1);
    expect(isRetryable).toHaveBeenCalledWith(nonRetryableError);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
