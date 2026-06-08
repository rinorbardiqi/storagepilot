import { FileDown, Settings2, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { usePreferencesStore } from '../../store/preferencesStore';

interface SearchScopePanelProps {
  listed: number;
  matches: number;
  loading: boolean;
  onClose?: () => void;
}

function formatAgo(at: number): string {
  const mins = Math.floor((Date.now() - at) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SearchScopePanel({ listed, matches, loading, onClose }: SearchScopePanelProps) {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const recentSearches = usePreferencesStore((s) => s.recentSearches);

  const bucketHistory = recentSearches.filter(
    (r) => !currentBucket || r.bucket === currentBucket,
  );

  return (
    <aside
      className="shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--bg-surface)]"
      style={{ width: 'var(--detail-panel-width)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Search Scope
        </span>
        <div className="flex items-center gap-2">
          <Settings2 size={12} className="text-[var(--text-muted)]" />
          {onClose && (
            <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Current Folder
          </p>
          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Listed</span>
              <span>{loading ? '…' : listed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Matches</span>
              <span className="text-[var(--accent)]">{loading ? '…' : matches.toLocaleString()}</span>
            </div>
            {currentBucket && (
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Bucket</span>
                <span className="truncate ml-2 text-right">{currentBucket}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-3 leading-relaxed">
            Search filters objects in the current folder only. Navigate into subfolders to search deeper.
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Recent Queries
          </p>
          {bucketHistory.length === 0 && !searchQuery && (
            <p className="text-xs text-[var(--text-muted)]">No recent searches yet.</p>
          )}
          <div className="flex flex-col gap-2">
            {bucketHistory.slice(0, 5).map((r) => (
              <div key={`${r.bucket}-${r.query}-${r.at}`} className="p-2 border border-[var(--border)] bg-[var(--bg-base)]">
                <p className="font-mono text-[11px] text-[var(--text-primary)] truncate">{r.query}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  {r.bucket} · {formatAgo(r.at)}
                </p>
              </div>
            ))}
            {searchQuery && (
              <div className="p-2 border border-[var(--accent)]/30 bg-[var(--accent)]/5">
                <p className="font-mono text-[11px] text-[var(--accent)] truncate">{searchQuery}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Current query</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled
          title="Export not yet implemented"
          className="w-full h-9 border border-[var(--border)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FileDown size={12} />
          Export Search Results
        </button>
      </div>
    </aside>
  );
}
