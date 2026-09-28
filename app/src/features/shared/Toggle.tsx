interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-0.5 size-3 rounded-full bg-[var(--bg-base)] transition-transform ${
          checked ? 'left-[22px]' : 'left-1'
        }`}
      />
    </button>
  );
}
