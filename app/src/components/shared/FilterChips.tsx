import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export function FilterChips() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const filterContentType = useAppStore((s) => s.filterContentType);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setFilterContentType = useAppStore((s) => s.setFilterContentType);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const chips: Array<{ label: string; onRemove: () => void }> = [];
  if (searchQuery.trim()) {
    chips.push({ label: `Search: "${searchQuery}"`, onRemove: () => setSearchQuery('') });
  }
  if (filterContentType) {
    chips.push({
      label: `Type: ${filterContentType}`,
      onRemove: () => setFilterContentType(null),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-surface)]">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-[var(--border)] rounded-[var(--radius)] bg-[var(--bg-elevated)]"
        >
          {chip.label}
          <button type="button" onClick={chip.onRemove} className="text-[var(--text-muted)]">
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        onClick={resetFilters}
      >
        Clear all
      </button>
    </div>
  );
}
