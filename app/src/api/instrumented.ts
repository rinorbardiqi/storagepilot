import { useActivityStore } from '../store/activityStore';
import { sanitizeMethodArgs } from '../lib/uploadBody';
import type { StorageProvider } from './StorageProvider';

/** Sync helpers — must not be wrapped or callers receive Promises instead of values. */
const SYNC_METHODS = new Set(['getObjectUrl', 'getPathFormats']);

export function instrument(provider: StorageProvider): StorageProvider {
  const logger = useActivityStore.getState();

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
