import { ChevronDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useUploadStore } from '../../store/uploadStore';

export function TaskRunningWidget() {
  const queue = useUploadStore((s) => s.queue);
  const active = queue.find((i) => i.status === 'uploading');
  const [collapsed, setCollapsed] = useState(false);

  if (!active) return null;

  const filename = active.file.name;
  const dest = `gs://${active.bucket}/${active.key}`;

  return (
    <div className="fixed bottom-12 right-4 z-40 w-72 border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] text-left hover:bg-[var(--bg-elevated)]"
        onClick={() => setCollapsed((c) => !c)}
      >
        <RefreshCw size={12} className="text-[var(--accent)] animate-spin" />
        <span className="text-[10px] font-semibold uppercase tracking-wider flex-1">
          1 Task Running
        </span>
        <ChevronDown size={12} className={`text-[var(--text-muted)] transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>
      {!collapsed && (
        <div className="p-3 flex flex-col gap-2">
          <p className="text-xs font-medium truncate">Uploading {filename}</p>
          <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">to {dest}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all"
                style={{ width: `${active.progress || 15}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{active.progress || 0}%</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
            <span>1.1 MB/s</span>
            <span>ETA: 12s</span>
          </div>
        </div>
      )}
    </div>
  );
}
