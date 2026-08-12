import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderError, ValidationError } from '../../src/errors/index';
import { ProviderFallbackEngine, type ProviderWithAvailability } from '../../src/fallback/index';

describe('ProviderFallbackEngine', () => {
  let primary: ProviderWithAvailability;
  let secondary: ProviderWithAvailability;
  let tertiary: ProviderWithAvailability;
  let engine: ProviderFallbackEngine<ProviderWithAvailability>;

  beforeEach(() => {
    primary = {
      name: 'primary-provider',
      isAvailable: vi.fn().mockResolvedValue(true),
    };
    secondary = {
      name: 'secondary-provider',
      isAvailable: vi.fn().mockResolvedValue(true),
    };
    tertiary = {
      name: 'tertiary-provider',
      isAvailable: vi.fn().mockResolvedValue(true),
    };

    engine = new ProviderFallbackEngine([primary, secondary, tertiary]);
  });

  it('throws ValidationError when initialized without providers array', () => {
    expect(() => new ProviderFallbackEngine([])).toThrow(ValidationError);
    // @ts-expect-error missing args
    expect(() => new ProviderFallbackEngine(null)).toThrow(ValidationError);
  });

  it('executes operation successfully with the primary provider', async () => {
    const op = vi.fn().mockResolvedValue('success from primary');
    const result = await engine.execute(op);

    expect(result).toBe('success from primary');
    expect(op).toHaveBeenCalledTimes(1);
    expect(op).toHaveBeenCalledWith(primary);
  });

  it('cascades to secondary provider when primary fails during operation', async () => {
    const op = vi
      .fn()
      .mockImplementation((p: ProviderWithAvailability) => {
        if (p.name === 'primary-provider') {
          return Promise.reject(new Error('Primary timeout'));
        }
        return Promise.resolve('success from secondary');
      });

    const onFallback = vi.fn();
    const result = await engine.execute(op, { onFallback });

    expect(result).toBe('success from secondary');
    expect(op).toHaveBeenCalledTimes(2);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith(expect.any(Error), primary, secondary);
  });

  it('skips unavailable providers automatically', async () => {
    // Primary is not available right now
    primary.isAvailable = vi.fn().mockResolvedValue(false);

    const op = vi.fn().mockResolvedValue('success from secondary');
    const result = await engine.execute(op);

    expect(result).toBe('success from secondary');
    expect(op).toHaveBeenCalledTimes(1);
    expect(op).toHaveBeenCalledWith(secondary);
  });

  it('throws ProviderError when all providers in the chain fail', async () => {
    const op = vi.fn().mockRejectedValue(new Error('Persistent failure across all providers'));

    await expect(engine.execute(op)).rejects.toThrow(ProviderError);
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('returns a shallow copy of the configured provider chain', () => {
    const list = engine.getProviders();
    expect(list).toEqual([primary, secondary, tertiary]);
    expect(list).not.toBe(engine.getProviders());
  });
});
