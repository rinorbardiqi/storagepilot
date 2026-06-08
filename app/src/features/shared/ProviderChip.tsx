import type { ProviderType } from '../../api/types';

const COLORS: Record<ProviderType, string> = {
  gcs: 'var(--accent-gcs)',
  s3: 'var(--accent-s3)',
  azure: 'var(--accent-azure)',
};

const LABELS: Record<ProviderType, string> = {
  gcs: 'GCS',
  s3: 'S3',
  azure: 'Azure',
};

export function ProviderChip({ type }: { type: ProviderType }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono rounded-sm border"
      style={{ borderColor: COLORS[type], color: COLORS[type], fontFamily: 'var(--font-mono)' }}
    >
      {LABELS[type]}
    </span>
  );
}
