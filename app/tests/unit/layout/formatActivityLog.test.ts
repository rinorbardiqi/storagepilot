import { describe, expect, it } from 'vitest';
import { formatActivityTarget } from '@/lib/formatActivityLog';
import type { ActivityEntry } from '@/store/activityStore';

function entry(overrides: Partial<ActivityEntry> & Pick<ActivityEntry, 'method' | 'args'>): ActivityEntry {
  return {
    id: '1',
    provider: 'gcs',
    timestamp: new Date(),
    status: 'success',
    duration: 12,
    ...overrides,
  };
}

describe('formatActivityTarget', () => {
  it('includes folder prefix for listObjects', () => {
    expect(
      formatActivityTarget(
        entry({ method: 'listObjects', args: ['testing', { prefix: 'static/images/' }] }),
      ),
    ).toBe('gs://testing/static/images');
  });

  it('includes full key path for uploadObject', () => {
    expect(
      formatActivityTarget(
        entry({
          method: 'uploadObject',
          args: ['testing', 'static/photo.png', { name: 'photo.png', size: 1, type: 'image/png' }],
        }),
      ),
    ).toBe('gs://testing/static/photo.png');
  });
});
