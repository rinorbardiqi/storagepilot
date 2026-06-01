import type { ConnectionProfile } from '../api/providerFactory';
import type { ProviderType } from '../api/types';
import {
  getDefaultGcsBase,
  getDefaultS3Endpoint,
  normalizeAzureServiceUrl,
  normalizeS3Endpoint,
} from './emulatorEndpoints';
import { resolveApiUrl } from './resolveApiUrl';

export function providerAccentVar(type: ProviderType): string {
  const map: Record<ProviderType, string> = {
    gcs: 'var(--accent-gcs)',
    s3: 'var(--accent-s3)',
    azure: 'var(--accent-azure)',
  };
  return map[type];
}

export function providerEndpointHint(type: ProviderType): string {
  const map: Record<ProviderType, string> = {
    gcs: 'localhost:3000/api/gcs',
    s3: 'localhost:9000',
    azure: 'localhost:3000/api/azure',
  };
  return map[type];
}

function appHost(): string {
  if (typeof window !== 'undefined' && window.location.host) {
    return window.location.host;
  }
  return 'localhost';
}

function formatEndpointDisplay(base: string, fallback: string): string {
  const resolved = resolveApiUrl(base);
  if (/^https?:\/\//i.test(resolved)) {
    try {
      const url = new URL(resolved);
      const path = url.pathname.replace(/\/$/, '');
      return `${url.host}${path}` || url.host;
    } catch {
      return resolved.replace(/^https?:\/\//, '') || fallback;
    }
  }
  const path = resolved.startsWith('/') ? resolved : `/${resolved}`;
  return `${appHost()}${path}`.replace(/\/$/, '') || fallback;
}

export function profileApiBase(profile: ConnectionProfile): string {
  switch (profile.type) {
    case 'gcs':
      return profile.gcsUrl ?? getDefaultGcsBase();
    case 's3':
      return profile.s3Endpoint ?? getDefaultS3Endpoint();
    case 'azure':
      return normalizeAzureServiceUrl(
        profile.azureHost,
        profile.azureAccountName ?? 'devstoreaccount1',
      );
  }
}

export function profileEndpoint(profile: ConnectionProfile): string {
  const base = profileApiBase(profile);
  const fallback = providerEndpointHint(profile.type);

  if (profile.type === 's3') {
    const endpoint = normalizeS3Endpoint(base);
    return endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '') || fallback;
  }

  if (profile.type === 'azure') {
    if (base.includes('/api/azure')) {
      return `${appHost()}/api/azure`;
    }
    const normalized = normalizeAzureServiceUrl(
      base,
      profile.azureAccountName ?? 'devstoreaccount1',
    );
    if (normalized.includes('/api/azure')) {
      return `${appHost()}/api/azure`;
    }
    return normalized.replace(/^https?:\/\//, '').replace(/\/devstoreaccount1.*$/, '') || fallback;
  }

  return formatEndpointDisplay(base, fallback);
}
