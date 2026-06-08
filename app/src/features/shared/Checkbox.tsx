import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  'aria-label': string;
  className?: string;
  disabled?: boolean;
}

/** MinIO-style square checkbox with clear checked / indeterminate states. */
export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  'aria-label': ariaLabel,
  className = '',
  disabled = false,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      className={`inline-flex items-center justify-center shrink-0 size-[14px] rounded-[2px] border transition-colors ${className} ${
        checked
          ? 'bg-[var(--accent)] border-[var(--accent)]'
          : indeterminate
            ? 'bg-[var(--bg-elevated)] border-[var(--accent)]'
            : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-[var(--text-muted)]'
      } ${disabled ? 'opacity-40 cursor-default' : ''}`}
    >
      {checked && <Check size={10} strokeWidth={3} className="text-white" aria-hidden />}
      {indeterminate && !checked && (
        <Minus size={10} strokeWidth={3} className="text-[var(--accent)]" aria-hidden />
      )}
    </button>
  );
}
