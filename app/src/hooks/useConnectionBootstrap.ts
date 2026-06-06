import { useEffect } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { providersKey } from '../lib/setupManifest';

/** Survives Strict Mode remounts — bootstrap runs at most once per page load. */
let bootstrapDone = false;
/** Last profile we auto-tested on switch (skip repeat tests for same id). */
let lastAutoTestedProfile: string | null = null;

export function useConnectionBootstrap(hydrated = true) {
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);
  const enabledKey = usePreferencesStore((s) => providersKey(s.enabledProviders));
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);

  useEffect(() => {
    if (!hydrated || !onboardingComplete) return;

    const { testConnection, profiles, connectionStatus } = useConnectionStore.getState();

    if (!bootstrapDone) {
      bootstrapDone = true;
      const enabled = new Set(usePreferencesStore.getState().enabledProviders);
      for (const profile of profiles) {
        if (!enabled.has(profile.type)) continue;
        void testConnection(profile.id);
      }
      if (activeProfileId) lastAutoTestedProfile = activeProfileId;
      return;
    }

    if (!activeProfileId || lastAutoTestedProfile === activeProfileId) return;

    const status = connectionStatus[activeProfileId];
    lastAutoTestedProfile = activeProfileId;
    if (status === 'connected' || status === 'checking') return;

    void testConnection(activeProfileId);
  }, [hydrated, onboardingComplete, enabledKey, activeProfileId]);
}
