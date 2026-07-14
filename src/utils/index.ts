import { v4 as uuidv4 } from 'uuid';

/** Generate a UUID v4 */
export function generateId(): string {
  return uuidv4();
}

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Calculate exponential back-off delay with optional jitter */
export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
  jitter = true,
): number {
  const exponential = baseDelayMs * Math.pow(multiplier, attempt - 1);
  const capped = Math.min(exponential, maxDelayMs);
  if (!jitter) {
    return capped;
  }
  // Full jitter: random value in [0, capped]
  return Math.floor(Math.random() * capped);
}

/** Chunk an array into batches of a given size */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/** Deep-clone a plain JSON-serialisable object */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/** Clamp a number to [min, max] */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Convert seconds to HH:MM:SS timestamp string */
export function secondsToTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Parse HH:MM:SS or MM:SS timestamp string to seconds */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.some(isNaN)) {
    throw new Error(`Invalid timestamp format: "${timestamp}"`);
  }
  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }
  if (parts.length === 2) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }
  throw new Error(`Invalid timestamp format: "${timestamp}"`);
}

/** Safely parse JSON — returns null on error instead of throwing */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Remove excess whitespace and trim a string */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Truncate a string to maxLength, appending ellipsis if needed */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

/** Count approximate tokens (words × 1.3 is a good heuristic for English) */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

/** Return current UTC ISO string */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Type-safe object entries */
export function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/** Omit keys from an object */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/** Pick keys from an object */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
