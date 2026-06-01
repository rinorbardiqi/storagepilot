import { useEffect } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { useBucketStore } from '../store/bucketStore';

export function useBuckets() {
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const buckets = useBucketStore((s) => s.buckets);
  const loading = useBucketStore((s) => s.loading);
  const error = useBucketStore((s) => s.error);
  const fetchBuckets = useBucketStore((s) => s.fetchBuckets);

  useEffect(() => {
    void fetchBuckets();
  }, [fetchBuckets, activeProfileId]);

  return { buckets, loading, error, refresh: fetchBuckets };
}
