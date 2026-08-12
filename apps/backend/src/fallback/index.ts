/**
 * Fallback Engine — cascades execution across a prioritized chain of providers
 * (e.g. primary LLM/Speech provider -> secondary fallback -> local mock) on failure.
 */

import { ProviderError, ValidationError } from '../errors/index';
import { createLogger } from '../utils/logger';

const log = createLogger('FallbackEngine');

export interface ProviderWithAvailability {
  readonly name: string;
  isAvailable(): Promise<boolean>;
}

export interface FallbackOptions<TProvider extends ProviderWithAvailability> {
  onFallback?: (error: Error, fromProvider: TProvider, toProvider: TProvider) => void;
}

export interface IFallbackEngine<TProvider extends ProviderWithAvailability> {
  execute<TResult>(
    operation: (provider: TProvider) => Promise<TResult>,
    options?: FallbackOptions<TProvider>,
  ): Promise<TResult>;
  getProviders(): TProvider[];
}

export class ProviderFallbackEngine<TProvider extends ProviderWithAvailability>
  implements IFallbackEngine<TProvider>
{
  private readonly providers: TProvider[];

  constructor(providers: TProvider[]) {
    if (!Array.isArray(providers) || providers.length === 0) {
      throw new ValidationError('At least one provider is required for FallbackEngine');
    }
    this.providers = providers.slice();
    log.info('ProviderFallbackEngine initialised', {
      chain: this.providers.map((p) => p.name),
    });
  }

  /**
   * Execute operation across the prioritized provider chain until success.
   */
  async execute<TResult>(
    operation: (provider: TProvider) => Promise<TResult>,
    options?: FallbackOptions<TProvider>,
  ): Promise<TResult> {
    const errors: Error[] = [];

    for (let i = 0; i < this.providers.length; i++) {
      const currentProvider = this.providers[i];
      if (!currentProvider) {
        continue;
      }

      try {
        const isAvail = await currentProvider.isAvailable();
        if (!isAvail && i < this.providers.length - 1) {
          log.warn('Skipping unavailable provider in fallback chain', {
            provider: currentProvider.name,
          });
          continue;
        }
      } catch (checkErr) {
        log.warn('Availability check failed for provider', {
          provider: currentProvider.name,
          error: String(checkErr),
        });
        if (i < this.providers.length - 1) {
          continue;
        }
      }

      try {
        log.debug('Attempting operation with provider', { provider: currentProvider.name });
        const result = await operation(currentProvider);
        if (i > 0) {
          log.info('Operation succeeded via fallback provider', { provider: currentProvider.name });
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errors.push(error);

        const isLastProvider = i === this.providers.length - 1;
        if (isLastProvider) {
          log.error('All providers in fallback chain failed', {
            lastProvider: currentProvider.name,
            error: error.message,
          });
          throw new ProviderError(
            currentProvider.name,
            `Fallback chain exhausted after ${this.providers.length} attempts. Last error: ${error.message}`,
            error,
          );
        }

        const nextProvider = this.providers[i + 1];
        if (nextProvider) {
          log.warn('Provider failed, cascading to next fallback', {
            fromProvider: currentProvider.name,
            toProvider: nextProvider.name,
            error: error.message,
          });

          if (options?.onFallback) {
            try {
              options.onFallback(error, currentProvider, nextProvider);
            } catch (callbackErr) {
              log.error('Error in onFallback callback', { error: String(callbackErr) });
            }
          }
        }
      }
    }

    const firstErr = errors[0] ?? new Error('No providers succeeded');
    throw new ProviderError('fallback-chain', `All providers failed: ${firstErr.message}`, firstErr);
  }

  /**
   * Return the configured chain of providers.
   */
  getProviders(): TProvider[] {
    return this.providers.slice();
  }
}
