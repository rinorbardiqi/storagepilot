import type { ProviderType } from '../../api/types';

const LABEL: Record<ProviderType, string> = {
  gcs: 'Google Cloud Storage',
  s3: 'Amazon S3',
  azure: 'Azure Blob Storage',
};

const ICON_SRC: Record<ProviderType, string> = {
  gcs: '/icons/gcs.svg',
  s3: '/icons/s3.svg',
  azure: '/icons/azure.svg',
};

interface ProviderIconProps {
  type: ProviderType;
  size?: number;
  className?: string;
}

/** Brand mark only — use in sidebar rows, tables, chips. */
export function ProviderIcon({ type, size = 16, className = '' }: ProviderIconProps) {
  return (
    <img
      src={ICON_SRC[type]}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      draggable={false}
    />
  );
}

interface ProviderLogoProps {
  type: ProviderType;
  size?: number;
  /** `icon` for compact sidebar rows; `full` for onboarding cards */
  variant?: 'icon' | 'full';
}

export function ProviderLogo({ type, size = 48, variant = 'full' }: ProviderLogoProps) {
  if (variant === 'icon') {
    return <ProviderIcon type={type} size={size} />;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <ProviderIcon type={type} size={size} />
      <span className="text-sm font-medium text-[var(--text-primary)]">{LABEL[type]}</span>
    </div>
  );
}
