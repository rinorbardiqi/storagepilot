import type { ConnectionProfile } from '../api/providerFactory';
import type { ProviderType } from '../api/types';
import {
  generateConnectionInitSnippet,
  type SnippetLanguage,
} from './snippetTemplates';
import { profileEndpoint } from './providerAccent';

export type ConnectionSdkLanguage = Extract<SnippetLanguage, 'node' | 'python' | 'cli'>;

export const CONNECTION_SDK_LANGUAGES: ConnectionSdkLanguage[] = ['node', 'python', 'cli'];

export const CONNECTION_SDK_LANGUAGE_LABELS: Record<ConnectionSdkLanguage, string> = {
  node: 'Node.js',
  python: 'Python',
  cli: 'CLI',
};

export interface ProviderConnectionInfo {
  type: ProviderType;
  title: string;
  endpoint: string;
  sdkSnippet: (language: ConnectionSdkLanguage) => string;
}

export const PROVIDER_CONNECTION_TITLES: Record<ProviderType, string> = {
  gcs: 'GCS EMULATOR',
  s3: 'LOCALSTACK S3',
  azure: 'AZURITE (AZURE)',
};

export function getProviderConnectionInfo(profile: ConnectionProfile): ProviderConnectionInfo {
  return {
    type: profile.type,
    title: PROVIDER_CONNECTION_TITLES[profile.type],
    endpoint: profileEndpoint(profile),
    sdkSnippet: (language) => generateConnectionInitSnippet(language, profile),
  };
}

export function getConnectionInfosForProfiles(
  profiles: ConnectionProfile[],
): ProviderConnectionInfo[] {
  return profiles.map(getProviderConnectionInfo);
}
