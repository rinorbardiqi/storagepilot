import { useEffect } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';

export function useConnectionBootstrap() {
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);
  const profiles = useConnectionStore((s) => s.profiles);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const testConnection = useConnectionStore((s) => s.testConnection);

  useEffect(() => {
    if (!onboardingComplete || !activeProfileId) return;
    void testConnection(activeProfileId);
  }, [onboardingComplete, activeProfileId, testConnection]);

  useEffect(() => {
    if (!onboardingComplete) return;
    for (const profile of profiles) {
      if (!useConnectionStore.getState().connectionStatus[profile.id]) {
        void testConnection(profile.id);
      }
    }
  }, [onboardingComplete, profiles, testConnection]);
}
