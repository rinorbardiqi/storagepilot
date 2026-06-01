import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && (
        <span className="text-[var(--text-muted)] text-xs">{label}</span>
      )}
      <input
        id={inputId}
        className={`px-2 py-1.5 bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius)] outline-none focus:border-[var(--accent-gcs)] ${className}`}
        {...props}
      />
    </label>
  );
}
