import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'accent' | 'ghost' | 'outline' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--accent-gcs)] text-white hover:opacity-90',
  accent: 'bg-[var(--accent)] text-[var(--bg-base)] font-semibold hover:opacity-90 shadow-[0_10px_15px_-3px_rgba(88,166,255,0.2)]',
  ghost: 'bg-transparent border border-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]',
  outline: 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
  danger: 'bg-[var(--error)] text-white hover:opacity-90',
};

export function Button({ variant = 'ghost', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[var(--radius)] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
