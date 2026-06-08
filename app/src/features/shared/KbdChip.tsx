/** Figma search shortcut: separate ⌘ chip + K chip */
export function CommandKShortcut() {
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <kbd
        className="inline-flex items-center justify-center min-w-[22.901px] h-[14.901px] px-1.5 py-0.5 text-[10px] leading-[15px] text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-surface)] rounded-[var(--radius)]"
        style={{ fontFamily: 'var(--font-ui)' }}
      >
        ⌘
      </kbd>
      <kbd
        className="inline-flex items-center justify-center px-[7px] py-[3px] text-[10px] leading-[15px] text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-surface)] rounded-[var(--radius)]"
        style={{ fontFamily: 'var(--font-ui)' }}
      >
        K
      </kbd>
    </span>
  );
}

/** @deprecated Use CommandKShortcut for top bar parity with Figma */
export function KbdChip({ children }: { children: string }) {
  return (
    <kbd
      className="inline-flex items-center px-2 py-0.5 text-[10px] border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-[var(--radius)]"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      {children}
    </kbd>
  );
}
