import type { ConnectionProfile } from '../api/providerFactory';
import type { ProviderType } from '../api/types';
import {
  AZURITE_ACCOUNT_KEY,
  getDefaultAzureBlobServiceUrl,
  getDefaultGcsBase,
  getDefaultS3Endpoint,
} from './emulatorEndpoints';

export interface ConnectionFormValues {
  name: string;
  gcsUrl: string;
  s3Endpoint: string;
  s3AccessKey: string;
  s3SecretKey: string;
  azureHost: string;
  azureAccount: string;
  azureAccountKey: string;
}

export function defaultConnectionForm(tab: ProviderType): ConnectionFormValues {
  return {
    name: defaultProfileName(tab),
    gcsUrl: getDefaultGcsBase(),
    s3Endpoint: getDefaultS3Endpoint(),
    s3AccessKey: 'storagepilot',
    s3SecretKey: 'storagepilot',
    azureHost: getDefaultAzureBlobServiceUrl(),
    azureAccount: 'devstoreaccount1',
    azureAccountKey: AZURITE_ACCOUNT_KEY,
  };
}

export function defaultProfileName(tab: ProviderType): string {
  const labels: Record<ProviderType, string> = {
    gcs: 'GCS Emulator',
    s3: 'LocalStack S3',
    azure: 'Azure Azurite',
  };
  return labels[tab];
}

export function connectionFormFromProfile(
  tab: ProviderType,
  profile?: ConnectionProfile,
): ConnectionFormValues {
  const defaults = defaultConnectionForm(tab);
  if (!profile) return defaults;
  return {
    name: profile.name,
    gcsUrl: profile.gcsUrl ?? defaults.gcsUrl,
    s3Endpoint: profile.s3Endpoint ?? defaults.s3Endpoint,
    s3AccessKey: profile.s3AccessKey ?? defaults.s3AccessKey,
    s3SecretKey: profile.s3SecretKey ?? defaults.s3SecretKey,
    azureHost: profile.azureHost ?? defaults.azureHost,
    azureAccount: profile.azureAccountName ?? defaults.azureAccount,
    azureAccountKey: profile.azureAccountKey ?? defaults.azureAccountKey,
  };
}

export function profileFromForm(
  tab: ProviderType,
  values: ConnectionFormValues,
  id: string,
): ConnectionProfile {
  return {
    id,
    name: values.name.trim() || defaultProfileName(tab),
    type: tab,
    gcsUrl: tab === 'gcs' ? values.gcsUrl : undefined,
    gcsScheme: tab === 'gcs' ? 'http' : undefined,
    s3Endpoint: tab === 's3' ? values.s3Endpoint : undefined,
    s3AccessKey: tab === 's3' ? values.s3AccessKey : undefined,
    s3SecretKey: tab === 's3' ? values.s3SecretKey : undefined,
    s3Region: tab === 's3' ? 'us-east-1' : undefined,
    azureHost: tab === 'azure' ? values.azureHost : undefined,
    azureAccountName: tab === 'azure' ? values.azureAccount : undefined,
    azureAccountKey: tab === 'azure' ? values.azureAccountKey : undefined,
  };
}
