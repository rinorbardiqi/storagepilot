import { describe, expect, it } from 'vitest';
import type { ActivityEntry } from '../store/activityStore';
import { extractBucketFromEntry } from '../lib/activityBucket';

const base: Omit<ActivityEntry, 'method' | 'args'> = {
  id: '1',
  provider: 's3',
  timestamp: new Date(),
  status: 'success',
  duration: 10,
};

describe('extractBucketFromEntry', () => {
  it('extracts bucket from listObjects', () => {
    expect(
      extractBucketFromEntry({ ...base, method: 'listObjects', args: ['photos', { prefix: '' }] }),
    ).toBe('photos');
  });

  it('extracts bucket from uploadObject', () => {
    expect(
      extractBucketFromEntry({ ...base, method: 'uploadObject', args: ['photos', 'a.jpg'] }),
    ).toBe('photos');
  });

  it('returns null for listBuckets', () => {
    expect(extractBucketFromEntry({ ...base, method: 'listBuckets', args: [] })).toBeNull();
  });
});
