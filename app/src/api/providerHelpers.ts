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

/** Delete every object in a bucket (re-list until empty so pagination stays consistent). */
export async function emptyBucketContents(
  provider: Pick<StorageProvider, 'listObjects' | 'deleteObject'>,
  bucket: string,
): Promise<number> {
  let deleted = 0;

  while (true) {
    const page = await provider.listObjects(bucket, { maxResults: 1000 });
    if (page.objects.length === 0) break;

    for (const obj of page.objects) {
      await provider.deleteObject(bucket, obj.key);
      deleted++;
    }
  }

  return deleted;
}

/** Empty a bucket, then delete it. Matches UI copy: "delete bucket and all its objects". */
export async function deleteBucketWithContents(
  provider: Pick<StorageProvider, 'listObjects' | 'deleteObject' | 'deleteBucket'>,
  bucket: string,
): Promise<{ deletedObjects: number }> {
  const deletedObjects = await emptyBucketContents(provider, bucket);
  await provider.deleteBucket(bucket);
  return { deletedObjects };
}
