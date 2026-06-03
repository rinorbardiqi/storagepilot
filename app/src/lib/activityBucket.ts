import type { ActivityEntry } from '../store/activityStore';

/** Extract bucket name from an activity log entry, if applicable. */
export function extractBucketFromEntry(entry: ActivityEntry): string | null {
  const { method, args } = entry;

  const bucketArg = args[0];
  if (
    typeof bucketArg === 'string' &&
    (method === 'listObjects' ||
      method === 'uploadObject' ||
      method === 'getObject' ||
      method === 'deleteObject' ||
      method === 'getObjectMetadata' ||
      method === 'getBucketStats' ||
      method === 'getCorsRules' ||
      method === 'setCorsRules' ||
      method === 'listVersions' ||
      method === 'createBucket' ||
      method === 'deleteBucket')
  ) {
    return bucketArg;
  }

  if (method === 'copyObject' || method === 'moveObject') {
    const dst = args[1] as { bucket?: string } | undefined;
    if (dst?.bucket) return dst.bucket;
    const src = args[0] as { bucket?: string } | undefined;
    if (src?.bucket) return src.bucket;
  }

  return null;
}
