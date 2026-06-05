import type { ConnectionProfile } from '../api/providerFactory';
import type { SnippetLanguage, SnippetOperation } from './snippetTypes';
import {
  AZURITE_ACCOUNT_KEY,
  getDefaultAzureBlobServiceUrl,
  getDefaultGcsBase,
  getDefaultS3Endpoint,
  normalizeAzureServiceUrl,
  normalizeS3Endpoint,
} from './emulatorEndpoints';
import { resolveApiUrl } from './resolveApiUrl';
import type { PathFormats } from './pathFormatters';

function q(value: string): string {
  return JSON.stringify(value);
}

function gcsEndpoint(profile: ConnectionProfile): string {
  return resolveApiUrl(profile.gcsUrl ?? getDefaultGcsBase());
}

function gcsEmulatorHost(profile: ConnectionProfile): string {
  const endpoint = gcsEndpoint(profile);
  try {
    const url = new URL(endpoint);
    return url.port ? `${url.hostname}:${url.port}` : url.hostname;
  } catch {
    return 'localhost:4443';
  }
}

function s3Endpoint(profile: ConnectionProfile): string {
  return normalizeS3Endpoint(profile.s3Endpoint ?? getDefaultS3Endpoint());
}

function azureBlobServiceUrl(profile: ConnectionProfile): string {
  const account = profile.azureAccountName ?? 'devstoreaccount1';
  return normalizeAzureServiceUrl(
    profile.azureHost ?? getDefaultAzureBlobServiceUrl(),
    account,
  );
}

export function operationSnippet(
  operation: SnippetOperation,
  language: SnippetLanguage,
  provider: ConnectionProfile['type'],
  profile: ConnectionProfile,
  bucket: string,
  key: string,
  paths: PathFormats,
): string | null {
  if (operation === 'download') return null;

  if (provider === 'gcs') {
    const endpoint = gcsEndpoint(profile);
    const host = gcsEmulatorHost(profile);
    if (language === 'cli') {
      if (operation === 'upload') {
        return [`export STORAGE_EMULATOR_HOST=${host}`, `gsutil cp ./local-file ${paths.native}`].join('\n');
      }
      if (operation === 'list') {
        return [`export STORAGE_EMULATOR_HOST=${host}`, `gsutil ls gs://${bucket}/`].join('\n');
      }
      return [`export STORAGE_EMULATOR_HOST=${host}`, `gsutil rm ${paths.native}`].join('\n');
    }
    if (language === 'node') {
      if (operation === 'upload') {
        return [
          "const { Storage } = require('@google-cloud/storage');",
          `const storage = new Storage({ apiEndpoint: ${q(endpoint)}, projectId: 'test-project' });`,
          `await storage.bucket(${q(bucket)}).upload('./local-file', { destination: ${q(key)} });`,
        ].join('\n');
      }
      if (operation === 'list') {
        return [
          "const { Storage } = require('@google-cloud/storage');",
          `const storage = new Storage({ apiEndpoint: ${q(endpoint)}, projectId: 'test-project' });`,
          `const [files] = await storage.bucket(${q(bucket)}).getFiles();`,
          'console.log(files.map((f) => f.name));',
        ].join('\n');
      }
      return [
        "const { Storage } = require('@google-cloud/storage');",
        `const storage = new Storage({ apiEndpoint: ${q(endpoint)}, projectId: 'test-project' });`,
        `await storage.bucket(${q(bucket)}).file(${q(key)}).delete();`,
      ].join('\n');
    }
  }

  if (provider === 's3') {
    const endpoint = s3Endpoint(profile);
    const accessKey = profile.s3AccessKey ?? 'storagepilot';
    const secretKey = profile.s3SecretKey ?? 'storagepilot';
    const region = profile.s3Region ?? 'us-east-1';
    if (language === 'cli') {
      if (operation === 'upload') {
        return `aws --endpoint-url ${endpoint} s3 cp ./local-file ${paths.native}`;
      }
      if (operation === 'list') {
        return `aws --endpoint-url ${endpoint} s3 ls s3://${bucket}/`;
      }
      return `aws --endpoint-url ${endpoint} s3 rm ${paths.native}`;
    }
    if (language === 'node') {
      const clientSetup = [
        "const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');",
        "const fs = require('fs');",
        'const client = new S3Client({',
        `  endpoint: ${q(endpoint)}, region: ${q(region)},`,
        `  credentials: { accessKeyId: ${q(accessKey)}, secretAccessKey: ${q(secretKey)} },`,
        '  forcePathStyle: true,',
        '});',
      ].join('\n');
      if (operation === 'upload') {
        return [
          clientSetup,
          'await client.send(new PutObjectCommand({',
          `  Bucket: ${q(bucket)}, Key: ${q(key)},`,
          "  Body: fs.readFileSync('./local-file'),",
          '}));',
        ].join('\n');
      }
      if (operation === 'list') {
        return [
          clientSetup,
          'const res = await client.send(new ListObjectsV2Command({',
          `  Bucket: ${q(bucket)},`,
          '}));',
          'console.log((res.Contents ?? []).map((o) => o.Key));',
        ].join('\n');
      }
      return [
        clientSetup,
        'await client.send(new DeleteObjectCommand({',
        `  Bucket: ${q(bucket)}, Key: ${q(key)},`,
        '}));',
      ].join('\n');
    }
  }

  if (provider === 'azure') {
    const conn = `DefaultEndpointsProtocol=http;AccountName=${profile.azureAccountName ?? 'devstoreaccount1'};AccountKey=${profile.azureAccountKey ?? AZURITE_ACCOUNT_KEY};BlobEndpoint=${azureBlobServiceUrl(profile)};`;
    if (language === 'cli') {
      if (operation === 'upload') {
        return `az storage blob upload -f ./local-file -c ${bucket} -n ${key} --connection-string "${conn}"`;
      }
      if (operation === 'list') {
        return `az storage blob list -c ${bucket} --connection-string "${conn}" --output table`;
      }
      return `az storage blob delete -c ${bucket} -n ${key} --connection-string "${conn}"`;
    }
    if (language === 'node') {
      if (operation === 'upload') {
        return [
          "const { BlobServiceClient } = require('@azure/storage-blob');",
          `const client = BlobServiceClient.fromConnectionString(${q(conn)});`,
          `const container = client.getContainerClient(${q(bucket)});`,
          `await container.getBlockBlobClient(${q(key)}).uploadFile('./local-file');`,
        ].join('\n');
      }
      if (operation === 'list') {
        return [
          "const { BlobServiceClient } = require('@azure/storage-blob');",
          `const client = BlobServiceClient.fromConnectionString(${q(conn)});`,
          `const container = client.getContainerClient(${q(bucket)});`,
          'for await (const blob of container.listBlobsFlat()) console.log(blob.name);',
        ].join('\n');
      }
      return [
        "const { BlobServiceClient } = require('@azure/storage-blob');",
        `const client = BlobServiceClient.fromConnectionString(${q(conn)});`,
        `await client.getContainerClient(${q(bucket)}).getBlockBlobClient(${q(key)}).delete();`,
      ].join('\n');
    }
  }

  return null;
}
