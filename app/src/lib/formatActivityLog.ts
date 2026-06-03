import type { ActivityEntry } from '../store/activityStore';
import { providerScheme } from './providerDisplay';

/** Human-readable target path including bucket folders/prefixes. */
export function formatActivityTarget(entry: ActivityEntry): string {
  const { method, args, provider } = entry;
  const scheme = providerScheme(provider);

  if (method === 'listObjects' && typeof args[0] === 'string') {
    const bucket = args[0];
    const opts = args[1] as { prefix?: string } | undefined;
    const prefix = opts?.prefix?.replace(/\/$/, '') ?? '';
    return prefix ? `${scheme}://${bucket}/${prefix}` : `${scheme}://${bucket}`;
  }

  if (
    (method === 'uploadObject' ||
      method === 'getObject' ||
      method === 'deleteObject' ||
      method === 'getObjectMetadata') &&
    typeof args[0] === 'string' &&
    typeof args[1] === 'string'
  ) {
    const bucket = args[0];
    const key = args[1];
    return `${scheme}://${bucket}/${key}`;
  }

  if (method === 'createBucket' && typeof args[0] === 'string') {
    return `${scheme}://${args[0]}`;
  }

  if (method === 'deleteBucket' && typeof args[0] === 'string') {
    return `${scheme}://${args[0]}`;
  }

  if (method === 'copyObject' || method === 'moveObject') {
    const dst = args[1] as { bucket?: string; key?: string } | undefined;
    if (dst?.bucket && dst?.key) {
      return `${scheme}://${dst.bucket}/${dst.key}`;
    }
  }

  if (typeof args[0] === 'string') {
    return args[0];
  }

  return method;
}

export function formatActivityStatus(entry: ActivityEntry): string {
  if (entry.status === 'success') return 'OK';
  if (entry.status === 'error') return 'ERR';
  return 'INF';
}

export function formatActivityLine(entry: ActivityEntry): string {
  const status = formatActivityStatus(entry);
  const time = new Date(entry.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const target = formatActivityTarget(entry);
  const op = entry.method.toUpperCase();
  const latency = entry.duration > 0 ? `${Math.round(entry.duration)}ms` : '…';
  const result =
    entry.status === 'error'
      ? entry.error ?? 'FAILED'
      : entry.httpStatus
        ? String(entry.httpStatus)
        : '200';
  return `[${status}] ${time} ${op} -> ${target} ${result} (${latency})`;
}
