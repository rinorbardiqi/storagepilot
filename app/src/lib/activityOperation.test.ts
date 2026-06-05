import { describe, expect, it } from 'vitest';
import { activityHttpVerb, matchesActivityFilter } from './activityOperation';
import type { ActivityEntry } from '../store/activityStore';

function entry(
  overrides: Partial<ActivityEntry> & Pick<ActivityEntry, 'method'>,
): ActivityEntry {
  return {
    id: '1',
    provider: 's3',
    args: [],
    timestamp: new Date(),
    status: 'success',
    duration: 10,
    ...overrides,
  };
}

describe('activityHttpVerb', () => {
  it('maps read operations to GET', () => {
    expect(activityHttpVerb(entry({ method: 'listObjects' }))).toBe('GET');
    expect(activityHttpVerb(entry({ method: 'getObject' }))).toBe('GET');
  });

  it('maps S3 writes to PUT', () => {
    expect(activityHttpVerb(entry({ method: 'uploadObject', provider: 's3' }))).toBe('PUT');
  });

  it('maps GCS uploads and copies to POST', () => {
    expect(activityHttpVerb(entry({ method: 'uploadObject', provider: 'gcs' }))).toBe('POST');
    expect(activityHttpVerb(entry({ method: 'copyObject', provider: 'gcs' }))).toBe('POST');
  });

  it('maps deletes to DELETE', () => {
    expect(activityHttpVerb(entry({ method: 'deleteObject' }))).toBe('DELETE');
  });
});

describe('matchesActivityFilter', () => {
  it('filters errors only', () => {
    const ok = entry({ method: 'getObject', status: 'success' });
    const bad = entry({ method: 'getObject', status: 'error' });
    expect(matchesActivityFilter(ok, 'errors')).toBe(false);
    expect(matchesActivityFilter(bad, 'errors')).toBe(true);
  });

  it('filters by HTTP verb', () => {
    const read = entry({ method: 'listBuckets' });
    const write = entry({ method: 'uploadObject', provider: 'azure' });
    expect(matchesActivityFilter(read, 'get')).toBe(true);
    expect(matchesActivityFilter(read, 'put')).toBe(false);
    expect(matchesActivityFilter(write, 'put')).toBe(true);
  });
});
