import { describe, expect, it } from 'vitest';
import { reconcileProfiles } from './reconcileProfiles';

describe('reconcileProfiles', () => {
  it('restores type and endpoints for default profiles', () => {
    const corrupted = [
      {
        id: 'default-azure',
        name: 'Azure Azurite',
        type: 'gcs' as const,
        gcsUrl: '/api/gcs',
      },
      {
        id: 'default-s3',
        name: 'LocalStack S3',
        type: 'gcs' as const,
        gcsUrl: '/api/gcs',
      },
    ];
    const fixed = reconcileProfiles(corrupted);
    const azure = fixed.find((p) => p.id === 'default-azure');
    const s3 = fixed.find((p) => p.id === 'default-s3');
    expect(azure?.type).toBe('azure');
    expect(azure?.azureHost).toBeTruthy();
    expect(s3?.type).toBe('s3');
    expect(s3?.s3Endpoint).toContain('9000');
  });

  it('omits defaults the user removed', () => {
    const stored = reconcileProfiles(
      [{ id: 'default-s3', name: 'LocalStack S3', type: 's3', s3Endpoint: 'http://localhost:9000' }],
      ['default-gcs', 'default-azure'],
    );
    expect(stored.map((p) => p.id)).toEqual(['default-s3']);
  });

  it('preserves user-edited endpoints on valid defaults', () => {
    const stored = reconcileProfiles([
      {
        id: 'default-gcs',
        name: 'GCS Emulator',
        type: 'gcs',
        gcsUrl: 'http://localhost:4443',
      },
    ]);
    const gcs = stored.find((p) => p.id === 'default-gcs');
    expect(gcs?.gcsUrl).toBe('http://localhost:4443');
  });

  it('removes legacy duplicate Local GCS entries', () => {
    const stored = reconcileProfiles([
      { id: 'default-gcs', name: 'GCS Emulator', type: 'gcs', gcsUrl: '/api/gcs' },
      { id: 'old-copy', name: 'Local GCS', type: 's3', s3Endpoint: 'http://localhost:9000' },
    ]);
    expect(stored.some((p) => p.name === 'Local GCS')).toBe(false);
    expect(stored).toHaveLength(3);
  });
});
