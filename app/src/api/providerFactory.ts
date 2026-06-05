import { AzureProvider } from './AzureProvider';
import { GCSProvider } from './GCSProvider';
import { instrument } from './instrumented';
import { S3Provider } from './S3Provider';
import type { ActivityLogger } from './ActivityLogger';
import { nullLogger } from './ActivityLogger';
import type { StorageProvider } from './StorageProvider';

export interface ConnectionProfile {
  id: string;
  name: string;
  type: 'gcs' | 's3' | 'azure';
  gcsUrl?: string;
  s3Endpoint?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3Region?: string;
  azureHost?: string;
  azureAccountName?: string;
  azureAccountKey?: string;
}

export function createProvider(
  config: ConnectionProfile,
  logger: ActivityLogger = nullLogger,
): StorageProvider {
  let provider: StorageProvider;
  switch (config.type) {
    case 'gcs':
      provider = new GCSProvider({ type: 'gcs', gcsUrl: config.gcsUrl });
      break;
    case 's3':
      provider = new S3Provider({
        type: 's3',
        s3Endpoint: config.s3Endpoint,
        s3AccessKey: config.s3AccessKey,
        s3SecretKey: config.s3SecretKey,
        s3Region: config.s3Region,
      });
      break;
    case 'azure':
      provider = new AzureProvider({
        type: 'azure',
        azureHost: config.azureHost,
        azureAccountName: config.azureAccountName,
        azureAccountKey: config.azureAccountKey,
      });
      break;
    default:
      throw new Error(`Unknown provider type: ${(config as ConnectionProfile).type}`);
  }
  return instrument(provider, logger);
}
