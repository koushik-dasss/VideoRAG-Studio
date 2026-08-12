/**
 * Progress Tracking Engine — manages multi-stage progress tracking, step percentage,
 * elapsed duration, and accurate ETA estimation across video processing pipelines.
 */

import { PIPELINE_EVENTS } from '../constants/index';
import { NotFoundError, ValidationError } from '../errors/index';
import type { IEventBus } from '../events/index';
import { clamp, nowIso } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('ProgressTracker');

export interface ProgressUpdate {
  pipelineId: string;
  stage: string;
  percentage: number; // 0 to 100
  completedSteps: number;
  totalSteps: number;
  etaSeconds: number | null;
  message?: string;
  timestamp: string;
}

interface PipelineProgressState {
  pipelineId: string;
  stages: string[];
  currentStage: string;
  completedSteps: number;
  totalSteps: number;
  stageStartTime: number;
  message?: string;
}

export interface IProgressTracker {
  initializePipeline(pipelineId: string, stages: string[]): void;
  startStage(pipelineId: string, stage: string, totalSteps?: number, message?: string): void;
  updateProgress(
    pipelineId: string,
    stage: string,
    completedSteps: number,
    totalSteps?: number,
    message?: string,
  ): ProgressUpdate;
  completeStage(pipelineId: string, stage: string, message?: string): ProgressUpdate;
  failStage(pipelineId: string, stage: string, message?: string): ProgressUpdate;
  getProgress(pipelineId: string): ProgressUpdate | null;
  clear(pipelineId: string): void;
}

export class ProgressTracker implements IProgressTracker {
  private readonly states = new Map<string, PipelineProgressState>();
  private readonly eventBus?: IEventBus;

  constructor(eventBus?: IEventBus) {
    this.eventBus = eventBus;
    log.info('ProgressTracker initialised', { eventBusAttached: Boolean(this.eventBus) });
  }

  /**
   * Initialize progress tracking for a new pipeline execution.
   */
  initializePipeline(pipelineId: string, stages: string[]): void {
    if (!pipelineId?.trim()) {
      throw new ValidationError('Pipeline ID must be non-empty string');
    }
    if (!Array.isArray(stages) || stages.length === 0) {
      throw new ValidationError('Stages must be a non-empty array of strings');
    }

    this.states.set(pipelineId, {
      pipelineId,
      stages: stages.slice(),
      currentStage: stages[0] ?? 'unknown',
      completedSteps: 0,
      totalSteps: 1,
      stageStartTime: Date.now(),
      message: 'Pipeline initialized',
    });

    log.debug('Pipeline progress initialized', { pipelineId, stagesCount: stages.length });
  }

  /**
   * Start tracking a specific stage within an active pipeline.
   */
  startStage(pipelineId: string, stage: string, totalSteps = 1, message?: string): void {
    const state = this.getStateOrThrow(pipelineId);

    state.currentStage = stage;
    state.completedSteps = 0;
    state.totalSteps = Math.max(1, totalSteps);
    state.stageStartTime = Date.now();
    state.message = message ?? `Starting stage: ${stage}`;

    this.emitUpdate(state);
  }

  /**
   * Update step completion inside the current stage and calculate ETA.
   */
  updateProgress(
    pipelineId: string,
    stage: string,
    completedSteps: number,
    totalSteps?: number,
    message?: string,
  ): ProgressUpdate {
    const state = this.getStateOrThrow(pipelineId);

    state.currentStage = stage;
    if (typeof totalSteps === 'number' && totalSteps > 0) {
      state.totalSteps = totalSteps;
    }
    state.completedSteps = clamp(completedSteps, 0, state.totalSteps);
    if (message) {
      state.message = message;
    }

    return this.emitUpdate(state);
  }

  /**
   * Mark the current stage as 100% complete.
   */
  completeStage(pipelineId: string, stage: string, message?: string): ProgressUpdate {
    const state = this.getStateOrThrow(pipelineId);

    state.currentStage = stage;
    state.completedSteps = state.totalSteps;
    state.message = message ?? `Stage completed: ${stage}`;

    return this.emitUpdate(state);
  }

  /**
   * Record a stage failure while preserving the last completed step count.
   */
  failStage(pipelineId: string, stage: string, message?: string): ProgressUpdate {
    const state = this.getStateOrThrow(pipelineId);

    state.currentStage = stage;
    state.message = message ?? `Stage failed: ${stage}`;

    return this.emitUpdate(state);
  }

  /**
   * Get current progress snapshot for a pipeline without modifying state.
   */
  getProgress(pipelineId: string): ProgressUpdate | null {
    const state = this.states.get(pipelineId);
    if (!state) {
      return null;
    }
    return this.computeSnapshot(state);
  }

  /**
   * Remove tracking state for a pipeline (e.g. after cleanup).
   */
  clear(pipelineId: string): void {
    const existed = this.states.delete(pipelineId);
    if (existed) {
      log.debug('Cleared pipeline progress state', { pipelineId });
    }
  }

  private getStateOrThrow(pipelineId: string): PipelineProgressState {
    const state = this.states.get(pipelineId);
    if (!state) {
      throw new NotFoundError(pipelineId, 'ProgressState');
    }
    return state;
  }

  private computeSnapshot(state: PipelineProgressState): ProgressUpdate {
    const percentage =
      state.totalSteps > 0
        ? clamp(Math.round((state.completedSteps / state.totalSteps) * 100), 0, 100)
        : 0;

    let etaSeconds: number | null = null;
    if (state.completedSteps > 0 && state.completedSteps < state.totalSteps) {
      const elapsedMs = Date.now() - state.stageStartTime;
      if (elapsedMs > 0) {
        const avgStepMs = elapsedMs / state.completedSteps;
        const remainingSteps = state.totalSteps - state.completedSteps;
        etaSeconds = Math.max(0, Math.round((avgStepMs * remainingSteps) / 1000));
      }
    } else if (state.completedSteps >= state.totalSteps) {
      etaSeconds = 0;
    }

    return {
      pipelineId: state.pipelineId,
      stage: state.currentStage,
      percentage,
      completedSteps: state.completedSteps,
      totalSteps: state.totalSteps,
      etaSeconds,
      message: state.message,
      timestamp: nowIso(),
    };
  }

  private emitUpdate(state: PipelineProgressState): ProgressUpdate {
    const update = this.computeSnapshot(state);
    if (this.eventBus) {
      try {
        void this.eventBus.emit(PIPELINE_EVENTS.PROGRESS_UPDATED, update);
      } catch (err) {
        log.warn('Failed to emit progress update event', {
          pipelineId: state.pipelineId,
          error: String(err),
        });
      }
    }
    return update;
  }
}
