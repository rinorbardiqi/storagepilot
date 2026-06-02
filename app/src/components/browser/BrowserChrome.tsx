import { ChevronDown, ChevronLeft, Download, FolderPlus, LayoutGrid, List, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react';
import { providerScheme } from '../../lib/providerDisplay';
import { useGoBack } from '../../hooks/useGoBack';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useSelectionStore } from '../../store/selectionStore';

interface BrowserChromeProps {
  onRefresh: () => void;
  loading?: boolean;
  onDeleteSelected?: (keys: string[]) => void;
  onDownloadSelected?: (keys: string[]) => void;
}

export function BrowserChrome({
  onRefresh,
  loading,
  onDeleteSelected,
  onDownloadSelected,
}: BrowserChromeProps) {
  const openModal = useModalStore((s) => s.openModal);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const setCurrentPrefix = useAppStore((s) => s.setCurrentPrefix);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const browserSearchQuery = useAppStore((s) => s.browserSearchQuery);
  const setBrowserSearchQuery = useAppStore((s) => s.setBrowserSearchQuery);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const selectedKeys = useSelectionStore((s) => s.selectedKeys);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const { goBack, canGoBack, backLabel } = useGoBack();

  const scheme = profile ? providerScheme(profile.type) : 's3';
  const segments = currentPrefix.split('/').filter(Boolean);
  const selected = [...selectedKeys];

  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between h-[var(--browser-chrome-height)] px-4">
        <nav className="flex items-center gap-2 min-w-0 overflow-x-auto" aria-label="Breadcrumb">
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center size-7 shrink-0 border border-[var(--border)] rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label={backLabel}
              title={backLabel}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {profile && (
            <>
              <span
                className="text-xs font-medium text-[var(--accent-gcs)] whitespace-nowrap"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {scheme}://
              </span>
              {currentBucket && (
                <button
                  type="button"
                  className="text-xs text-[var(--text-primary)] hover:underline whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  onClick={() => setCurrentPrefix('')}
                >
                  {currentBucket}
                </button>
              )}
            </>
          )}
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const path = `${segments.slice(0, i + 1).join('/')}/`;
            return (
              <span key={path} className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                  /
                </span>
                {isLast ? (
                  <span
                    className="text-xs font-medium text-[var(--accent)] whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {seg}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-[var(--text-primary)] hover:underline whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    onClick={() => setCurrentPrefix(path)}
                  >
                    {seg}
                  </button>
                )}
              </span>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-2 h-7 px-3 bg-[var(--accent)] text-black rounded-[var(--radius)] hover:opacity-90"
            onClick={() => openModal('upload')}
          >
            <Upload size={10} strokeWidth={2.5} />
            <span className="text-[10px] font-semibold uppercase leading-[15px]">Upload</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 h-7 px-[13px] border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius)] hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            disabled={!currentBucket}
            onClick={() =>
              currentBucket &&
              openModal('newFolder', { bucket: currentBucket, prefix: currentPrefix })
            }
          >
            <FolderPlus size={10} />
            <span className="text-[10px] font-semibold uppercase leading-[15px]">New Folder</span>
          </button>
          <div className="h-4 w-px bg-[var(--border)] mx-1" aria-hidden />
          <button
            type="button"
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            className={`p-1.5 ${viewMode === 'table' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setViewMode('table')}
            aria-label="Table view"
          >
            <List size={12} />
          </button>
          <button
            type="button"
            className={`p-1.5 ${viewMode === 'grid' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-base)]">
        <div className="flex-1 flex items-center gap-2 h-8 px-3 border border-[var(--border)] bg-[var(--bg-surface)] min-w-0">
          <Search size={12} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="search"
            value={browserSearchQuery}
            onChange={(e) => setBrowserSearchQuery(e.target.value)}
            placeholder="Search objects in this folder…"
            className="flex-1 min-w-0 bg-transparent text-xs font-mono text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          {browserSearchQuery && (
            <button
              type="button"
              onClick={() => setBrowserSearchQuery('')}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {selected.length} selected
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius)] hover:bg-[var(--bg-elevated)] text-[10px] font-semibold uppercase"
              onClick={() => onDownloadSelected?.(selected)}
            >
              <Download size={10} />
              Download
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 border border-[rgba(248,81,73,0.4)] text-[var(--error)] rounded-[var(--radius)] hover:bg-[var(--error)]/10 text-[10px] font-semibold uppercase"
              onClick={() => onDeleteSelected?.(selected)}
            >
              <Trash2 size={10} />
              Delete
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 border border-[var(--border)] text-[var(--text-muted)] rounded-[var(--radius)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-[10px] font-semibold uppercase"
              onClick={() => clearSelection()}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SortHeader({
  label,
  field,
  align = 'left',
}: {
  label: string;
  field: 'name' | 'size' | 'lastModified' | 'contentType';
  align?: 'left' | 'center' | 'right';
}) {
  const sortField = useAppStore((s) => s.sortField);
  const sortDir = useAppStore((s) => s.sortDir);
  const toggleSort = useAppStore((s) => s.toggleSort);
  const active = sortField === field;

  return (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className={`inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors ${
        align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''
      } ${active ? 'text-[var(--accent)]' : ''}`}
    >
      {label}
      {active && (
        <ChevronDown
          size={10}
          className={`shrink-0 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  );
}
