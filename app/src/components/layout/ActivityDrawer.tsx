import { useCallback, useEffect, useRef } from 'react';
import { ChevronDown, Download, GripHorizontal } from 'lucide-react';
import { formatActivityLine, formatActivityStatus, formatActivityTarget } from '../../lib/formatActivityLog';
import {
  ACTIVITY_FILTERS,
  activityFilterLabel,
  matchesActivityFilter,
} from '../../lib/activityOperation';
import { formatTime } from '../../lib/formatDate';
import { useActivityStore } from '../../store/activityStore';
import { useUploadStore } from '../../store/uploadStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../shared/Button';

export function ActivityDrawer() {
  const isOpen = useUiStore((s) => s.activityDrawerOpen);
  const height = useUiStore((s) => s.activityDrawerHeight);
  const setHeight = useUiStore((s) => s.setActivityDrawerHeight);
  const setOpen = useUiStore((s) => s.setActivityDrawerOpen);
  const filter = useUiStore((s) => s.activityFilter);
  const setFilter = useUiStore((s) => s.setActivityFilter);
  const search = useUiStore((s) => s.activitySearch);
  const setSearch = useUiStore((s) => s.setActivitySearch);
  const expandedId = useUiStore((s) => s.expandedActivityId);
  const setExpandedId = useUiStore((s) => s.setExpandedActivityId);
  const entries = useActivityStore((s) => s.entries);
  const clearLog = useActivityStore((s) => s.clearLog);
  const uploadQueue = useUploadStore((s) => s.queue);

  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const pendingApi = entries.filter((e) => e.status === 'pending').length;
  const activeUploads = uploadQueue.filter((i) => i.status === 'uploading').length;
  const activeCount = pendingApi + activeUploads;

  const filtered = entries.filter((e) => {
    if (!matchesActivityFilter(e, filter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const line = formatActivityLine(e).toLowerCase();
      return (
        line.includes(q) ||
        e.method.toLowerCase().includes(q) ||
        formatActivityTarget(e).toLowerCase().includes(q) ||
        (e.error?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const exportLog = () => {
    const lines = entries.map((e) => formatActivityLine(e));
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDragStart = useCallback(
    (clientY: number) => {
      dragRef.current = { startY: clientY, startH: height };
    },
    [height],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - e.clientY;
      setHeight(dragRef.current.startH + delta);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setHeight]);

  if (!isOpen) return null;

  return (
    <div
      className="shrink-0 flex flex-col border-t border-[var(--border)] bg-[var(--bg-surface)]"
      style={{ height }}
    >
      {/* Drag handle — pull up to expand */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize activity log"
        className="flex items-center justify-center h-2 cursor-ns-resize bg-[var(--bg-overlay)] border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] group shrink-0"
        onMouseDown={(e) => {
          e.preventDefault();
          onDragStart(e.clientY);
        }}
      >
        <GripHorizontal size={14} className="text-[var(--text-muted)] opacity-50 group-hover:opacity-100" />
      </div>

      <div className="flex items-center justify-between h-8 px-4 bg-[var(--bg-overlay)] border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Activity Log
          </span>
          {activeCount > 0 && (
            <span className="text-[9px] text-[var(--success)] whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)' }}>
              ● {activeCount} transfer{activeCount !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-mono)' }}
            onClick={clearLog}
          >
            Clear log
          </button>
          <Button onClick={exportLog} className="!px-1.5 !py-0.5" title="Export log">
            <Download size={10} />
          </Button>
          <button
            type="button"
            className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => setOpen(false)}
            aria-label="Collapse activity log"
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)] flex-wrap bg-[var(--bg-base)] shrink-0">
        {ACTIVITY_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`px-2.5 py-1 text-[10px] uppercase tracking-wide transition-colors ${
              filter === f
                ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
            onClick={() => setFilter(f)}
          >
            {activityFilterLabel(f)}
          </button>
        ))}
        <input
          type="search"
          placeholder="Filter by path, operation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] px-2 py-0.5 text-[10px] bg-[var(--bg-surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-[10px] text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {entries.length === 0
              ? 'No activity yet — browse buckets, open folders, or upload files to see operations here.'
              : 'No entries match the current filter.'}
          </p>
        ) : (
          filtered.map((entry) => {
            const status = formatActivityStatus(entry);
            const statusClass =
              status === 'OK'
                ? 'text-[var(--success)]'
                : status === 'ERR'
                  ? 'text-[var(--error)]'
                  : 'text-[var(--accent)]';
            const target = formatActivityTarget(entry);
            return (
              <div key={entry.id} className="mb-0.5">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full text-left hover:bg-[var(--bg-elevated)] px-2 py-1 rounded-[var(--radius)]"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <span className={`text-[10px] shrink-0 w-8 ${statusClass}`} style={{ fontFamily: 'var(--font-mono)' }}>
                    [{status}]
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-16" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatTime(new Date(entry.timestamp))}
                  </span>
                  <span className="text-[10px] text-[var(--text-primary)] shrink-0 uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                    {entry.method}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">→</span>
                  <span className="text-[10px] text-[var(--text-code)] truncate flex-1" style={{ fontFamily: 'var(--font-mono)' }} title={target}>
                    {target}
                  </span>
                  <span className={`text-[10px] shrink-0 ${entry.status === 'error' ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                    {entry.status === 'error' ? (entry.error ?? 'FAILED') : entry.duration > 0 ? `${Math.round(entry.duration)}ms` : '…'}
                  </span>
                </button>
                {expandedId === entry.id && (
                  <div className="mx-2 mb-2 px-3 py-2 bg-[var(--bg-base)] border border-[var(--border)] text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
                    <p className="text-[var(--text-muted)] mb-2 break-all">{formatActivityLine(entry)}</p>
                    {entry.args.length > 0 && (
                      <pre className="overflow-auto max-h-24 text-[var(--text-muted)] whitespace-pre-wrap">
                        {JSON.stringify(entry.args, null, 2)}
                      </pre>
                    )}
                    {entry.error && <p className="text-[var(--error)] mt-2 break-all">{entry.error}</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
