/**
 * Semantic Chunking Service — divides continuous transcription segments into
 * coherent, overlapping temporal windows suitable for LLM processing and
 * vector embedding generation.
 *
 * Balances duration limits, token limits, and natural conversational pauses
 * / sentence boundaries.
 */

import { CHUNKING_DEFAULTS } from '../constants/index';
import type { ISemanticChunkingService, TranscriptionSegment } from '../interfaces/index';
import { estimateTokenCount } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('SemanticChunkingService');

export interface ChunkingOptions {
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  maxTokens?: number;
  overlapSeconds?: number;
}

export class SemanticChunkingService implements ISemanticChunkingService {
  private readonly minDuration: number;
  private readonly maxDuration: number;
  private readonly maxTokens: number;
  private readonly overlapDuration: number;

  constructor(options?: ChunkingOptions) {
    this.minDuration = options?.minDurationSeconds ?? CHUNKING_DEFAULTS.MIN_CHUNK_DURATION_SECONDS;
    this.maxDuration = options?.maxDurationSeconds ?? CHUNKING_DEFAULTS.MAX_CHUNK_DURATION_SECONDS;
    this.maxTokens = options?.maxTokens ?? CHUNKING_DEFAULTS.MAX_CHUNK_TOKENS;
    this.overlapDuration = options?.overlapSeconds ?? CHUNKING_DEFAULTS.OVERLAP_SECONDS;
    log.info('SemanticChunkingService initialised', {
      minDuration: this.minDuration,
      maxDuration: this.maxDuration,
      maxTokens: this.maxTokens,
      overlapDuration: this.overlapDuration,
    });
  }

  /**
   * Group transcription segments into semantic chunks (`TranscriptionSegment[][]`).
   */
  chunk(segments: TranscriptionSegment[]): TranscriptionSegment[][] {
    if (!Array.isArray(segments) || segments.length === 0) {
      return [];
    }

    const chunks: TranscriptionSegment[][] = [];
    let currentChunk: TranscriptionSegment[] = [];
    let currentTokens = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!seg) {
        continue;
      }

      const segTokens = estimateTokenCount(seg.text);

      // Check if adding this segment would exceed max limits (and we already have segments)
      if (currentChunk.length > 0) {
        const firstExisting = currentChunk[0];
        const projectedDuration = firstExisting ? seg.endTime - firstExisting.startTime : 0;
        const projectedTokens = currentTokens + segTokens;

        if (projectedDuration >= this.maxDuration || projectedTokens >= this.maxTokens) {
          chunks.push([...currentChunk]);

          const lastExisting = currentChunk[currentChunk.length - 1];
          if (i < segments.length && this.overlapDuration > 0 && currentChunk.length > 1 && lastExisting) {
            const overlapSegments: TranscriptionSegment[] = [];
            let overlapTokens = 0;
            const targetOverlapStart = lastExisting.endTime - this.overlapDuration;

            for (let j = currentChunk.length - 1; j >= 1; j--) {
              const candidate = currentChunk[j];
              if (!candidate) {
                continue;
              }
              if (candidate.endTime >= targetOverlapStart || overlapSegments.length === 0) {
                overlapSegments.unshift(candidate);
                overlapTokens += estimateTokenCount(candidate.text);
              } else {
                break;
              }
            }
            currentChunk = overlapSegments;
            currentTokens = overlapTokens;
          } else {
            currentChunk = [];
            currentTokens = 0;
          }
        }
      }

      currentChunk.push(seg);
      currentTokens += segTokens;

      const firstSeg = currentChunk[0];
      const lastSeg = currentChunk[currentChunk.length - 1];
      if (!firstSeg || !lastSeg) {
        continue;
      }

      const currentDuration = lastSeg.endTime - firstSeg.startTime;
      const nextSeg = i + 1 < segments.length ? segments[i + 1] : undefined;
      const pauseAfter = nextSeg ? nextSeg.startTime - lastSeg.endTime : 0;
      const endsWithPunctuation = /[.?!]$/.test(seg.text.trim());

      const hitMinWithBoundary =
        currentDuration >= this.minDuration && (pauseAfter >= 1.5 || endsWithPunctuation);

      if (hitMinWithBoundary && i < segments.length - 1) {
        chunks.push([...currentChunk]);

        if (this.overlapDuration > 0 && currentChunk.length > 1) {
          const overlapSegments: TranscriptionSegment[] = [];
          let overlapTokens = 0;
          const targetOverlapStart = lastSeg.endTime - this.overlapDuration;

          for (let j = currentChunk.length - 1; j >= 1; j--) {
            const candidate = currentChunk[j];
            if (!candidate) {
              continue;
            }
            if (candidate.endTime >= targetOverlapStart || overlapSegments.length === 0) {
              overlapSegments.unshift(candidate);
              overlapTokens += estimateTokenCount(candidate.text);
            } else {
              break;
            }
          }
          currentChunk = overlapSegments;
          currentTokens = overlapTokens;
        } else {
          currentChunk = [];
          currentTokens = 0;
        }
      }
    }

    // Push any remaining segments if not already pushed
    if (currentChunk.length > 0) {
      // If remaining chunk is very short (< half of min duration) and we already have chunks,
      // merge it into the last chunk unless that would exceed max limits by too much.
      const firstSeg = currentChunk[0];
      const lastSeg = currentChunk[currentChunk.length - 1];
      const remainingDuration = firstSeg && lastSeg ? lastSeg.endTime - firstSeg.startTime : 0;

      if (
        chunks.length > 0 &&
        remainingDuration < this.minDuration / 2 &&
        currentChunk[0] !== chunks[chunks.length - 1]?.[0]
      ) {
        const lastExistingChunk = chunks[chunks.length - 1];
        if (lastExistingChunk) {
          // Add unique remaining segments
          const existingIds = new Set(lastExistingChunk.map((s) => s.id));
          for (const s of currentChunk) {
            if (!existingIds.has(s.id)) {
              lastExistingChunk.push(s);
            }
          }
        }
      } else if (
        chunks.length === 0 ||
        currentChunk[0]?.id !== chunks[chunks.length - 1]?.[0]?.id
      ) {
        chunks.push([...currentChunk]);
      }
    }

    log.debug('Semantic chunking completed', {
      totalSegments: segments.length,
      chunksGenerated: chunks.length,
    });

    return chunks;
  }
}
