import { BookOpen, Copy, Github, Lightbulb } from 'lucide-react';
import { useConnectionStore } from '../../store/connectionStore';
import { useToast } from '../../hooks/useToast';
import type { ProviderType } from '../../api/types';

const COMMANDS: Record<ProviderType, string> = {
  gcs: 'docker run -d -p 3000:80 -e ENABLED_PROVIDERS=gcs -v storagepilot-data:/data rinorbardiqi/storagepilot:full',
  s3: 'docker run -d -p 3000:80 -p 9000:9000 -e ENABLED_PROVIDERS=s3 -v storagepilot-data:/data rinorbardiqi/storagepilot:full',
  azure: 'docker run -d -p 3000:80 -e ENABLED_PROVIDERS=azure -v storagepilot-data:/data rinorbardiqi/storagepilot:full',
};

const FIXES = [
  'Verify the emulator process is running on the configured port.',
  'Check that no other service is bound to the same port (8085, 9000, etc.).',
  'Confirm firewall rules allow localhost connections from the browser.',
];

export function TroubleshootingPanel() {
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const toast = useToast();

  const cmd = profile ? COMMANDS[profile.type] : COMMANDS.gcs;

  const copyCmd = () => {
    void navigator.clipboard.writeText(cmd);
    toast.success('Copied to clipboard');
  };

  return (
    <aside
      className="shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--bg-surface)]"
      style={{ width: 'var(--detail-panel-width)' }}
    >
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <Lightbulb size={12} className="text-[var(--accent)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">
          Troubleshooting
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Common Fixes
          </p>
          <ol className="flex flex-col gap-3 text-xs text-[var(--text-muted)] leading-relaxed list-decimal list-inside">
            {FIXES.map((fix, i) => (
              <li key={i}>{fix}</li>
            ))}
          </ol>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Terminal Command
          </p>
          <div className="flex items-center gap-2 p-3 bg-[var(--bg-base)] border border-[var(--border)]">
            <code className="flex-1 font-mono text-[11px] text-[var(--text-primary)] truncate">{cmd}</code>
            <button
              type="button"
              onClick={copyCmd}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
              aria-label="Copy command"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href="https://cloud.google.com/storage/docs/emulator"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-[var(--accent)] hover:underline"
          >
            <BookOpen size={12} />
            Emulator Documentation
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-[var(--accent)] hover:underline"
          >
            <Github size={12} />
            Report Connection Issue
          </a>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-muted)] text-center">
          Connect a cloud profile via Settings to use production storage.
        </p>
      </div>
    </aside>
  );
}
