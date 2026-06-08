import { describe, expect, it } from 'vitest';
import { buildDefaultProfiles } from '@/lib/reconcileProfiles';
import { buildPathFormats } from '@/lib/pathFormatters';
import { generateSnippet, generateSnippetForProfile } from '@/lib/snippetTemplates';

const profiles = buildDefaultProfiles();
const bucket = 'my-bucket';
const key = 'path/to/object';

describe('generateSnippet', () => {
  it('generates GCS Node snippet with emulator endpoint', () => {
    const profile = profiles.find((p) => p.type === 'gcs')!;
    const paths = buildPathFormats('gcs', bucket, key, profile.gcsUrl!);
    const code = generateSnippet('node', 'gcs', profile, bucket, key, paths);

    expect(code).toContain('@google-cloud/storage');
    expect(code).toContain('apiEndpoint');
    expect(code).toContain('my-bucket');
    expect(code).toContain('path/to/object');
    expect(code).not.toContain('@aws-sdk/client-s3');
  });

  it('generates S3 Node snippet with path-style MinIO config', () => {
    const profile = profiles.find((p) => p.type === 's3')!;
    const paths = buildPathFormats('s3', bucket, key, profile.s3Endpoint!);
    const code = generateSnippet('node', 's3', profile, bucket, key, paths);

    expect(code).toContain('@aws-sdk/client-s3');
    expect(code).toContain('forcePathStyle: true');
    expect(code).toContain('storagepilot');
    expect(code).toContain(':9000');
    expect(code).not.toContain('@google-cloud/storage');
  });

  it('generates Azure Node snippet with connection string', () => {
    const profile = profiles.find((p) => p.type === 'azure')!;
    const paths = buildPathFormats('azure', bucket, key, profile.azureHost!);
    const code = generateSnippet('node', 'azure', profile, bucket, key, paths);

    expect(code).toContain('@azure/storage-blob');
    expect(code).toContain('devstoreaccount1');
    expect(code).toContain('BlobEndpoint');
    expect(code).not.toContain('boto3');
  });

  it('generateSnippetForProfile works without a live provider', () => {
    const profile = profiles.find((p) => p.type === 's3')!;
    const code = generateSnippetForProfile('node', profile, bucket, key);
    expect(code).toContain('@aws-sdk/client-s3');
    expect(code).toContain(bucket);
  });

  it('generates provider-specific CLI commands', () => {
    const gcs = profiles.find((p) => p.type === 'gcs')!;
    const s3 = profiles.find((p) => p.type === 's3')!;
    const azure = profiles.find((p) => p.type === 'azure')!;

    expect(generateSnippet('cli', 'gcs', gcs, bucket, key, buildPathFormats('gcs', bucket, key, gcs.gcsUrl!))).toContain(
      'STORAGE_EMULATOR_HOST',
    );
    expect(generateSnippet('cli', 's3', s3, bucket, key, buildPathFormats('s3', bucket, key, s3.s3Endpoint!))).toContain(
      '--endpoint-url',
    );
    expect(
      generateSnippet('cli', 'azure', azure, bucket, key, buildPathFormats('azure', bucket, key, azure.azureHost!)),
    ).toContain('az storage blob download');
  });
});
