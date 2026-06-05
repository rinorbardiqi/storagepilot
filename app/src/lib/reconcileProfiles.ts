import type { ConnectionProfile } from '../api/providerFactory';
import {
  AZURITE_ACCOUNT_KEY,
  getDefaultAzureBlobServiceUrl,
  getDefaultGcsBase,
  getDefaultS3Endpoint,
  normalizeAzureServiceUrl,
} from './emulatorEndpoints';

const DEFAULT_IDS = ['default-gcs', 'default-s3', 'default-azure'] as const;

/** Legacy profile names from older builds — drop duplicates when defaults exist. */
const LEGACY_NAMES = new Set(['Local GCS', 'Local S3', 'Local Azure']);

export function buildDefaultProfiles(): ConnectionProfile[] {
  return [
    {
      id: 'default-gcs',
      name: 'GCS Emulator',
      type: 'gcs',
      gcsUrl: getDefaultGcsBase(),
      gcsScheme: 'http',
    },
    {
      id: 'default-s3',
      name: 'LocalStack S3',
      type: 's3',
      s3Endpoint: getDefaultS3Endpoint(),
      s3AccessKey: 'storagepilot',
      s3SecretKey: 'storagepilot',
      s3Region: 'us-east-1',
    },
    {
      id: 'default-azure',
      name: 'Azure Azurite',
      type: 'azure',
      azureHost: getDefaultAzureBlobServiceUrl(),
      azureAccountName: 'devstoreaccount1',
      azureAccountKey: AZURITE_ACCOUNT_KEY,
    },
  ];
}

/** Fix persisted profiles where type/name/endpoints drifted apart. */
export function reconcileProfiles(
  stored: ConnectionProfile[],
  deletedDefaultIds: string[] = [],
): ConnectionProfile[] {
  const defaults = buildDefaultProfiles();
  const defaultById = new Map(defaults.map((d) => [d.id, d]));
  const storedById = new Map(stored.map((p) => [p.id, p]));
  const hidden = new Set(deletedDefaultIds);

  const mergedDefaults = defaults
    .filter((def) => !hidden.has(def.id))
    .map((def) => {
      const saved = storedById.get(def.id);
      if (!saved) return def;
      if (saved.type !== def.type) {
        return { ...def, type: def.type };
      }
      return {
        ...def,
        ...saved,
        id: def.id,
        type: def.type,
        ...(def.type === 'azure'
          ? {
              azureHost: normalizeAzureServiceUrl(
                saved.azureHost ?? def.azureHost,
                saved.azureAccountName ?? def.azureAccountName ?? 'devstoreaccount1',
              ),
            }
          : {}),
      };
    });

  const custom = stored.filter((p) => !defaultById.has(p.id));
  const filteredCustom = custom.filter((p) => {
    if (LEGACY_NAMES.has(p.name)) return false;
    if (defaults.some((d) => d.name === p.name)) return false;
    return true;
  });

  return [...mergedDefaults, ...filteredCustom];
}

export function isDefaultProfileId(id: string): boolean {
  return DEFAULT_IDS.includes(id as (typeof DEFAULT_IDS)[number]);
}
