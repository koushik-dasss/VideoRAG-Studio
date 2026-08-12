import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCacheService } from '../../src/cache/index';
import { ValidationError } from '../../src/errors/index';
import { sleep } from '../../src/utils/index';

describe('MemoryCacheService', () => {
  let cache: MemoryCacheService;

  beforeEach(() => {
    cache = new MemoryCacheService();
  });

  it('stores and retrieves an item deep-cloning value', async () => {
    const original = { foo: 'bar', count: 10 };
    await cache.set('item:1', original);

    // Mutate original
    original.foo = 'mutated';

    const retrieved = await cache.get<{ foo: string; count: number }>('item:1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.foo).toBe('bar');
  });

  it('returns null when item is missing or expired', async () => {
    const result = await cache.get('missing');
    expect(result).toBeNull();

    // Store with 0.05 seconds TTL (50 ms)
    await cache.set('short-lived', { data: 123 }, 0.05);
    expect(await cache.has('short-lived')).toBe(true);

    await sleep(65);
    expect(await cache.has('short-lived')).toBe(false);
    expect(await cache.get('short-lived')).toBeNull();
  });

  it('deletes an item and returns boolean indicator', async () => {
    await cache.set('to-delete', 'hello');
    expect(await cache.has('to-delete')).toBe(true);

    const deleted = await cache.delete('to-delete');
    expect(deleted).toBe(true);
    expect(await cache.has('to-delete')).toBe(false);

    const deletedAgain = await cache.delete('to-delete');
    expect(deletedAgain).toBe(false);
  });

  it('clears all items from the store', async () => {
    await cache.set('key1', 1);
    await cache.set('key2', 2);
    expect(await cache.has('key1')).toBe(true);

    await cache.clear();
    expect(await cache.has('key1')).toBe(false);
    expect(await cache.has('key2')).toBe(false);
  });

  it('throws ValidationError when key is empty string or value is undefined', async () => {
    await expect(cache.set('', { val: 1 })).rejects.toThrow(ValidationError);
    await expect(cache.set('valid-key', undefined)).rejects.toThrow(ValidationError);
  });

  it('prunes expired items right when called', async () => {
    await cache.set('keep', 'val', 60);
    await cache.set('expire', 'val', 0.05);

    await sleep(65);
    const pruned = cache.prune();
    expect(pruned).toBe(1);
    expect(await cache.has('keep')).toBe(true);
  });
});
