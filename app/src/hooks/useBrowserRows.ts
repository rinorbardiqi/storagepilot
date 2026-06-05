import { useMemo } from 'react';
import { matchesBrowserSearch, sortObjects, sortPrefixes } from '../lib/sortObjects';
import { objectDisplayName } from '../lib/objectKey';
import type { StorageObject } from '../api/types';
import { useAppStore } from '../store/appStore';

/** Sentinel date used for folder stubs — avoids `new Date()` on every render. */
const FOLDER_DATE = new Date(0);

export type BrowserRow = StorageObject & { isFolder: boolean };

/**
 * Shared filtering + sorting + row-building logic for ObjectTable and ObjectGrid.
 * Memoized so it only recomputes when inputs actually change.
 */
export function useBrowserRows(
  objects: StorageObject[],
  prefixes: string[],
): {
  rows: BrowserRow[];
  fileKeys: string[];
  isEmpty: boolean;
  query: string;
} {
  const browserSearchQuery = useAppStore((s) => s.browserSearchQuery);
  const sortField = useAppStore((s) => s.sortField);
  const sortDir = useAppStore((s) => s.sortDir);

  const q = browserSearchQuery.trim().toLowerCase();

  const rows = useMemo(() => {
    const filtered = sortObjects(
      objects.filter(
        (o) =>
          matchesBrowserSearch(o.key, q) ||
          matchesBrowserSearch(objectDisplayName(o.key), q) ||
          matchesBrowserSearch(o.contentType, q),
      ),
      sortField,
      sortDir,
    );

    const filteredPrefixes = sortPrefixes(
      prefixes.filter(
        (p) => matchesBrowserSearch(p, q) || matchesBrowserSearch(objectDisplayName(p), q),
      ),
      sortDir,
    );

    const folderRows: BrowserRow[] = filteredPrefixes.map((p) => ({
      key: p,
      size: 0,
      contentType: '',
      lastModified: FOLDER_DATE,
      isFolder: true,
    }));

    const objectRows: BrowserRow[] = filtered.map((o) => ({
      ...o,
      isFolder: o.isFolder || o.key.endsWith('/'),
    }));

    return [...folderRows, ...objectRows];
  }, [objects, prefixes, q, sortField, sortDir]);

  const fileKeys = useMemo(
    () => rows.filter((r) => !r.isFolder).map((r) => r.key),
    [rows],
  );

  return {
    rows,
    fileKeys,
    isEmpty: rows.length === 0,
    query: browserSearchQuery,
  };
}
