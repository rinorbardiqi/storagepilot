import type { StorageProvider } from './StorageProvider';
import type { ObjectRef } from './types';

/** Default CORS max-age used by all providers when omitted. */
export const DEFAULT_CORS_MAX_AGE = 3600;

/**
 * Default `testConnection` implementation shared across all providers:
 * tries to list buckets — if it succeeds, the connection is alive.
 */
export async function testConnectionViaBuckets(
  provider: Pick<StorageProvider, 'listBuckets'>,
): Promise<boolean> {
  try {
    await provider.listBuckets();
    return true;
  } catch {
    return false;
  }
}

/**
 * Default `moveObject` implementation: server-side copy then delete source.
 * Individual providers may override with a native rename API if available.
 */
export async function moveViaCopy(
  provider: Pick<StorageProvider, 'copyObject' | 'deleteObject'>,
  src: ObjectRef,
  dst: ObjectRef,
): Promise<void> {
  await provider.copyObject(src, dst);
  await provider.deleteObject(src.bucket, src.key);
}
