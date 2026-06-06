import { refreshBuckets, useBucketStore } from '../store/bucketStore';

/** Read bucket list state. Fetching is handled by {@link useBucketSync}. */
export function useBuckets() {
  const buckets = useBucketStore((s) => s.buckets);
  const loading = useBucketStore((s) => s.loading);
  const error = useBucketStore((s) => s.error);

  return {
    buckets,
    loading,
    error,
    refresh: refreshBuckets,
  };
}
