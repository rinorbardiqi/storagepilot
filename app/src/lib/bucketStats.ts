import type { StorageProvider } from '../api/StorageProvider';
import type { BucketStats } from '../api/types';

/** Paginate listObjects and aggregate bucket statistics. */
export async function computeBucketStats(
  provider: StorageProvider,
  bucket: string,
): Promise<BucketStats> {
  let pageToken: string | undefined;
  let objectCount = 0;
  let totalSize = 0;
  const contentTypeBreakdown: Record<string, { count: number; size: number }> = {};
  const largestObjects: Array<{ key: string; size: number }> = [];

  do {
    const page = await provider.listObjects(bucket, { maxResults: 500, pageToken });
    for (const obj of page.objects) {
      if (obj.isFolder || obj.key.endsWith('/')) continue;
      objectCount += 1;
      totalSize += obj.size;
      const ct = (obj.contentType || 'application/octet-stream').split(';')[0]!.trim();
      if (!contentTypeBreakdown[ct]) contentTypeBreakdown[ct] = { count: 0, size: 0 };
      contentTypeBreakdown[ct].count += 1;
      contentTypeBreakdown[ct].size += obj.size;
      largestObjects.push({ key: obj.key, size: obj.size });
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  largestObjects.sort((a, b) => b.size - a.size);

  return {
    objectCount,
    totalSize,
    contentTypeBreakdown,
    largestObjects: largestObjects.slice(0, 10),
  };
}
