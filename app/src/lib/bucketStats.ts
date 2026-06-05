import type { StorageProvider } from '../api/StorageProvider';
import type { BucketStats } from '../api/types';

const TOP_N = 10;

/** Paginate listObjects and aggregate bucket statistics without loading all keys into memory. */
export async function computeBucketStats(
  provider: StorageProvider,
  bucket: string,
): Promise<BucketStats> {
  let pageToken: string | undefined;
  let objectCount = 0;
  let totalSize = 0;
  const contentTypeBreakdown: Record<string, { count: number; size: number }> = {};

  // Fixed-size max-heap tracking the top-N largest objects.
  // We store [size, key] pairs sorted ascending so the smallest of the top-N
  // is at index 0 and can be evicted cheaply.
  const topN: Array<{ key: string; size: number }> = [];

  const insertTopN = (key: string, size: number) => {
    if (topN.length < TOP_N) {
      topN.push({ key, size });
      topN.sort((a, b) => a.size - b.size);
    } else if (topN[0] && size > topN[0].size) {
      topN[0] = { key, size };
      topN.sort((a, b) => a.size - b.size);
    }
  };

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
      insertTopN(obj.key, obj.size);
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  return {
    objectCount,
    totalSize,
    contentTypeBreakdown,
    largestObjects: topN.sort((a, b) => b.size - a.size),
  };
}
