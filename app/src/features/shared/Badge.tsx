interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

const variants = {
  default: 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]',
  success: 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30',
  error: 'bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30',
  warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30',
  info: 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-mono rounded-[var(--radius)] ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
