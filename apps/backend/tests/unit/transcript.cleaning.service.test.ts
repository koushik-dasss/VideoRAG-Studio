import { describe, it, expect, beforeEach } from 'vitest';

import type { TranscriptionSegment } from '../../src/interfaces/index';
import { TranscriptCleaningService } from '../../src/services/transcript.cleaning.service';

describe('TranscriptCleaningService', () => {
  let service: TranscriptCleaningService;

  beforeEach(() => {
    service = new TranscriptCleaningService();
  });

  describe('clean()', () => {
    it('removes filler vocalizations (um, uh, er, ah)', () => {
      const input = 'Welcome um to this uh presentation er on AI ah models.';
      const output = service.clean(input);
      expect(output).toBe('Welcome to this presentation on AI models.');
    });

    it('removes non-verbal bracketed artifacts ([music], (laughter))', () => {
      const input = '[music] Welcome to our channel. (laughter) Let us begin [inaudible].';
      const output = service.clean(input);
      expect(output).toBe('Welcome to our channel. Let us begin.');
    });

    it('removes consecutive duplicate words', () => {
      const input = 'I I think we we should move forward forward now.';
      const output = service.clean(input);
      expect(output).toBe('I think we should move forward now.');
    });

    it('normalizes whitespace and cleans up punctuation spacing', () => {
      const input = 'Hello  , world !   This is   a test . . .';
      const output = service.clean(input);
      expect(output).toBe('Hello, world! This is a test...');
    });

    it('returns empty string for null, undefined, or non-string input', () => {
      // @ts-expect-error testing invalid inputs
      expect(service.clean(null)).toBe('');
      // @ts-expect-error testing invalid inputs
      expect(service.clean(undefined)).toBe('');
      expect(service.clean('')).toBe('');
    });
  });

  describe('cleanSegments()', () => {
    it('cleans segment text and filters out completely empty segments', () => {
      const segments: TranscriptionSegment[] = [
        {
          id: 0,
          text: 'Welcome um to the demo.',
          startTime: 0,
          endTime: 5,
          confidence: 0.98,
          words: [
            { word: 'Welcome', startTime: 0, endTime: 1, confidence: 0.99 },
            { word: 'um', startTime: 1, endTime: 2, confidence: 0.8 },
            { word: 'to', startTime: 2, endTime: 3, confidence: 0.99 },
            { word: 'the', startTime: 3, endTime: 4, confidence: 0.99 },
            { word: 'demo.', startTime: 4, endTime: 5, confidence: 0.99 },
          ],
        },
        {
          id: 1,
          text: '[music] um uh',
          startTime: 5,
          endTime: 10,
          confidence: 0.9,
          words: [
            { word: '[music]', startTime: 5, endTime: 8, confidence: 0.9 },
            { word: 'um', startTime: 8, endTime: 9, confidence: 0.9 },
            { word: 'uh', startTime: 9, endTime: 10, confidence: 0.9 },
          ],
        },
        {
          id: 2,
          text: 'Let us begin.',
          startTime: 10,
          endTime: 15,
          confidence: 0.99,
          words: [],
        },
      ];

      const cleaned = service.cleanSegments(segments);

      expect(cleaned.length).toBe(2);
      expect(cleaned[0]?.text).toBe('Welcome to the demo.');
      expect(cleaned[0]?.words.length).toBe(4);
      expect(cleaned[1]?.id).toBe(2);
      expect(cleaned[1]?.text).toBe('Let us begin.');
    });

    it('returns empty array when passed non-array or empty array', () => {
      expect(service.cleanSegments([])).toEqual([]);
      // @ts-expect-error testing invalid input
      expect(service.cleanSegments(null)).toEqual([]);
    });
  });
});
