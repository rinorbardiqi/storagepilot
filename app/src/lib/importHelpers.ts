import type { StorageProvider } from '../api/StorageProvider';
import { isMissingBucketError } from '../api/providerHelpers';

/** Count how many zip entries would overwrite objects that already exist. */
export async function countImportOverwrites(
  provider: StorageProvider,
  files: Array<{ path: string }>,
): Promise<number> {
  const keysByBucket = new Map<string, Set<string>>();
  for (const { path } of files) {
    const slash = path.indexOf('/');
    if (slash === -1) continue;
    const bucket = path.slice(0, slash);
    const key = path.slice(slash + 1);
    if (!keysByBucket.has(bucket)) keysByBucket.set(bucket, new Set());
    keysByBucket.get(bucket)!.add(key);
  }

  let overwrites = 0;
  for (const [bucket, keys] of keysByBucket) {
    const existing = new Set<string>();
    try {
      let token: string | undefined;
      do {
        const page = await provider.listObjects(bucket, { maxResults: 500, pageToken: token });
        for (const obj of page.objects) {
          if (!obj.isFolder) existing.add(obj.key);
        }
        token = page.nextPageToken;
      } while (token);
    } catch (err) {
      if (!isMissingBucketError(err)) throw err;
    }
    for (const key of keys) {
      if (existing.has(key)) overwrites++;
    }
  }
  return overwrites;
}

export function countImportablePaths(files: Array<{ path: string }>): number {
  return files.filter((f) => f.path.includes('/')).length;
}
