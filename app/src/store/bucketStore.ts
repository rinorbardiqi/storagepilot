import { create } from 'zustand';
import type { Bucket } from '../api/types';
import { useConnectionStore } from './connectionStore';

interface BucketState {
  buckets: Bucket[];
  loading: boolean;
  error: string | null;
  fetchBuckets: () => Promise<void>;
}

export const useBucketStore = create<BucketState>()((set) => ({
  buckets: [],
  loading: false,
  error: null,

  fetchBuckets: async () => {
    const provider = useConnectionStore.getState().getActiveProvider();
    if (!provider) {
      set({ buckets: [], loading: false, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const buckets = await provider.listBuckets();
      set({ buckets, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load buckets',
        buckets: [],
        loading: false,
      });
    }
  },
}));
