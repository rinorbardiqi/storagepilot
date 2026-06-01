import { ChevronUp, GitBranch, Globe, Server, Terminal } from 'lucide-react';
import { useBuckets } from '../../hooks/useBuckets';
import { useConnectionStore } from '../../store/connectionStore';
import { useActivityStore } from '../../store/activityStore';
import { useUploadStore } from '../../store/uploadStore';
import { useUiStore } from '../../store/uiStore';
import { apiVersionLabel, GIT_BRANCH } from '../../lib/buildInfo';
import { profileEndpoint } from '../../lib/providerAccent';

function statusHostLabel(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.host || 'localhost';
}

export function StatusBar() {
  const { buckets } = useBuckets();
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const status = activeProfileId ? connectionStatus[activeProfileId] : 'unconfigured';
  const connected = status === 'connected';

  const activityOpen = useUiStore((s) => s.activityDrawerOpen);
  const toggleActivity = useUiStore((s) => s.toggleActivityDrawer);
  const entries = useActivityStore((s) => s.entries);
  const uploadQueue = useUploadStore((s) => s.queue);

  const pendingActivities = entries.filter((e) => e.status === 'pending').length;
  const activeUploads = uploadQueue.filter((i) => i.status === 'uploading').length;
  const taskCount = pendingActivities + activeUploads;

  const endpoint = profile ? profileEndpoint(profile) : statusHostLabel();

  return (
    <footer
      className="flex items-center justify-between h-[var(--statusbar-height)] px-4 border-t border-[var(--border)] bg-[var(--bg-surface)] shrink-0"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <div className="flex items-center gap-3 text-[10px] leading-[15px] min-w-0">
        <span
          className="inline-flex items-center gap-1.5 text-[var(--text-muted)] shrink-0"
          title={`Build branch: ${GIT_BRANCH}`}
        >
          <GitBranch size={10} />
          <span className="truncate max-w-[72px]">{GIT_BRANCH}</span>
        </span>
        <span className="text-[var(--border)]">|</span>
        <span
          className="inline-flex items-center gap-1.5 text-[var(--text-muted)] shrink-0 max-w-[160px]"
          title={endpoint}
        >
          <Globe size={10} />
          <span className="truncate">{endpoint}</span>
        </span>
        <span className="text-[var(--border)]">|</span>
        <span className="text-[var(--text-muted)] truncate hidden md:inline">
          Provider: {profile?.name ?? '—'}
        </span>
        <span className="text-[var(--border)] hidden md:inline">|</span>
        <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)] shrink-0">
          <Server size={10} />
          {apiVersionLabel()}
          <span className={connected ? 'text-[var(--success)]' : 'text-[var(--warning)]'}>
            · {connected ? 'online' : status === 'checking' ? 'checking' : 'offline'}
          </span>
        </span>
      </div>

      <button
        type="button"
        className={`flex items-center gap-2 text-[10px] mx-2 shrink-0 px-2 py-1 rounded-[var(--radius)] transition-colors ${
          activityOpen
            ? 'text-[var(--accent)] bg-[var(--accent)]/10'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
        }`}
        onClick={toggleActivity}
        aria-expanded={activityOpen}
        title={activityOpen ? 'Collapse activity log' : 'Expand activity log — drag the top edge to resize'}
      >
        <Terminal size={10} />
        <span className="uppercase tracking-wider">Activity Log</span>
        {taskCount > 0 && (
          <span className="text-[var(--success)]">{taskCount} active</span>
        )}
        {!activityOpen && entries.length > 0 && taskCount === 0 && (
          <span className="text-[var(--text-muted)]">{entries.length} entries</span>
        )}
        {activityOpen ? null : <ChevronUp size={10} />}
      </button>

      <div className="flex items-center gap-4 text-[10px] leading-[15px] shrink-0">
        <span className="text-[var(--text-muted)]">
          Buckets: <span className="text-[var(--text-primary)]">{buckets.length}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${connected ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}`} />
          <span className="text-[var(--text-muted)] uppercase">
            {connected ? 'System Ready' : 'Awaiting Connection'}
          </span>
        </div>
      </div>
    </footer>
  );
}
