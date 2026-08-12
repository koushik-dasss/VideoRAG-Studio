/**
 * Transcript Cleaning Service — cleans raw spoken transcriptions and segmented
 * word lists by removing filler words, transcription artifacts, duplicate tokens,
 * and normalizing whitespace while preserving exact timestamps.
 */

import type { ITranscriptCleaningService, TranscriptionSegment, TranscriptionWord } from '../interfaces/index';
import { normalizeWhitespace } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('TranscriptCleaningService');

/** Common speech disfluency / filler patterns (case-insensitive, whole-word bound) */
const FILLER_PATTERN = /\b(?:um+|uh+|er+|ah+|hmm+|mhm)\b/gi;

/** Common bracketed/parenthesised non-verbal audio cues (e.g., [music], (laughter)) */
const ARTIFACT_PATTERN = /\[[^\]]*\]|\([^)]*\)/g;

/** Consecutive duplicate word pattern (e.g., "the the", "I I") */
const DUPLICATE_WORD_PATTERN = /\b(\w+)(?:\s+\1\b)+/gi;

/** Redundant or broken punctuation (e.g., ",,", " .", " ?") */
const PUNCTUATION_CLEANUP_PATTERNS = [
  { pattern: /\s+([.,!?;:])/g, replacement: '$1' }, // space before punctuation
  { pattern: /,{2,}/g, replacement: ',' }, // double commas
  { pattern: /\.{4,}/g, replacement: '...' }, // excess ellipses (4+ -> 3)
  { pattern: /([!?]){2,}/g, replacement: '$1' }, // duplicate ! or ?
];

export class TranscriptCleaningService implements ITranscriptCleaningService {
  constructor() {
    log.info('TranscriptCleaningService initialised');
  }

  /**
   * Clean raw transcript text by removing filler words, audio cues,
   * duplicate tokens, and normalizing spacing and punctuation.
   */
  clean(rawText: string): string {
    if (!rawText || typeof rawText !== 'string') {
      return '';
    }

    let text = rawText;

    // 1. Remove non-verbal audio artifacts e.g. [music], (applause)
    text = text.replace(ARTIFACT_PATTERN, ' ');

    // 2. Remove filler vocalizations e.g. um, uh, er, ah
    text = text.replace(FILLER_PATTERN, ' ');

    // 3. Remove consecutive duplicate words
    text = text.replace(DUPLICATE_WORD_PATTERN, '$1');

    // 4. Normalize whitespace
    text = normalizeWhitespace(text);

    // 5. Clean up punctuation spacing and duplicates
    for (const rule of PUNCTUATION_CLEANUP_PATTERNS) {
      text = text.replace(rule.pattern, rule.replacement);
    }

    return text.trim();
  }

  /**
   * Clean an array of transcription segments while maintaining exact word-level
   * timings and filtering out segments that become completely empty.
   */
  cleanSegments(segments: TranscriptionSegment[]): TranscriptionSegment[] {
    if (!Array.isArray(segments) || segments.length === 0) {
      return [];
    }

    const startCount = segments.length;
    const cleanedSegments: TranscriptionSegment[] = [];

    for (const segment of segments) {
      const cleanedText = this.clean(segment.text);

      // Clean individual words if present
      const cleanedWords: TranscriptionWord[] = [];
      if (Array.isArray(segment.words)) {
        for (const wordObj of segment.words) {
          const cleanedWordText = this.clean(wordObj.word);
          if (cleanedWordText.length > 0 && !/[.,!?;:]/.test(cleanedWordText)) {
            cleanedWords.push({
              ...wordObj,
              word: cleanedWordText,
            });
          } else if (cleanedWordText.length > 0) {
            cleanedWords.push({
              ...wordObj,
              word: cleanedWordText,
            });
          }
        }
      }

      // If segment has non-empty text after cleaning, preserve it
      if (cleanedText.length > 0) {
        cleanedSegments.push({
          ...segment,
          text: cleanedText,
          words: cleanedWords,
        });
      }
    }

    log.debug('Segments cleaned', {
      originalSegments: startCount,
      cleanedSegments: cleanedSegments.length,
      removedSegments: startCount - cleanedSegments.length,
    });

    return cleanedSegments;
  }
}
