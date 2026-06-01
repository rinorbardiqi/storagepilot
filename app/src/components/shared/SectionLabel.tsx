interface SectionLabelProps {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, action, className = '' }: SectionLabelProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span
        className="text-[10px] font-semibold uppercase tracking-[1px] leading-[15px] text-[var(--text-muted)]"
        style={{ fontFamily: 'var(--font-ui)' }}
      >
        {children}
      </span>
      {action}
    </div>
  );
}
