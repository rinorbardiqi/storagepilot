import { describe, expect, it, vi } from 'vitest';
import {
  deleteBucketWithContents,
  emptyBucketContents,
  isMissingBucketError,
} from '@/api/providerHelpers';
import { StorageError } from '@/api/types';
import type { StorageProvider } from '@/api/StorageProvider';
import type { StorageObject } from '@/api/types';

function mockObject(key: string): StorageObject {
  return {
    key,
    size: 1,
    contentType: 'text/plain',
    lastModified: new Date('2026-01-01'),
    isFolder: false,
  };
}

function mockProvider(
  overrides: Partial<Pick<StorageProvider, 'listObjects' | 'deleteObject' | 'deleteBucket'>> = {},
) {
  return {
    listObjects: vi.fn(async () => ({ objects: [], prefixes: [] })),
    deleteObject: vi.fn(async () => undefined),
    deleteBucket: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('isMissingBucketError', () => {
  it('detects NOT_FOUND and NoSuchBucket messages', () => {
    expect(isMissingBucketError(new StorageError('NOT_FOUND', 'x', 'gcs'))).toBe(true);
    expect(isMissingBucketError(new Error('listObjects: NoSuchBucket'))).toBe(true);
    expect(isMissingBucketError(new Error('Forbidden'))).toBe(false);
  });
});

describe('emptyBucketContents', () => {
  it('deletes all objects by re-listing until the bucket is empty', async () => {
    const provider = mockProvider({
      listObjects: vi
        .fn()
        .mockResolvedValueOnce({
          objects: [mockObject('a.txt'), mockObject('b.txt')],
          prefixes: [],
        })
        .mockResolvedValueOnce({
          objects: [],
          prefixes: [],
        }),
    });

    const deleted = await emptyBucketContents(provider, 'my-bucket');

    expect(deleted).toBe(2);
    expect(provider.listObjects).toHaveBeenCalledTimes(2);
    expect(provider.deleteObject).toHaveBeenCalledWith('my-bucket', 'a.txt');
    expect(provider.deleteObject).toHaveBeenCalledWith('my-bucket', 'b.txt');
  });
});

describe('deleteBucketWithContents', () => {
  it('empties the bucket before deleting it', async () => {
    const calls: string[] = [];
    const provider = mockProvider({
      deleteObject: vi.fn(async (_bucket, key) => {
        calls.push(`deleteObject:${key}`);
      }),
      deleteBucket: vi.fn(async () => {
        calls.push('deleteBucket');
      }),
      listObjects: vi
        .fn()
        .mockResolvedValueOnce({
          objects: [mockObject('file.txt')],
          prefixes: [],
        })
        .mockResolvedValueOnce({
          objects: [],
          prefixes: [],
        }),
    });

    const result = await deleteBucketWithContents(provider, 'my-bucket');

    expect(result.deletedObjects).toBe(1);
    expect(calls).toEqual(['deleteObject:file.txt', 'deleteBucket']);
  });
});
