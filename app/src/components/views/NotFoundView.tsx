import { Home, Search } from 'lucide-react';
import { providerScheme } from '../../lib/providerDisplay';
import { useAppStore } from '../../store/appStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../shared/Button';

export function NotFoundView() {
  const notFoundMessage = useUiStore((s) => s.notFoundMessage);
  const setNotFound = useUiStore((s) => s.setNotFound);
  const setCurrentBucket = useAppStore((s) => s.setCurrentBucket);
  const setCurrentPrefix = useAppStore((s) => s.setCurrentPrefix);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const currentPrefix = useAppStore((s) => s.currentPrefix);
  const activeProfileId = useConnectionStore((s) => s.activeProfileId);
  const profiles = useConnectionStore((s) => s.profiles);
  const profile = profiles.find((p) => p.id === activeProfileId);
  const scheme = profile ? providerScheme(profile.type) : 's3';

  const path = currentBucket
    ? `${scheme}://${currentBucket}/${currentPrefix}`
    : `${scheme}://`;

  const goHome = () => {
    setNotFound(false);
    setCurrentPrefix('');
    setCurrentBucket(null);
  };

  const newSearch = () => {
    setNotFound(false);
    setCurrentPrefix('');
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 gap-6 bg-[var(--bg-base)]">
      <div className="relative select-none" aria-hidden>
        <span
          className="text-[120px] font-bold leading-none text-[var(--bg-elevated)]"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          4
        </span>
        <span className="relative inline-flex items-center justify-center size-[100px] -mx-2 align-middle">
          <span className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--error)]/40" />
          <span className="text-4xl font-bold text-[var(--error)]">?</span>
        </span>
        <span
          className="text-[120px] font-bold leading-none text-[var(--bg-elevated)]"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          4
        </span>
      </div>

      <div className="text-center max-w-lg">
        <h2 className="text-2xl font-semibold mb-3 text-[var(--text-primary)]">Resource Not Found</h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {notFoundMessage ?? (
            <>
              The bucket or object path{' '}
              <code className="font-mono text-[var(--text-primary)] text-xs">{path}</code> does not exist
              in the local emulator environment.
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="accent" className="gap-2" onClick={goHome}>
          <Home size={14} />
          Return Home
        </Button>
        <Button variant="outline" className="gap-2" onClick={newSearch}>
          <Search size={14} />
          New Search
        </Button>
      </div>

      <div className="w-full max-w-md mt-8">
        <p
          className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {'>_'} Debug Trace
        </p>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)]">
          <pre className="font-mono text-[11px] text-[var(--error)] leading-relaxed whitespace-pre-wrap">
            {`Error: NotFound (404)\nProvider: ${profile?.name ?? 'unknown'}\nPath: ${path}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
