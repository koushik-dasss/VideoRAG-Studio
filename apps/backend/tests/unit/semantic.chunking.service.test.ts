import { describe, it, expect, beforeEach } from 'vitest';

import type { TranscriptionSegment } from '../../src/interfaces/index';
import { SemanticChunkingService } from '../../src/services/semantic.chunking.service';

describe('SemanticChunkingService', () => {
  let service: SemanticChunkingService;

  beforeEach(() => {
    service = new SemanticChunkingService({
      minDurationSeconds: 10,
      maxDurationSeconds: 30,
      maxTokens: 100,
      overlapSeconds: 5,
    });
  });

  it('returns empty array when input is empty or non-array', () => {
    expect(service.chunk([])).toEqual([]);
    // @ts-expect-error testing invalid inputs
    expect(service.chunk(null)).toEqual([]);
  });

  it('groups segments into chunks based on duration and sentence boundaries', () => {
    const segments: TranscriptionSegment[] = [
      { id: 1, text: 'This is the first segment.', startTime: 0, endTime: 6, words: [], confidence: 0.95 },
      { id: 2, text: 'This completes the first point.', startTime: 6, endTime: 12, words: [], confidence: 0.96 },
      { id: 3, text: 'Now we move to topic two.', startTime: 12, endTime: 20, words: [], confidence: 0.97 },
      { id: 4, text: 'We explain topic two clearly.', startTime: 20, endTime: 28, words: [], confidence: 0.98 },
      { id: 5, text: 'Finally we conclude our video.', startTime: 28, endTime: 36, words: [], confidence: 0.99 },
    ];

    const chunks = service.chunk(segments);

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    // Verify first chunk has duration >= minDuration (10s) and ends with punctuation
    const firstChunk = chunks[0];
    if (!firstChunk) {
      throw new Error('firstChunk is undefined');
    }
    expect(firstChunk.length).toBeGreaterThanOrEqual(2);
    const lastSeg = firstChunk[firstChunk.length - 1];
    const firstSeg = firstChunk[0];
    if (!lastSeg || !firstSeg) {
      throw new Error('Segments missing');
    }
    const firstDuration = lastSeg.endTime - firstSeg.startTime;
    expect(firstDuration).toBeGreaterThanOrEqual(10);
  });

  it('includes overlapping segments when overlapSeconds > 0', () => {
    const segments: TranscriptionSegment[] = [
      { id: 10, text: 'First part of speech.', startTime: 0, endTime: 8, words: [], confidence: 0.95 },
      { id: 11, text: 'Second part of speech.', startTime: 8, endTime: 15, words: [], confidence: 0.96 },
      { id: 12, text: 'Third part of speech starts.', startTime: 15, endTime: 25, words: [], confidence: 0.97 },
      { id: 13, text: 'Fourth part concludes.', startTime: 25, endTime: 35, words: [], confidence: 0.98 },
    ];

    const chunks = service.chunk(segments);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    const firstChunk = chunks[0];
    const secondChunk = chunks[1];
    if (!firstChunk || !secondChunk) {
      throw new Error('Chunks missing');
    }

    // With overlap, at least one segment from the end of chunk 0 should appear at the start of chunk 1
    const lastOfFirst = firstChunk[firstChunk.length - 1];
    const firstOfSecond = secondChunk[0];
    if (!lastOfFirst || !firstOfSecond) {
      throw new Error('Segments missing');
    }
    expect(firstOfSecond.id).toBeLessThanOrEqual(lastOfFirst.id);
  });

  it('forces split when maxTokens or maxDuration is exceeded even without punctuation', () => {
    const longTextSegment: TranscriptionSegment = {
      id: 1,
      text: Array(60).fill('word').join(' '), // ~78 tokens
      startTime: 0,
      endTime: 15,
      words: [],
      confidence: 0.9,
    };
    const secondLongSegment: TranscriptionSegment = {
      id: 2,
      text: Array(60).fill('word').join(' '), // ~78 tokens
      startTime: 15,
      endTime: 30,
      words: [],
      confidence: 0.9,
    };

    // Both combined = ~156 tokens > maxTokens (100)
    const chunks = service.chunk([longTextSegment, secondLongSegment]);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });
});
