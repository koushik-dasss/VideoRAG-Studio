/**
 * Registry Module — type-safe container for dynamic registration and lookup
 * of providers, pipeline plugins, strategies, and shared services.
 */

import { NotFoundError, ValidationError } from '../errors/index';
import { createLogger } from '../utils/logger';

const log = createLogger('Registry');

export interface IRegistry<T> {
  register(name: string, item: T): void;
  get(name: string): T;
  has(name: string): boolean;
  unregister(name: string): boolean;
  list(): string[];
  clear(): void;
}

export class ServiceRegistry<T> implements IRegistry<T> {
  private readonly items = new Map<string, T>();
  private readonly registryName: string;

  constructor(registryName = 'ServiceRegistry') {
    this.registryName = registryName;
    log.info(`${this.registryName} initialised`);
  }

  /**
   * Register an item under a unique name. Overwrites if already registered.
   */
  register(name: string, item: T): void {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Item name must be a non-empty string');
    }
    if (item === null || item === undefined) {
      throw new ValidationError(`Cannot register null or undefined item under name "${name}"`);
    }

    const cleanName = name.trim().toLowerCase();
    const isUpdate = this.items.has(cleanName);
    this.items.set(cleanName, item);

    log.debug(isUpdate ? 'Updated registered item' : 'Registered new item', {
      registry: this.registryName,
      name: cleanName,
    });
  }

  /**
   * Retrieve an item by name. Throws `NotFoundError` if missing.
   */
  get(name: string): T {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Item name must be a non-empty string');
    }

    const cleanName = name.trim().toLowerCase();
    const item = this.items.get(cleanName);
    if (item === undefined) {
      log.warn('Registry lookup failed: item not found', {
        registry: this.registryName,
        name: cleanName,
      });
      throw new NotFoundError(cleanName, this.registryName);
    }

    return item;
  }

  /**
   * Check if an item exists in the registry.
   */
  has(name: string): boolean {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return false;
    }
    return this.items.has(name.trim().toLowerCase());
  }

  /**
   * Unregister / remove an item by name.
   */
  unregister(name: string): boolean {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return false;
    }
    const cleanName = name.trim().toLowerCase();
    const existed = this.items.delete(cleanName);
    if (existed) {
      log.debug('Unregistered item', { registry: this.registryName, name: cleanName });
    }
    return existed;
  }

  /**
   * List all registered item names.
   */
  list(): string[] {
    return Array.from(this.items.keys());
  }

  /**
   * Clear all items from the registry.
   */
  clear(): void {
    const count = this.items.size;
    this.items.clear();
    log.info('Registry cleared', { registry: this.registryName, count });
  }
}
