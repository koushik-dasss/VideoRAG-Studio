import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import { PIPELINE_EVENTS } from '../../src/constants/index';
import { NotFoundError, ValidationError } from '../../src/errors/index';
import type { IEventBus } from '../../src/events/index';
import { ProgressTracker } from '../../src/progress/index';
import { sleep } from '../../src/utils/index';

describe('ProgressTracker', () => {
  let mockEventBus: IEventBus;
  let emitMock: MockInstance;
  let tracker: ProgressTracker;

  beforeEach(() => {
    emitMock = vi.fn().mockReturnValue(true);
    mockEventBus = {
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
      emit: emitMock,
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn().mockReturnValue(1),
    };

    tracker = new ProgressTracker(mockEventBus);
  });

  it('initializes pipeline and tracks progress emitting update events', () => {
    tracker.initializePipeline('pipe-1', ['audio-extraction', 'transcription']);
    expect(tracker.getProgress('pipe-1')?.stage).toBe('audio-extraction');

    tracker.startStage('pipe-1', 'transcription', 10, 'Processing audio chunks');
    expect(emitMock).toHaveBeenCalledWith(
      PIPELINE_EVENTS.PROGRESS_UPDATED,
      expect.objectContaining({
        pipelineId: 'pipe-1',
        stage: 'transcription',
        percentage: 0,
        totalSteps: 10,
      }),
    );
  });

  it('updates completed steps and calculates ETA when in progress', async () => {
    tracker.initializePipeline('pipe-eta', ['chunking']);
    tracker.startStage('pipe-eta', 'chunking', 4);

    await sleep(20); // wait slightly so elapsedMs > 0

    const update = tracker.updateProgress('pipe-eta', 'chunking', 2);
    expect(update.percentage).toBe(50);
    expect(update.completedSteps).toBe(2);
    expect(typeof update.etaSeconds).toBe('number');
  });

  it('marks stage completed with 100% and 0s ETA', () => {
    tracker.initializePipeline('pipe-complete', ['embedding']);
    tracker.startStage('pipe-complete', 'embedding', 5);

    const done = tracker.completeStage('pipe-complete', 'embedding', 'All embeddings generated');
    expect(done.percentage).toBe(100);
    expect(done.completedSteps).toBe(5);
    expect(done.etaSeconds).toBe(0);
    expect(done.message).toBe('All embeddings generated');
  });

  it('throws ValidationError for invalid initialization arguments', () => {
    expect(() => tracker.initializePipeline('', ['stage1'])).toThrow(ValidationError);
    expect(() => tracker.initializePipeline('pipe-id', [])).toThrow(ValidationError);
  });

  it('throws NotFoundError when updating non-existent pipeline ID', () => {
    expect(() => tracker.updateProgress('unknown-pipe', 'stage1', 1)).toThrow(NotFoundError);
  });

  it('clears state cleanly', () => {
    tracker.initializePipeline('pipe-clear', ['test']);
    expect(tracker.getProgress('pipe-clear')).not.toBeNull();

    tracker.clear('pipe-clear');
    expect(tracker.getProgress('pipe-clear')).toBeNull();
  });
});
