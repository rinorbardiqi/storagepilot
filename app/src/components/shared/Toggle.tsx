interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
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
