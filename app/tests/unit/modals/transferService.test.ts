import { describe, expect, it, vi } from 'vitest';
import { buildDestinationKey, transferObjects } from '@/lib/transferService';
import type { StorageProvider } from '@/api/StorageProvider';

describe('buildDestinationKey', () => {
  it('preserves full path when requested', () => {
    expect(buildDestinationKey('photos/2024/a.jpg', 'backup', true)).toBe('backup/photos/2024/a.jpg');
    expect(buildDestinationKey('photos/2024/a.jpg', '', true)).toBe('photos/2024/a.jpg');
  });

  it('flattens to filename when preservePath is false', () => {
    expect(buildDestinationKey('photos/2024/a.jpg', 'archive/q2', false)).toBe('archive/q2/a.jpg');
  });
});

describe('transferObjects', () => {
  it('returns per-item outcomes and continues after failure', async () => {
    const source = {
      type: 's3',
      getObjectMetadata: vi.fn().mockResolvedValue({ contentType: 'text/plain' }),
      getObject: vi
        .fn()
        .mockResolvedValueOnce(new Blob(['ok']))
        .mockRejectedValueOnce(new Error('read fail')),
    } as unknown as StorageProvider;

    const destination = {
      type: 'gcs',
      uploadObject: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageProvider;

    const onItemComplete = vi.fn();
    const result = await transferObjects(
      source,
      destination,
      [
        { src: { bucket: 'b', key: 'a' }, dst: { bucket: 'b2', key: 'a' } },
        { src: { bucket: 'b', key: 'c' }, dst: { bucket: 'b2', key: 'c' } },
      ],
      { onItemComplete },
    );

    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(onItemComplete).toHaveBeenCalledTimes(2);
    expect(result.outcomes[1]?.error).toBe('read fail');
  });
});

