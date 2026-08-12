/**
 * Abstract base class for all AI providers.
 *
 * Concrete providers extend this class and implement the abstract methods.
 * The base class provides common retry/timeout wiring so that each provider
 * only needs to define its API-specific logic.
 */

import type { AppConfig } from '../config/index';
import { createLogger } from '../utils/logger';

const log = createLogger('BaseProvider');

export abstract class BaseProvider {
  public abstract readonly name: string;
  protected readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    log.info(`Provider initialised: ${this.constructor.name}`);
  }

  /** Check whether the provider's API is reachable / configured */
  abstract isAvailable(): Promise<boolean>;
}
