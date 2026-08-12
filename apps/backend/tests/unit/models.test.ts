import { describe, it, expect } from 'vitest';

import {
  createVideo,
  createTranscript,
  createChapter,
  chaptersFromGenerated,
  createEmbeddingRecord,
  createPipelineRun,
} from '../../src/models/index';

describe('Domain Models', () => {
  describe('createVideo', () => {
    it('generates id and timestamps', () => {
      const video = createVideo({
        filePath: '/videos/test.mp4',
        metadata: {
          title: 'Test Video',
          durationSeconds: 120,
          sizeBytes: 1024000,
          format: 'mp4',
        },
      });

      expect(video.id).toBeDefined();
      expect(video.id).toMatch(/^[\da-f-]{36}$/);
      expect(video.createdAt).toBeDefined();
      expect(video.updatedAt).toBeDefined();
      expect(video.status).toBe('uploaded');
      expect(video.filePath).toBe('/videos/test.mp4');
      expect(video.metadata.title).toBe('Test Video');
    });

    it('accepts custom status', () => {
      const video = createVideo({
        filePath: '/test.mp4',
        status: 'processing',
        metadata: {
          title: 'Test',
          durationSeconds: 60,
          sizeBytes: 500,
          format: 'mp4',
        },
      });

      expect(video.status).toBe('processing');
    });

    it('generates unique IDs for each call', () => {
      const v1 = createVideo({
        filePath: '/a.mp4',
        metadata: { title: 'A', durationSeconds: 1, sizeBytes: 1, format: 'mp4' },
      });
      const v2 = createVideo({
        filePath: '/b.mp4',
        metadata: { title: 'B', durationSeconds: 1, sizeBytes: 1, format: 'mp4' },
      });

      expect(v1.id).not.toBe(v2.id);
    });
  });

  describe('createTranscript', () => {
    it('sets isClean to false by default', () => {
      const transcript = createTranscript({
        videoId: 'video-123',
        segments: [],
        fullText: 'Hello world',
        language: 'en',
        durationSeconds: 10,
        provider: 'whisper',
      });

      expect(transcript.isClean).toBe(false);
      expect(transcript.videoId).toBe('video-123');
      expect(transcript.id).toBeDefined();
    });
  });

  describe('createChapter', () => {
    it('builds chapter with all fields', () => {
      const chapter = createChapter({
        videoId: 'v1',
        transcriptId: 't1',
        index: 0,
        title: 'Introduction',
        summary: 'Opening',
        startTime: 0,
        endTime: 120,
        keywords: ['intro'],
      });

      expect(chapter.id).toBeDefined();
      expect(chapter.title).toBe('Introduction');
      expect(chapter.startTime).toBe(0);
      expect(chapter.endTime).toBe(120);
      expect(chapter.keywords).toEqual(['intro']);
    });
  });

  describe('chaptersFromGenerated', () => {
    it('converts GeneratedChapter array to Chapter entities', () => {
      const chapters = chaptersFromGenerated('v1', 't1', [
        {
          index: 0,
          title: 'Part 1',
          summary: 'First part',
          startTime: 0,
          endTime: 60,
          keywords: ['first'],
        },
        {
          index: 1,
          title: 'Part 2',
          summary: 'Second part',
          startTime: 60,
          endTime: 120,
          keywords: ['second'],
        },
      ]);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].videoId).toBe('v1');
      expect(chapters[0].transcriptId).toBe('t1');
      expect(chapters[1].title).toBe('Part 2');
      // Each gets a unique ID
      expect(chapters[0].id).not.toBe(chapters[1].id);
    });
  });

  describe('createEmbeddingRecord', () => {
    it('computes dimensions from vector length', () => {
      const record = createEmbeddingRecord({
        sourceId: 'ch1',
        sourceType: 'chapter',
        vector: [0.1, 0.2, 0.3, 0.4],
        model: 'mock',
      });

      expect(record.dimensions).toBe(4);
      expect(record.sourceType).toBe('chapter');
    });
  });

  describe('createPipelineRun', () => {
    it('initialises with pending state and 0 progress', () => {
      const run = createPipelineRun({
        videoId: 'v1',
        provider: 'gemini',
      });

      expect(run.state).toBe('pending');
      expect(run.progress).toBe(0);
      expect(run.stages).toEqual([]);
      expect(run.provider).toBe('gemini');
    });

    it('accepts custom config', () => {
      const run = createPipelineRun({
        videoId: 'v1',
        provider: 'gemini',
        config: { maxChapters: 10 },
      });

      expect(run.config).toEqual({ maxChapters: 10 });
    });
  });
});
