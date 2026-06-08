import { ChevronDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { providerScheme } from '../../lib/providerDisplay';
import { useConnectionStore } from '../../store/connectionStore';
import { useTransferStore } from '../../store/transferStore';
import { useUploadStore } from '../../store/uploadStore';
import { useUiStore } from '../../store/uiStore';

export function TaskRunningWidget() {
  const queue = useUploadStore((s) => s.queue);
  const activeUpload = queue.find((i) => i.status === 'uploading');
  const activeJob = useTransferStore((s) =>
    s.jobs.find((j) => j.status === 'queued' || j.status === 'running'),
  );
  const activeJobCount = useTransferStore(
    (s) => s.jobs.filter((j) => j.status === 'queued' || j.status === 'running').length,
  );
  const openTransferCenter = useUiStore((s) => s.openTransferCenter);
  const profile = useConnectionStore((s) =>
    s.profiles.find((p) => p.id === s.activeProfileId),
  );
  const [collapsed, setCollapsed] = useState(false);

  if (!activeUpload && !activeJob) return null;

  const taskCount = (activeUpload ? 1 : 0) + activeJobCount;
  const scheme = profile ? providerScheme(profile.type) : 's3';

  let title = '';
  let subtitle = '';
  let progress = 0;

  if (activeUpload) {
    title = `Uploading ${activeUpload.file.name}`;
    subtitle = `${scheme}://${activeUpload.bucket}/${activeUpload.key}`;
    progress = activeUpload.progress || 15;
  } else if (activeJob) {
    title = activeJob.label;
    subtitle = `${activeJob.kind} · ${activeJob.progress.completed}/${activeJob.progress.total}`;
    progress =
      activeJob.progress.total > 0
        ? Math.round((activeJob.progress.completed / activeJob.progress.total) * 100)
        : 15;
  }

  return (
    <div className="fixed bottom-12 right-4 z-40 w-72 border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] text-left hover:bg-[var(--bg-elevated)]"
        onClick={() => setCollapsed((c) => !c)}
      >
        <RefreshCw size={12} className="text-[var(--accent)] animate-spin" />
        <span className="text-[10px] font-semibold uppercase tracking-wider flex-1">
          {taskCount} Task{taskCount !== 1 ? 's' : ''} Running
        </span>
        <ChevronDown size={12} className={`text-[var(--text-muted)] transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>
      {!collapsed && (
        <div className="p-3 flex flex-col gap-2">
          <p className="text-xs font-medium truncate">{title}</p>
          <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">{subtitle}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">{progress}%</span>
          </div>
          <button
            type="button"
            className="text-[9px] uppercase tracking-wider text-[var(--accent)] hover:underline text-left"
            onClick={openTransferCenter}
          >
            Open Transfer Center
          </button>
        </div>
      )}
    </div>
  );
}
