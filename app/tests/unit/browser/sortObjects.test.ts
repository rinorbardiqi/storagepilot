import { describe, expect, it } from 'vitest';
import { sortObjects, sortPrefixes, matchesBrowserSearch } from '@/lib/sortObjects';
import type { StorageObject } from '@/api/types';

function obj(key: string, overrides: Partial<Omit<StorageObject, 'key'>> = {}): StorageObject {
  return {
    key,
    size: 100,
    contentType: 'text/plain',
    lastModified: new Date('2024-01-01'),
    isFolder: false,
    ...overrides,
  };
}

describe('sortObjects', () => {
  it('sorts by name ascending', () => {
    const list = [obj('b.txt'), obj('a.txt'), obj('c.txt')];
    expect(sortObjects(list, 'name', 'asc').map((o) => o.key)).toEqual(['a.txt', 'b.txt', 'c.txt']);
  });

  it('sorts by size descending', () => {
    const list = [obj('a', { size: 10 }), obj('b', { size: 30 }), obj('c', { size: 20 })];
    expect(sortObjects(list, 'size', 'desc').map((o) => o.key)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by lastModified', () => {
    const list = [
      obj('a', { lastModified: new Date('2024-03-01') }),
      obj('b', { lastModified: new Date('2024-01-01') }),
    ];
    expect(sortObjects(list, 'lastModified', 'asc').map((o) => o.key)).toEqual(['b', 'a']);
  });
});

describe('sortPrefixes', () => {
  it('sorts folder prefixes', () => {
    expect(sortPrefixes(['z/', 'a/', 'm/'], 'asc')).toEqual(['a/', 'm/', 'z/']);
  });
});

describe('matchesBrowserSearch', () => {
  it('matches case-insensitively', () => {
    expect(matchesBrowserSearch('Screenshot.PNG', 'screenshot')).toBe(true);
    expect(matchesBrowserSearch('other.txt', 'screenshot')).toBe(false);
  });

  it('matches empty query', () => {
    expect(matchesBrowserSearch('anything', '')).toBe(true);
  });
});
