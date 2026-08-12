/**
 * Event Bus Module — provides type-safe event publication and subscription
 * across pipeline stages and background services.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger';

const log = createLogger('EventBus');

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface IEventBus {
  on<T = unknown>(event: string, handler: EventHandler<T>): void;
  once<T = unknown>(event: string, handler: EventHandler<T>): void;
  off<T = unknown>(event: string, handler: EventHandler<T>): void;
  emit<T = unknown>(event: string, payload: T): boolean | Promise<boolean>;
  emitAsync?<T = unknown>(event: string, payload: T): Promise<boolean>;
  removeAllListeners(event?: string): void;
  listenerCount(event: string): number;
}

export class EventEmitterEventBus implements IEventBus {
  private readonly emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    // Increase default max listeners to avoid false leak warnings in large pipelines
    this.emitter.setMaxListeners(50);
    log.info('EventEmitterEventBus initialised');
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
    log.debug('Listener registered', { event, count: this.listenerCount(event) });
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.emitter.once(event, handler as (...args: unknown[]) => void);
    log.debug('One-time listener registered', { event, count: this.listenerCount(event) });
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
    log.debug('Listener removed', { event, count: this.listenerCount(event) });
  }

  emit<T = unknown>(event: string, payload: T): boolean {
    log.debug('Emitting event', { event });
    try {
      return this.emitter.emit(event, payload);
    } catch (err) {
      log.error('Error occurred in synchronous event listener', {
        event,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async emitAsync<T = unknown>(event: string, payload: T): Promise<boolean> {
    log.debug('Emitting event async', { event });
    try {
      return this.emitter.emit(event, payload);
    } catch (err) {
      log.error('Error occurred in async event listener', {
        event,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.emitter.removeAllListeners(event);
      log.debug('Removed all listeners for event', { event });
    } else {
      this.emitter.removeAllListeners();
      log.debug('Removed all listeners for all events');
    }
  }

  listenerCount(event: string): number {
    return this.emitter.listenerCount(event);
  }
}
