import type { ConnectionProfile } from '../api/providerFactory';
import { profileEndpoint } from './providerAccent';
import type { ConnectionStatus } from '../store/connectionStore';

export interface ProfileDiagnostics {
  profileId: string;
  profileName: string;
  provider: ConnectionProfile['type'];
  status: ConnectionStatus;
  endpoint: string;
  lastError?: string;
  checks: {
    reachable: boolean;
    listBuckets: boolean;
    corsConfigured?: boolean;
  };
}

export function buildProfileDiagnostics(
  profile: ConnectionProfile,
  status: ConnectionStatus,
  lastError?: string,
  checks?: Partial<ProfileDiagnostics['checks']>,
): ProfileDiagnostics {
  const reachable = status === 'connected';
  return {
    profileId: profile.id,
    profileName: profile.name,
    provider: profile.type,
    status,
    endpoint: profileEndpoint(profile),
    lastError,
    checks: {
      reachable,
      listBuckets: checks?.listBuckets ?? reachable,
      corsConfigured: checks?.corsConfigured,
    },
  };
}

export async function runProfileDiagnostics(
  profile: ConnectionProfile,
  testConnection: (id: string, options?: { force?: boolean }) => Promise<boolean>,
  getProvider: (id: string) => import('../api/StorageProvider').StorageProvider | null,
): Promise<ProfileDiagnostics> {
  const { useConnectionStore } = await import('../store/connectionStore');
  const state = useConnectionStore.getState();
  const status = state.connectionStatus[profile.id] ?? 'unconfigured';
  const lastError = state.connectionErrors[profile.id];

  const reachable = await testConnection(profile.id, { force: true });
  const updatedStatus = useConnectionStore.getState().connectionStatus[profile.id] ?? status;

  let listBuckets = reachable;
  let corsConfigured: boolean | undefined;

  const provider = getProvider(profile.id);
  if (provider && reachable) {
    try {
      const buckets = await provider.listBuckets();
      listBuckets = buckets.length >= 0;
      if (buckets[0]) {
        try {
          const cors = await provider.getCorsRules(buckets[0].name);
          corsConfigured = cors.length > 0;
        } catch {
          corsConfigured = false;
        }
      }
    } catch {
      listBuckets = false;
    }
  }

  return buildProfileDiagnostics(profile, updatedStatus, lastError, {
    reachable,
    listBuckets,
    corsConfigured,
  });
}
