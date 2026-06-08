import { sanitizeMethodArgs } from '../lib/uploadBody';
import type { ActivityLogger } from './ActivityLogger';
import type { StorageProvider } from './StorageProvider';

function extractHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const meta = (err as { $metadata?: { httpStatusCode?: number } }).$metadata;
  if (typeof meta?.httpStatusCode === 'number') return meta.httpStatusCode;
  if ('status' in err && typeof (err as { status: number }).status === 'number') {
    return (err as { status: number }).status;
  }
  if ('statusCode' in err && typeof (err as { statusCode: number }).statusCode === 'number') {
    return (err as { statusCode: number }).statusCode;
  }
  return undefined;
}

/** Sync helpers — must not be wrapped or callers receive Promises instead of values. */
const SYNC_METHODS = new Set(['getObjectUrl', 'getPathFormats']);

/** Coalesce concurrent identical calls (guards against effect dependency loops). */
const INFLIGHT = new Map<string, Promise<unknown>>();

function inflightKey(provider: string, method: string): string {
  return `${provider}:${method}`;
}

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
        const method = String(prop);
        const key = inflightKey(target.type, method);
        const pending = INFLIGHT.get(key);
        if (pending) return pending;

        const run = (async () => {
          const start = performance.now();
          const entry = {
            id: crypto.randomUUID(),
            method,
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
              httpStatus: extractHttpStatus(err),
            });
            throw err;
          }
        })();

        INFLIGHT.set(key, run);
        try {
          return await run;
        } finally {
          if (INFLIGHT.get(key) === run) INFLIGHT.delete(key);
        }
      };
    },
  });
}
