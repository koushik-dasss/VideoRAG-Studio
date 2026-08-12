import { describe, it, expect } from 'vitest';

import {
  generateId,
  sleep,
  calculateBackoff,
  chunk,
  deepClone,
  clamp,
  secondsToTimestamp,
  timestampToSeconds,
  safeJsonParse,
  normalizeWhitespace,
  truncate,
  estimateTokenCount,
  omit,
  pick,
} from '../../src/utils';

describe('Utils', () => {
  describe('generateId', () => {
    it('generates a valid UUID v4', () => {
      const id = generateId();
      expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
    });

    it('generates unique IDs', () => {
      expect(generateId()).not.toBe(generateId());
    });
  });

  describe('sleep', () => {
    it('resolves after the given delay', async () => {
      const start = Date.now();
      await sleep(50);
      expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });
  });

  describe('calculateBackoff', () => {
    it('returns a value <= maxDelayMs', () => {
      const delay = calculateBackoff(10, 1000, 5000, 2, false);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('returns 0 on first attempt without jitter', () => {
      const delay = calculateBackoff(1, 1000, 30000, 2, false);
      expect(delay).toBe(1000);
    });

    it('returns a non-negative value with jitter', () => {
      const delay = calculateBackoff(3, 500, 10000, 2, true);
      expect(delay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('chunk', () => {
    it('splits array into correct batches', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('handles empty array', () => {
      expect(chunk([], 3)).toEqual([]);
    });

    it('returns single chunk when size >= array length', () => {
      expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
    });
  });

  describe('deepClone', () => {
    it('creates a deep copy', () => {
      const obj = { a: { b: 1 } };
      const clone = deepClone(obj);
      clone.a.b = 99;
      expect(obj.a.b).toBe(1);
    });
  });

  describe('clamp', () => {
    it('clamps below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('returns value when in range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
  });

  describe('secondsToTimestamp', () => {
    it('converts 3661 seconds to 01:01:01', () => {
      expect(secondsToTimestamp(3661)).toBe('01:01:01');
    });

    it('pads single digits', () => {
      expect(secondsToTimestamp(65)).toBe('00:01:05');
    });
  });

  describe('timestampToSeconds', () => {
    it('parses HH:MM:SS', () => {
      expect(timestampToSeconds('01:01:01')).toBe(3661);
    });

    it('parses MM:SS', () => {
      expect(timestampToSeconds('01:30')).toBe(90);
    });

    it('throws on invalid format', () => {
      expect(() => timestampToSeconds('invalid')).toThrow();
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
      expect(safeJsonParse<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    });

    it('returns null on invalid JSON', () => {
      expect(safeJsonParse('not-json')).toBeNull();
    });
  });

  describe('normalizeWhitespace', () => {
    it('collapses multiple spaces', () => {
      expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('does not truncate short strings', () => {
      expect(truncate('hi', 10)).toBe('hi');
    });
  });

  describe('estimateTokenCount', () => {
    it('returns a positive integer', () => {
      expect(estimateTokenCount('hello world test')).toBeGreaterThan(0);
    });
  });

  describe('omit', () => {
    it('removes specified keys', () => {
      expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('pick', () => {
    it('keeps only specified keys', () => {
      expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });
  });
});
