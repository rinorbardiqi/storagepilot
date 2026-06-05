import { useEffect, useState } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';

const PERSISTED_STORES = [useConnectionStore, usePreferencesStore] as const;

function allStoresHydrated(): boolean {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
}

/** Wait for zustand persist rehydration before provider API calls. */
export function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(allStoresHydrated);

  useEffect(() => {
    if (allStoresHydrated()) {
      setHydrated(true);
      return;
    }

    const unsubs = PERSISTED_STORES.map((store) =>
      store.persist.onFinishHydration(() => {
        if (allStoresHydrated()) setHydrated(true);
      }),
    );

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  return hydrated;
}
