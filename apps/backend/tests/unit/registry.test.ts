import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundError, ValidationError } from '../../src/errors/index';
import { ServiceRegistry } from '../../src/registry/index';

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry<{ id: number; name: string }>;

  beforeEach(() => {
    registry = new ServiceRegistry('TestRegistry');
  });

  it('registers and retrieves items by case-insensitive name', () => {
    const item = { id: 1, name: 'MockProvider' };
    registry.register('MockProvider', item);

    expect(registry.has('mockprovider')).toBe(true);
    expect(registry.has('MOCKPROVIDER')).toBe(true);
    expect(registry.get('mockprovider')).toBe(item);
    expect(registry.list()).toEqual(['mockprovider']);
  });

  it('throws ValidationError when registering with empty or invalid name', () => {
    expect(() => registry.register('', { id: 1, name: 'Bad' })).toThrow(ValidationError);
    // @ts-expect-error invalid args
    expect(() => registry.register(null, { id: 1, name: 'Bad' })).toThrow(ValidationError);
  });

  it('throws ValidationError when registering null or undefined item', () => {
    // @ts-expect-error invalid args
    expect(() => registry.register('test', null)).toThrow(ValidationError);
    // @ts-expect-error invalid args
    expect(() => registry.register('test', undefined)).toThrow(ValidationError);
  });

  it('throws NotFoundError when getting non-existent item', () => {
    expect(() => registry.get('missing-item')).toThrow(NotFoundError);
  });

  it('unregisters an existing item and returns true/false correctly', () => {
    registry.register('item-a', { id: 10, name: 'Item A' });
    expect(registry.has('item-a')).toBe(true);

    const removed = registry.unregister('Item-A');
    expect(removed).toBe(true);
    expect(registry.has('item-a')).toBe(false);

    const removedAgain = registry.unregister('item-a');
    expect(removedAgain).toBe(false);
  });

  it('clears all items from the registry', () => {
    registry.register('one', { id: 1, name: 'One' });
    registry.register('two', { id: 2, name: 'Two' });
    expect(registry.list()).toHaveLength(2);

    registry.clear();
    expect(registry.list()).toHaveLength(0);
    expect(registry.has('one')).toBe(false);
  });
});
