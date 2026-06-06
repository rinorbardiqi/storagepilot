import { useEffect, useMemo, useState } from 'react';
import type { ProviderType } from '../api/types';
import {
  availableProvidersFromManifest,
  fetchSetupManifest,
  providersKey,
  type SetupManifest,
} from '../lib/setupManifest';

interface UseSetupManifestResult {
  manifest: SetupManifest | null;
  availableProviders: ProviderType[];
  loading: boolean;
}

export function useSetupManifest(): UseSetupManifestResult {
  const [manifest, setManifest] = useState<SetupManifest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchSetupManifest().then((m) => {
      if (!cancelled) {
        setManifest(m);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const manifestKey =
    manifest?.enabledProviders?.length ?
      providersKey(manifest.enabledProviders)
    : 'all';

  const availableProviders = useMemo(
    () => availableProvidersFromManifest(manifest),
    [manifestKey],
  );

  return {
    manifest,
    availableProviders,
    loading,
  };
}
