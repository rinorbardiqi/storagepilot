import { describe, expect, it } from 'vitest';
import type { ConnectionProfile } from '../api/providerFactory';
import { getProviderConnectionInfo } from './connectionStrings';

const gcsProfile: ConnectionProfile = {
  id: 'default-gcs',
  name: 'GCS Emulator',
  type: 'gcs',
  gcsUrl: '/api/gcs',
};

const s3Profile: ConnectionProfile = {
  id: 'default-s3',
  name: 'LocalStack S3',
  type: 's3',
  s3Endpoint: 'http://localhost:9000',
  s3AccessKey: 'storagepilot',
  s3SecretKey: 'storagepilot',
  s3Region: 'us-east-1',
};

const azureProfile: ConnectionProfile = {
  id: 'default-azure',
  name: 'Azure Azurite',
  type: 'azure',
  azureHost: '/api/azure',
  azureAccountName: 'devstoreaccount1',
};

describe('getProviderConnectionInfo', () => {
  it('includes endpoint and Node SDK init for GCS', () => {
    const info = getProviderConnectionInfo(gcsProfile);
    expect(info.title).toBe('GCS EMULATOR');
    expect(info.endpoint).toContain('/api/gcs');
    expect(info.sdkSnippet('node')).toContain('@google-cloud/storage');
    expect(info.sdkSnippet('cli')).toContain('STORAGE_EMULATOR_HOST');
  });

  it('includes endpoint and Node SDK init for S3', () => {
    const info = getProviderConnectionInfo(s3Profile);
    expect(info.title).toBe('LOCALSTACK S3');
    expect(info.endpoint).toBe('localhost:9000');
    expect(info.sdkSnippet('node')).toContain('S3Client');
    expect(info.sdkSnippet('node')).toContain('storagepilot');
    expect(info.sdkSnippet('cli')).toContain('--endpoint-url');
  });

  it('includes endpoint and Node SDK init for Azure', () => {
    const info = getProviderConnectionInfo(azureProfile);
    expect(info.title).toBe('AZURITE (AZURE)');
    expect(info.endpoint).toContain('/api/azure');
    expect(info.sdkSnippet('node')).toContain('BlobServiceClient');
    expect(info.sdkSnippet('node')).toContain('fromConnectionString');
  });
});
