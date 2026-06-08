import { describe, expect, it, vi } from 'vitest';
import type { StorageProvider } from '@/api/StorageProvider';
import { StorageError } from '@/api/types';
import { countImportablePaths, countImportOverwrites } from '@/lib/importHelpers';

function mockProvider(listImpl: (bucket: string) => Promise<{ objects: { key: string; isFolder: boolean }[] }>): StorageProvider {
  return {
    listObjects: vi.fn((bucket: string) => listImpl(bucket)),
  } as unknown as StorageProvider;
}

describe('countImportablePaths', () => {
  it('counts only bucket/key paths', () => {
    expect(
      countImportablePaths([
        { path: 'b1/a.txt' },
        { path: 'flat.txt' },
        { path: 'b2/x/y.png' },
      ]),
    ).toBe(2);
  });
});

describe('countImportOverwrites', () => {
  it('treats missing buckets as zero overwrites', async () => {
    const provider = mockProvider(async () => {
      throw new StorageError('NOT_FOUND', 'Not found', 'gcs');
    });
    const overwrites = await countImportOverwrites(provider, [{ path: 'new-bucket/file.txt' }]);
    expect(overwrites).toBe(0);
  });

  it('counts keys that already exist', async () => {
    const provider = mockProvider(async (bucket) => ({
      objects:
        bucket === 'b1'
          ? [
              { key: 'exists.txt', isFolder: false },
              { key: 'folder/', isFolder: true },
            ]
          : [],
    }));
    const overwrites = await countImportOverwrites(provider, [
      { path: 'b1/exists.txt' },
      { path: 'b1/new.txt' },
      { path: 'b2/exists.txt' },
    ]);
    expect(overwrites).toBe(1);
  });

  it('rethrows unexpected list errors', async () => {
    const provider = mockProvider(async () => {
      throw new StorageError('FORBIDDEN', 'Denied', 's3');
    });
    await expect(
      countImportOverwrites(provider, [{ path: 'b1/file.txt' }]),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
