import type { CorsRule, ProviderType } from '../api/types';

export const SNAPSHOT_MANIFEST_FILE = 'manifest.json';
export const SNAPSHOT_FORMAT_VERSION = 1;

export interface SnapshotObjectEntry {
  key: string;
  contentType: string;
  customMetadata?: Record<string, string>;
}

export interface SnapshotBucketEntry {
  name: string;
  cors?: CorsRule[];
  objects: SnapshotObjectEntry[];
}

export interface SnapshotManifest {
  version: number;
  exportedAt: string;
  provider: ProviderType;
  profileName: string;
  profileId: string;
  buckets: SnapshotBucketEntry[];
}

export function createSnapshotManifest(
  provider: ProviderType,
  profileId: string,
  profileName: string,
  buckets: SnapshotBucketEntry[],
): SnapshotManifest {
  return {
    version: SNAPSHOT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    provider,
    profileName,
    profileId,
    buckets,
  };
}

export function parseSnapshotManifest(raw: string): SnapshotManifest | null {
  try {
    const data = JSON.parse(raw) as SnapshotManifest;
    if (data.version !== SNAPSHOT_FORMAT_VERSION || !Array.isArray(data.buckets)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function snapshotManifestToJson(manifest: SnapshotManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/** Map object path in zip → manifest entry for metadata lookup. */
export function objectManifestKey(bucket: string, key: string): string {
  return `${bucket}/${key}`;
}
