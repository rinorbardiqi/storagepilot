import { describe, expect, it } from 'vitest';
import { buildProfileDiagnostics } from '@/lib/connectionDiagnostics';
import type { ConnectionProfile } from '@/api/providerFactory';

const profile: ConnectionProfile = {
  id: 'default-gcs',
  name: 'GCS Local',
  type: 'gcs',
  gcsUrl: '/api/gcs',
};

describe('buildProfileDiagnostics', () => {
  it('maps connection status to checks', () => {
    const diag = buildProfileDiagnostics(profile, 'connected');
    expect(diag.checks.reachable).toBe(true);
    expect(diag.checks.listBuckets).toBe(true);
  });

  it('includes last error when disconnected', () => {
    const diag = buildProfileDiagnostics(profile, 'disconnected', 'ECONNREFUSED');
    expect(diag.lastError).toBe('ECONNREFUSED');
    expect(diag.checks.reachable).toBe(false);
  });
});
