import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/appStore';
import { useBuckets } from '../../hooks/useBuckets';
import { useModalStore } from '../../store/modalStore';

export function CommandPalette() {
  const isOpen = useModalStore((s) => Boolean(s.active.commandPalette));
  const closeModal = useModalStore((s) => s.closeModal);
  const openModal = useModalStore((s) => s.openModal);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setCurrentBucket = useAppStore((s) => s.setCurrentBucket);
  const currentBucket = useAppStore((s) => s.currentBucket);
  const { buckets } = useBuckets();
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    const actions = [
      { group: 'Actions', label: 'Upload files', action: () => openModal('upload') },
      { group: 'Actions', label: 'New bucket', action: () => openModal('newBucket') },
      { group: 'Actions', label: 'Developer tools hub', action: () => openModal('devTools') },
      { group: 'Actions', label: 'Performance metrics', action: () => openModal('performanceMetrics') },
      { group: 'Actions', label: 'Bucket stats', action: () => currentBucket && openModal('stats', { bucket: currentBucket }) },
      {
        group: 'Actions',
        label: 'CORS editor',
        action: () =>
          openModal('cors', {
            bucket: currentBucket ?? buckets[0]?.name,
          }),
      },
      { group: 'Actions', label: 'Fake data generator', action: () => openModal('fakeData', currentBucket ? { bucket: currentBucket } : {}) },
      { group: 'Actions', label: 'Export / import', action: () => openModal('exportImport') },
      { group: 'Actions', label: 'Connection settings', action: () => openModal('connection') },
      { group: 'Actions', label: 'Keyboard shortcuts', action: () => openModal('shortcuts') },
      { group: 'Search', label: 'Filter objects in browser', action: () => setSearchQuery(q) },
    ];
    const bucketItems = buckets
      .filter((b) => !q || b.name.toLowerCase().includes(q))
      .map((b) => ({
        group: 'Buckets',
        label: b.name,
        action: () => setCurrentBucket(b.name),
      }));
    return [...actions.filter((a) => !q || a.label.toLowerCase().includes(q)), ...bucketItems];
  }, [query, buckets, openModal, setCurrentBucket, setSearchQuery, currentBucket]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setIdx(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') setIdx((i) => Math.min(i + 1, results.length - 1));
      if (e.key === 'ArrowUp') setIdx((i) => Math.max(i - 1, 0));
      if (e.key === 'Enter' && results[idx]) {
        results[idx].action();
        closeModal('commandPalette');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, results, idx, closeModal]);

  if (!isOpen) return null;

  const groups = [...new Set(results.map((r) => r.group))];

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-black/50"
      onClick={() => closeModal('commandPalette')}
    >
      <div
        className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          className="w-full px-4 py-3 text-sm bg-transparent border-b border-[var(--border)] outline-none"
          placeholder="Search buckets, actions…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIdx(0);
          }}
        />
        <div className="max-h-80 overflow-y-auto py-2">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-4 py-1 text-xs text-[var(--text-muted)] uppercase">{group}</p>
              {results
                .map((r, i) => ({ ...r, i }))
                .filter((r) => r.group === group)
                .map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm ${
                      r.i === idx ? 'bg-[var(--bg-elevated)]' : 'hover:bg-[var(--bg-elevated)]'
                    }`}
                    onClick={() => {
                      r.action();
                      closeModal('commandPalette');
                    }}
                  >
                    {r.label}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
