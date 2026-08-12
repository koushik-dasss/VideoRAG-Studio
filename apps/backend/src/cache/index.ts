/**
 * Cache Service — fast in-memory storage with optional TTL expiration
 * and automatic value cloning to prevent mutation bugs.
 */

import { ValidationError } from '../errors/index';
import type { ICacheService } from '../interfaces/index';
import { deepClone } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('MemoryCacheService');

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
}

export class MemoryCacheService implements ICacheService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly defaultTtlSeconds?: number;

  constructor(defaultTtlSeconds?: number) {
    this.defaultTtlSeconds = defaultTtlSeconds && defaultTtlSeconds > 0 ? defaultTtlSeconds : undefined;
    log.info('MemoryCacheService initialised', { defaultTtlSeconds: this.defaultTtlSeconds });
  }

  /**
   * Retrieve cached item by key. Returns null on expiration or miss.
   */
  get<T>(key: string): Promise<T | null> {
    if (!key || typeof key !== 'string' || !key.trim()) {
      return Promise.resolve(null);
    }

    const cleanKey = key.trim();
    const entry = this.cache.get(cleanKey);
    if (!entry) {
      return Promise.resolve(null);
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      log.debug('Cache item expired, removing from store', { key: cleanKey });
      this.cache.delete(cleanKey);
      return Promise.resolve(null);
    }

    try {
      return Promise.resolve(deepClone(entry.value) as T);
    } catch (err) {
      log.warn('Failed to deep-clone cached value', { key: cleanKey, error: String(err) });
      return Promise.resolve(entry.value as T);
    }
  }

  /**
   * Store a value in cache under the given key with optional TTL in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!key || typeof key !== 'string' || !key.trim()) {
      return Promise.reject(new ValidationError('Cache key must be a non-empty string'));
    }
    if (value === undefined) {
      return Promise.reject(new ValidationError('Cannot store undefined value in cache'));
    }

    const cleanKey = key.trim();
    const ttl = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : this.defaultTtlSeconds;
    const expiresAt = ttl && ttl > 0 ? Date.now() + ttl * 1000 : null;

    let storedValue: unknown = value;
    try {
      storedValue = deepClone(value);
    } catch {
      storedValue = value;
    }

    this.cache.set(cleanKey, { value: storedValue, expiresAt });
    log.debug('Cached item stored', { key: cleanKey, ttlSeconds: ttl });
    return Promise.resolve();
  }

  /**
   * Delete an item from the cache.
   */
  delete(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string' || !key.trim()) {
      return Promise.resolve(false);
    }
    const cleanKey = key.trim();
    const existed = this.cache.delete(cleanKey);
    if (existed) {
      log.debug('Deleted item from cache', { key: cleanKey });
    }
    return Promise.resolve(existed);
  }

  /**
   * Check if a valid (non-expired) item exists under key.
   */
  has(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string' || !key.trim()) {
      return Promise.resolve(false);
    }
    const cleanKey = key.trim();
    const entry = this.cache.get(cleanKey);
    if (!entry) {
      return Promise.resolve(false);
    }
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(cleanKey);
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }

  /**
   * Clear all stored entries.
   */
  clear(): Promise<void> {
    const count = this.cache.size;
    this.cache.clear();
    log.info('Cache cleared', { count });
    return Promise.resolve();
  }

  /**
   * Remove expired items from memory (optional periodic pruning).
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }
    if (pruned > 0) {
      log.debug('Pruned expired cache items', { pruned });
    }
    return pruned;
  }
}
