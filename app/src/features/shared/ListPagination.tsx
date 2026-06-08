import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ListPaginationProps {
  page: number;
  itemCount: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function ListPagination({
  page,
  itemCount,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  loading,
  onPrevious,
  onNext,
}: ListPaginationProps) {
  const rangeStart = itemCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = (page - 1) * pageSize + itemCount;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
      <p className="text-[10px] font-mono text-[var(--text-muted)]">
        {itemCount === 0
          ? `Page ${page} · no items`
          : `Page ${page} · showing ${rangeStart}–${rangeEnd}`}
        {hasNextPage ? '' : itemCount > 0 ? ' · end of list' : ''}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPreviousPage || loading}
          onClick={onPrevious}
          className="inline-flex items-center gap-1 h-7 px-2.5 border border-[var(--border)] rounded-[var(--radius)] text-[10px] font-semibold uppercase text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft size={12} />
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNextPage || loading}
          onClick={onNext}
          className="inline-flex items-center gap-1 h-7 px-2.5 border border-[var(--border)] rounded-[var(--radius)] text-[10px] font-semibold uppercase text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:pointer-events-none"
        >
          Next
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
