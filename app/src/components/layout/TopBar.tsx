import { Github, Search, Settings } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/rinorbardiqi/storagepilot';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { useUiStore } from '../../store/uiStore';
import { CommandKShortcut } from '../shared/KbdChip';
import { StoragePilotLogo } from '../shared/StoragePilotLogo';

export function TopBar() {
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const connectionStatus = useConnectionStore((s) => s.connectionStatus);
  const openModal = useModalStore((s) => s.openModal);
  const appSection = useUiStore((s) => s.appSection);
  const status = activeProfileId ? connectionStatus[activeProfileId] : 'unconfigured';
  const connected = status === 'connected';
  const devMode = appSection === 'developer-tools';

  return (
    <header className="flex items-center h-[var(--topbar-height)] px-4 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
      <StoragePilotLogo />

      <div className="flex flex-1 justify-center min-w-0 px-4">
        <button
          type="button"
          className="relative flex items-center w-full max-w-[var(--search-width)] h-8 px-[37px] bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius)] text-left hover:border-[var(--accent)]/40 transition-colors"
          onClick={() => openModal('commandPalette')}
        >
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <span
            className="flex-1 text-xs text-[var(--text-muted)] truncate"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {devMode ? '>_ Search developer tools…' : 'Search objects, buckets, or commands…'}
          </span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CommandKShortcut />
          </span>
        </button>
      </div>

      <div className="flex items-center justify-end gap-4 w-[var(--header-zone-width)] shrink-0">
        {devMode && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">
            <span className="size-2 rounded-full bg-[var(--success)]" />
            Dev Mode
          </span>
        )}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="GitHub repository"
          title="View on GitHub"
        >
          <Github size={14} strokeWidth={1.75} />
        </a>
        <button
          type="button"
          className="p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          onClick={() =>
            openModal('connection', {
              profileId: activeProfileId ?? undefined,
              mode: 'edit',
            })
          }
          aria-label="Settings"
        >
          <Settings size={14} strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2 pl-2">
          <span
            className={`size-2 rounded-full shrink-0 ${connected ? 'bg-[var(--success)]' : status === 'checking' ? 'bg-[var(--warning)] animate-pulse' : 'bg-[var(--error)]'}`}
          />
          <span
            className="text-[10px] uppercase tracking-[1px] text-[var(--text-muted)] whitespace-nowrap"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {connected ? 'Connected' : status === 'checking' ? 'Checking' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
