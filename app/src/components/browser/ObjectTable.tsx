import { Copy, Download, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatBytes } from '../../lib/formatBytes';
import { formatDate } from '../../lib/formatDate';
import { objectDisplayName } from '../../lib/objectKey';
import type { StorageObject } from '../../api/types';
import { useModalStore } from '../../store/modalStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useBrowserRows } from '../../hooks/useBrowserRows';
import { SortHeader } from './BrowserChrome';
import { Checkbox } from '../shared/Checkbox';
import { FileIcon } from '../shared/FileIcon';

interface ObjectTableProps {
  objects: StorageObject[];
  prefixes: string[];
  onNavigatePrefix: (prefix: string) => void;
  onOpenObject?: (object: StorageObject) => void;
  onDownload?: (key: string) => void;
  onDelete?: (key: string) => void;
}

function rowLabel(key: string, isFolder: boolean): string {
  if (!isFolder) return objectDisplayName(key);
  const name = key.endsWith('/')
    ? key.split('/').filter(Boolean).pop()
    : objectDisplayName(key);
  return `${name}/`;
}

export function ObjectTable({
  objects,
  prefixes,
  onNavigatePrefix,
  onOpenObject,
  onDownload,
  onDelete,
}: ObjectTableProps) {
  const selectedKeys = useSelectionStore((s) => s.selectedKeys);
  const toggle = useSelectionStore((s) => s.toggle);
  const selectAll = useSelectionStore((s) => s.selectAll);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const openModal = useModalStore((s) => s.openModal);

  const { rows, fileKeys, isEmpty, query } = useBrowserRows(objects, prefixes);

  const selectedCount = fileKeys.filter((k) => selectedKeys.has(k)).length;
  const allSelected = fileKeys.length > 0 && selectedCount === fileKeys.length;
  const someSelected = selectedCount > 0 && !allSelected;

  if (isEmpty) {
    return (
      <div className="p-8 text-center text-sm text-[var(--text-muted)]">
        {query ? `No objects matching "${query}"` : 'No objects in this prefix'}
      </div>
    );
  }

  return (
    <table className="w-full text-sm" role="table">
      <thead className="sticky top-0 z-[1] bg-[rgba(22,27,34,0.95)] backdrop-blur-[2px] border-b border-[var(--border)]">
        <tr className="text-left text-[10px] uppercase text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
          <th className="p-3 font-medium w-10 text-center">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => (allSelected || someSelected ? clearSelection() : selectAll(fileKeys))}
              aria-label="Select all objects"
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
          const { isFolder } = obj;
          const selected = !isFolder && selectedKeys.has(obj.key);
          const label = rowLabel(obj.key, isFolder);
          return (
            <tr
              key={obj.key}
              role="row"
              className={`border-b border-[var(--border)] hover:bg-[var(--accent)]/5 cursor-pointer ${
                selected ? 'bg-[var(--accent)]/5' : ''
              }`}
              onClick={() => {
                if (isFolder) onNavigatePrefix(obj.key);
                else onOpenObject?.(obj);
              }}
            >
              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected}
                  onChange={() => toggle(obj.key)}
                  aria-label={isFolder ? `Folder ${label}` : `Select ${label}`}
                  disabled={isFolder}
                />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileIcon object={obj} size={18} />
                  <span
                    className={`font-mono truncate max-w-md ${isFolder ? 'text-[var(--text-primary)] font-medium' : ''}`}
                    title={obj.key}
                  >
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
                      aria-label={`Download ${label}`}
                      title="Download"
                      onClick={() => onDownload?.(obj.key)}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"
                      aria-label={`Copy ${label}`}
                      title="Copy"
                      onClick={() =>
                        openModal('copyMove', {
                          operation: 'copy',
                          keys: [obj.key],
                          sizes: [obj.size],
                        })
                      }
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                      aria-label={`Delete ${label}`}
                      title="Delete"
                      onClick={() => onDelete?.(obj.key)}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      aria-label={`More options for ${label}`}
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
