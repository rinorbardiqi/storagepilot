interface RadioCardProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function RadioCard({ title, description, selected, onSelect }: RadioCardProps) {
  return (
    <button
      type="button"
      className={`w-full text-left p-4 border transition-colors ${
        selected
          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
          : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        <span
          className={`size-4 rounded-full border shrink-0 flex items-center justify-center ${
            selected ? 'border-[var(--accent)]' : 'border-[var(--border)]'
          }`}
        >
          {selected && <span className="size-2 rounded-full bg-[var(--accent)]" />}
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
    </button>
  );
}
