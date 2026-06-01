interface LogoMarkProps {
  className?: string;
}

/** 18×18 brand mark from Figma Header: Zone 1 */
export function LogoMark({ className = 'size-[18px] shrink-0' }: LogoMarkProps) {
  return (
    <img
      src="/logo-mark.svg"
      alt=""
      aria-hidden
      className={className}
      width={18}
      height={18}
    />
  );
}

interface StoragePilotLogoProps {
  className?: string;
}

export function StoragePilotLogo({ className = '' }: StoragePilotLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 w-[var(--header-zone-width)] shrink-0 ${className}`}>
      <LogoMark />
      <span
        className="text-sm font-bold leading-5 tracking-[0.5px] whitespace-nowrap text-[var(--text-primary)] uppercase"
        style={{ fontFamily: 'var(--font-ui)' }}
      >
        StoragePilot
      </span>
    </div>
  );
}
