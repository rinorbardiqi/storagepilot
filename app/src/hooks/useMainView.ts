import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useConnectionStore } from '../store/connectionStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useUiStore } from '../store/uiStore';

export type MainView =
  | 'onboarding'
  | 'provider-not-connected'
  | 'provider-error'
  | 'not-found'
  | 'bucket-list'
  | 'object-browser'
  | 'empty-bucket'
  | 'search-results'
  | 'developer-tools';

export function useMainView(): MainView {
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterContentType = useAppStore((s) => s.filterContentType);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const notFound = useUiStore((s) => s.notFound);
  const sessionConnectionLost = useUiStore((s) => s.sessionConnectionLost);
  const appSection = useUiStore((s) => s.appSection);

  return useMemo(() => {
    if (!onboardingComplete) return 'onboarding';

    const status = activeProfileId ? connectionStatus[activeProfileId] : 'unconfigured';

    if (sessionConnectionLost || status === 'disconnected') {
      return sessionConnectionLost ? 'provider-error' : 'provider-not-connected';
    }

    if (status !== 'connected' && status !== 'checking') {
      return 'provider-not-connected';
    }

    if (notFound) return 'not-found';

    if (appSection === 'developer-tools') return 'developer-tools';

    if (!currentBucket) return 'bucket-list';

    const searchActive = Boolean(searchQuery.trim() || filterContentType);
    if (searchActive) return 'search-results';

    return 'object-browser';
  }, [
    onboardingComplete,
    activeProfileId,
    connectionStatus,
    sessionConnectionLost,
    notFound,
    currentBucket,
    searchQuery,
    filterContentType,
    appSection,
  ]);
}

export function useIsSearchActive(): boolean {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterContentType = useAppStore((s) => s.filterContentType);
  return Boolean(searchQuery.trim() || filterContentType);
}
