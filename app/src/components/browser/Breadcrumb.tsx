import { ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { ProviderChip } from '../shared/ProviderChip';

export function Breadcrumb() {
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const setCurrentPrefix = useAppStore((s) => s.setCurrentPrefix);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);

  const segments = currentPrefix.split('/').filter(Boolean);

  return (
    <nav
      data-testid="breadcrumb"
      className="flex items-center gap-1 px-6 py-3 text-sm border-b border-[var(--border)] bg-[var(--bg-base)] overflow-x-auto"
    >
      {profile && (
        <>
          <span className="font-mono text-xs text-[var(--accent)]">
            {profile.type === 'gcs' ? 'gs' : profile.type === 's3' ? 's3' : 'azure'}://
          </span>
          <ProviderChip type={profile.type} />
        </>
      )}
      {currentBucket && (
        <>
          <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
          <button
            className="font-mono hover:text-[var(--text-primary)] text-[var(--text-muted)]"
            onClick={() => setCurrentPrefix('')}
          >
            {currentBucket}
          </button>
        </>
      )}
      {segments.map((seg, i) => {
        const path = `${segments.slice(0, i + 1).join('/')}/`;
        return (
          <span key={path} className="flex items-center gap-1 shrink-0">
            <ChevronRight size={14} className="text-[var(--text-muted)]" />
            <button
              className="font-mono hover:text-[var(--text-primary)] text-[var(--text-muted)]"
              onClick={() => setCurrentPrefix(path)}
            >
              {seg}/
            </button>
          </span>
        );
      })}
    </nav>
  );
}
