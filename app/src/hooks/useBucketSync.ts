import { useEffect } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useBucketStore } from '../store/bucketStore';

/** Tracks the last profile+status we synced so we only fetch once per connect. */
let lastSyncKey = '';

/**
 * Single app-wide subscription that loads buckets when the active profile connects.
 * Call once from AppLayout — do not fetch from per-component hooks.
 */
export function useBucketSync() {
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const connectionStatus = useConnectionStore((s) =>
    activeProfileId ? s.connectionStatus[activeProfileId] : undefined,
  );

  useEffect(() => {
    if (!onboardingComplete) {
      lastSyncKey = '';
      return;
    }

    const key = `${activeProfileId ?? ''}:${connectionStatus ?? ''}`;

    if (connectionStatus !== 'connected') {
      if (lastSyncKey.endsWith(':connected')) {
        const { buckets, loading, error } = useBucketStore.getState();
        if (buckets.length > 0 || loading || error !== null) {
          useBucketStore.setState({ buckets: [], loading: false, error: null });
        }
      }
      lastSyncKey = key;
      return;
    }

    if (lastSyncKey === key) return;
    lastSyncKey = key;
    void useBucketStore.getState().fetchBuckets();
  }, [onboardingComplete, activeProfileId, connectionStatus]);
}
