import { sanitizeMethodArgs } from '../lib/uploadBody';
import type { ActivityLogger } from './ActivityLogger';
import type { StorageProvider } from './StorageProvider';

/** Sync helpers — must not be wrapped or callers receive Promises instead of values. */
const SYNC_METHODS = new Set(['getObjectUrl', 'getPathFormats']);

/**
 * Wraps a StorageProvider with an activity-logging proxy.
 * The logger is injected so this module has no dependency on the UI store layer.
 */
export function instrument(provider: StorageProvider, logger: ActivityLogger): StorageProvider {
  return new Proxy(provider, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig !== 'function') return orig;

      if (SYNC_METHODS.has(String(prop))) {
        return orig.bind(target);
      }

      return async (...args: unknown[]) => {
        const start = performance.now();
        const entry = {
          id: crypto.randomUUID(),
          method: String(prop),
          provider: target.type,
          args: sanitizeMethodArgs(args),
          timestamp: new Date(),
          status: 'pending' as const,
          duration: 0,
        };
        logger.addEntry(entry);
        try {
          const result = await orig.apply(target, args);
          logger.updateEntry(entry.id, {
            status: 'success',
            duration: performance.now() - start,
          });
          return result;
        } catch (err: unknown) {
          logger.updateEntry(entry.id, {
            status: 'error',
            duration: performance.now() - start,
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      };
    },
  });
}
