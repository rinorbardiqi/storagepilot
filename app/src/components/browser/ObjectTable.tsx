import { Copy, Download, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatBytes } from '../../lib/formatBytes';
import { formatDate } from '../../lib/formatDate';
import { matchesBrowserSearch, sortObjects, sortPrefixes } from '../../lib/sortObjects';
import type { StorageObject } from '../../api/types';
import { useAppStore } from '../../store/appStore';
import { useModalStore } from '../../store/modalStore';
import { useSelectionStore } from '../../store/selectionStore';
import { SortHeader } from './BrowserChrome';
import { FileIcon } from '../shared/FileIcon';

interface ObjectTableProps {
  objects: StorageObject[];
  prefixes: string[];
  onNavigatePrefix: (prefix: string) => void;
  onOpenObject?: (object: StorageObject) => void;
  onDownload?: (key: string) => void;
  onDelete?: (key: string) => void;
}

type TableRow = StorageObject & { isFolder?: boolean };

function objectDisplayName(key: string): string {
  return key.replace(/\/$/, '').split('/').pop() ?? key;
}

export function ObjectTable({
  objects,
  prefixes,
  onNavigatePrefix,
  onOpenObject,
  onDownload,
  onDelete,
}: ObjectTableProps) {
  const browserSearchQuery = useAppStore((s) => s.browserSearchQuery);
  const sortField = useAppStore((s) => s.sortField);
  const sortDir = useAppStore((s) => s.sortDir);
  const selectedKeys = useSelectionStore((s) => s.selectedKeys);
  const toggle = useSelectionStore((s) => s.toggle);
  const selectAll = useSelectionStore((s) => s.selectAll);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const openModal = useModalStore((s) => s.openModal);

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

  const fileKeys = filtered.map((o) => o.key);
  const allSelected = fileKeys.length > 0 && fileKeys.every((k) => selectedKeys.has(k));

  const rows: TableRow[] = [
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
    <table className="w-full text-sm" role="table">
      <thead className="sticky top-0 z-[1] bg-[rgba(22,27,34,0.95)] backdrop-blur-[2px] border-b border-[var(--border)]">
        <tr className="text-left text-[10px] uppercase text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
          <th className="p-3 font-medium w-10 text-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => (allSelected ? clearSelection() : selectAll(fileKeys))}
              aria-label="Select all objects"
              className="size-[13px] rounded-[2.5px]"
            />
          </th>
          <th className="p-3 font-medium">
            <SortHeader label="Name" field="name" />
          </th>
          <th className="p-3 font-medium w-24">
            <SortHeader label="Size" field="size" />
          </th>
          <th className="p-3 font-medium w-32 text-center">
            <SortHeader label="Type" field="contentType" align="center" />
          </th>
          <th className="p-3 font-medium w-48">
            <SortHeader label="Last Modified" field="lastModified" />
          </th>
          <th className="p-3 font-medium w-24 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((obj) => {
          const isFolder = obj.isFolder || obj.key.endsWith('/');
          const selected = !isFolder && selectedKeys.has(obj.key);
          const label = objectDisplayName(obj.key);
          return (
            <tr
              key={obj.key}
              role="row"
              className={`border-b border-[var(--border)] hover:bg-[var(--accent)]/5 cursor-pointer ${
                selected ? 'bg-[var(--accent)]/10' : ''
              }`}
              onClick={() => {
                if (isFolder) onNavigatePrefix(obj.key);
                else onOpenObject?.(obj);
              }}
            >
              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                {!isFolder && (
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(obj.key)}
                    aria-label={`Select ${label}`}
                    className="size-[13px] rounded-[2.5px]"
                  />
                )}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon object={obj} />
                  <span className="font-mono truncate max-w-md" title={obj.key}>
                    {label}
                  </span>
                </div>
              </td>
              <td className="p-3 font-mono text-[var(--text-muted)]">
                {isFolder ? '—' : formatBytes(obj.size)}
              </td>
              <td className="p-3 text-[var(--text-muted)] truncate text-center">
                {obj.contentType || '—'}
              </td>
              <td className="p-3 font-mono text-[var(--text-muted)]">
                {isFolder ? '—' : formatDate(obj.lastModified)}
              </td>
              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                {!isFolder && (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"
                      title="Download"
                      onClick={() => onDownload?.(obj.key)}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"
                      title="Copy"
                      onClick={() => openModal('copyMove', { operation: 'copy', keys: [obj.key] })}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                      title="Delete"
                      onClick={() => onDelete?.(obj.key)}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      title="More"
                      onClick={() => onOpenObject?.(obj)}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
