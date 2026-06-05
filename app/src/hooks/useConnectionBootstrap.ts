import { useEffect } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';

export function useConnectionBootstrap(hydrated = true) {
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);
  const profiles = useConnectionStore((s) => s.profiles);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const testConnection = useConnectionStore((s) => s.testConnection);

  useEffect(() => {
    if (!hydrated || !onboardingComplete || !activeProfileId) return;
    void testConnection(activeProfileId);
  }, [hydrated, onboardingComplete, activeProfileId, testConnection]);

  useEffect(() => {
    if (!hydrated || !onboardingComplete) return;
    for (const profile of profiles) {
      if (!useConnectionStore.getState().connectionStatus[profile.id]) {
        void testConnection(profile.id);
      }
    }
  }, [hydrated, onboardingComplete, profiles, testConnection]);
}
