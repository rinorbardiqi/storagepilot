import { describe, expect, it } from 'vitest';
import {
  createSnapshotManifest,
  parseSnapshotManifest,
  SNAPSHOT_FORMAT_VERSION,
  snapshotManifestToJson,
} from '@/lib/snapshotManifest';

describe('snapshotManifest', () => {
  it('round-trips manifest JSON', () => {
    const manifest = createSnapshotManifest('gcs', 'default-gcs', 'GCS Emulator', [
      {
        name: 'demo',
        cors: [{ origins: ['*'], methods: ['GET'], headers: ['*'], maxAgeSeconds: 3600 }],
        objects: [{ key: 'a.txt', contentType: 'text/plain', customMetadata: { tag: 'x' } }],
      },
    ]);
    const parsed = parseSnapshotManifest(snapshotManifestToJson(manifest));
    expect(parsed?.version).toBe(SNAPSHOT_FORMAT_VERSION);
    expect(parsed?.buckets[0]?.name).toBe('demo');
    expect(parsed?.buckets[0]?.objects[0]?.customMetadata?.tag).toBe('x');
  });

  it('rejects invalid manifest', () => {
    expect(parseSnapshotManifest('{}')).toBeNull();
    expect(parseSnapshotManifest('not json')).toBeNull();
  });
});
