import { formatBytes } from '../../lib/formatBytes';
import { matchesBrowserSearch, sortObjects, sortPrefixes } from '../../lib/sortObjects';
import type { StorageObject } from '../../api/types';
import { useAppStore } from '../../store/appStore';
import { useUiStore } from '../../store/uiStore';
import { FileIcon } from '../shared/FileIcon';

interface ObjectGridProps {
  objects: StorageObject[];
  prefixes: string[];
  onNavigatePrefix: (prefix: string) => void;
}

function objectDisplayName(key: string): string {
  return key.replace(/\/$/, '').split('/').pop() ?? key;
}

export function ObjectGrid({ objects, prefixes, onNavigatePrefix }: ObjectGridProps) {
  const openDetail = useUiStore((s) => s.openDetail);
  const browserSearchQuery = useAppStore((s) => s.browserSearchQuery);
  const sortField = useAppStore((s) => s.sortField);
  const sortDir = useAppStore((s) => s.sortDir);

  const q = browserSearchQuery.trim().toLowerCase();

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

  const rows = [
    ...filteredPrefixes.map((p) => ({
      key: p,
      size: 0,
      contentType: '',
      lastModified: new Date(),
      isFolder: true,
    })),
    ...filtered,
  ];

  if (!rows.length) {
    return (
      <div className="p-8 text-center text-sm text-[var(--text-muted)]">
        {q ? `No objects matching "${browserSearchQuery}"` : 'No objects in this prefix'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {rows.map((obj) => {
        const isFolder = obj.isFolder || obj.key.endsWith('/');
        return (
          <button
            key={obj.key}
            type="button"
            className="flex flex-col items-center gap-2 p-4 border border-[var(--border)] rounded-[var(--radius)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-left"
            onClick={() => (isFolder ? onNavigatePrefix(obj.key) : openDetail(obj))}
          >
            <FileIcon object={obj} />
            <span className="font-mono text-xs truncate w-full text-center" title={obj.key}>
              {objectDisplayName(obj.key)}
            </span>
            {!isFolder && (
              <span className="text-xs text-[var(--text-muted)]">{formatBytes(obj.size)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
