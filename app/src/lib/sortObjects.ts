import type { StorageObject } from '../api/types';

export type SortField = 'name' | 'size' | 'lastModified' | 'contentType';
export type SortDir = 'asc' | 'desc';

function displayName(key: string): string {
  return key.replace(/\/$/, '').split('/').pop() ?? key;
}

function modifiedTime(obj: StorageObject): number {
  const d = obj.lastModified;
  if (d instanceof Date) return d.getTime();
  return new Date(d).getTime();
}

export function sortObjects(
  objects: StorageObject[],
  field: SortField,
  dir: SortDir,
): StorageObject[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...objects].sort((a, b) => {
    switch (field) {
      case 'name':
        return mul * displayName(a.key).localeCompare(displayName(b.key), undefined, { sensitivity: 'base' });
      case 'size':
        return mul * (a.size - b.size);
      case 'contentType':
        return mul * (a.contentType || '').localeCompare(b.contentType || '', undefined, { sensitivity: 'base' });
      case 'lastModified':
        return mul * (modifiedTime(a) - modifiedTime(b));
      default:
        return 0;
    }
  });
}

export function sortPrefixes(prefixes: string[], dir: SortDir): string[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...prefixes].sort((a, b) => mul * a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function matchesBrowserSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return text.toLowerCase().includes(query.trim().toLowerCase());
}
