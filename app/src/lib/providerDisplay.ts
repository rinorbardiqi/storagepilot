import type { ProviderType } from '../api/types';

export function providerScheme(type: ProviderType): string {
  const map: Record<ProviderType, string> = {
    gcs: 'gs',
    s3: 's3',
    azure: 'az',
  };
  return map[type];
}

export interface SelectOption {
  value: string;
  label: string;
}

const GCS_LOCATIONS: SelectOption[] = [
  { value: 'us-east1', label: 'us-east1 (South Carolina)' },
  { value: 'us-west1', label: 'us-west1 (Oregon)' },
  { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
];

const S3_LOCATIONS: SelectOption[] = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
];

const AZURE_LOCATIONS: SelectOption[] = [
  { value: 'eastus', label: 'East US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westeurope', label: 'West Europe' },
];

export const BUCKET_STORAGE_CLASSES: Record<ProviderType, SelectOption[]> = {
  gcs: [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'NEARLINE', label: 'Nearline' },
    { value: 'COLDLINE', label: 'Coldline' },
    { value: 'ARCHIVE', label: 'Archive' },
  ],
  s3: [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'STANDARD_IA', label: 'Standard-IA' },
    { value: 'ONEZONE_IA', label: 'One Zone-IA' },
    { value: 'GLACIER', label: 'Glacier Flexible Retrieval' },
  ],
  azure: [
    { value: 'Hot', label: 'Hot' },
    { value: 'Cool', label: 'Cool' },
    { value: 'Cold', label: 'Cold' },
    { value: 'Archive', label: 'Archive' },
  ],
};

export const BUCKET_LOCATIONS: Record<ProviderType, SelectOption[]> = {
  gcs: GCS_LOCATIONS,
  s3: S3_LOCATIONS,
  azure: AZURE_LOCATIONS,
};

export const BUCKET_ENCRYPTION_LABELS: Record<ProviderType, string> = {
  gcs: 'Google-managed encryption keys',
  s3: 'SSE-S3 (Amazon S3 managed keys)',
  azure: 'Microsoft-managed encryption keys',
};

export function bucketResourceLabel(type: ProviderType): string {
  return type === 'azure' ? 'Container Name' : 'Bucket Name';
}
