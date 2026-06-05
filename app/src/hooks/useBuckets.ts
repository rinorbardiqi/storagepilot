import { useEffect } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { useBucketStore } from '../store/bucketStore';

export function useBuckets() {
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const connectionStatus = useConnectionStore((s) =>
    activeProfileId ? s.connectionStatus[activeProfileId] : undefined,
  );
  const buckets = useBucketStore((s) => s.buckets);
  const loading = useBucketStore((s) => s.loading);
  const error = useBucketStore((s) => s.error);
  const fetchBuckets = useBucketStore((s) => s.fetchBuckets);

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      useBucketStore.setState({ buckets: [], loading: false, error: null });
      return;
    }
    void fetchBuckets();
  }, [fetchBuckets, activeProfileId, connectionStatus]);

  return { buckets, loading, error, refresh: fetchBuckets };
}
