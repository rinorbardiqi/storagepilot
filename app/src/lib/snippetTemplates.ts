import type { ConnectionProfile } from '../api/providerFactory';
import type { ProviderType } from '../api/types';
import {
  AZURITE_ACCOUNT_KEY,
  getDefaultAzureBlobServiceUrl,
  getDefaultGcsBase,
  getDefaultS3Endpoint,
  normalizeAzureServiceUrl,
  normalizeS3Endpoint,
} from './emulatorEndpoints';
import { buildPathFormats, type PathFormats } from './pathFormatters';
import { resolveApiUrl } from './resolveApiUrl';

import { operationSnippet } from './snippetOperations';
export type { SnippetLanguage, SnippetOperation } from './snippetTypes';
import type { SnippetLanguage, SnippetOperation } from './snippetTypes';

export const SNIPPET_PLACEHOLDER_BUCKET = 'my-bucket';
export const SNIPPET_PLACEHOLDER_KEY = 'path/to/object';

function profileBaseUrl(profile: ConnectionProfile): string {
  switch (profile.type) {
    case 'gcs':
      return profile.gcsUrl ?? getDefaultGcsBase();
    case 's3':
      return normalizeS3Endpoint(profile.s3Endpoint);
    case 'azure':
      return normalizeAzureServiceUrl(profile.azureHost, azureAccount(profile));
  }
}

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

function azureAccount(profile: ConnectionProfile): string {
  return profile.azureAccountName ?? 'devstoreaccount1';
}

function azureAccountKey(profile: ConnectionProfile): string {
  return profile.azureAccountKey ?? AZURITE_ACCOUNT_KEY;
}

function azureBlobServiceUrl(profile: ConnectionProfile): string {
  return normalizeAzureServiceUrl(
    profile.azureHost ?? getDefaultAzureBlobServiceUrl(),
    azureAccount(profile),
  );
}

function azureConnectionString(profile: ConnectionProfile): string {
  const account = azureAccount(profile);
  const key = azureAccountKey(profile);
  const blobEndpoint = azureBlobServiceUrl(profile);
  return `DefaultEndpointsProtocol=http;AccountName=${account};AccountKey=${key};BlobEndpoint=${blobEndpoint};`;
}

function gcsSnippets(
  language: SnippetLanguage,
  profile: ConnectionProfile,
  bucket: string,
  key: string,
  paths: PathFormats,
): string {
  const endpoint = gcsEndpoint(profile);
  const emulatorHost = gcsEmulatorHost(profile);

  switch (language) {
    case 'cli':
      return [
        `export STORAGE_EMULATOR_HOST=${emulatorHost}`,
        `gsutil cp ${paths.native} ./local-file`,
      ].join('\n');
    case 'node':
      return [
        '// npm install @google-cloud/storage',
        "const { Storage } = require('@google-cloud/storage');",
        '',
        'const storage = new Storage({',
        `  apiEndpoint: ${q(endpoint)},`,
        "  projectId: 'test-project',",
        '});',
        '',
        'async function download() {',
        `  const [contents] = await storage.bucket(${q(bucket)}).file(${q(key)}).download();`,
        '  console.log(contents.toString());',
        '}',
        '',
        'download().catch(console.error);',
      ].join('\n');
    case 'python':
      return [
        '# pip install google-cloud-storage',
        'import os',
        `os.environ["STORAGE_EMULATOR_HOST"] = ${q(endpoint)}`,
        '',
        'from google.cloud import storage',
        '',
        "client = storage.Client(project='test-project')",
        `bucket = client.bucket(${q(bucket)})`,
        `blob = bucket.blob(${q(key)})`,
        'blob.download_to_filename("./local-file")',
      ].join('\n');
    case 'go':
      return [
        '// go get cloud.google.com/go/storage',
        'package main',
        '',
        'import (',
        '  "context"',
        '  "fmt"',
        '  "io"',
        '  "os"',
        '',
        '  "cloud.google.com/go/storage"',
        '  "google.golang.org/api/option"',
        ')',
        '',
        'func main() {',
        '  ctx := context.Background()',
        `  client, err := storage.NewClient(ctx, option.WithEndpoint(${q(endpoint)}))`,
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '  defer client.Close()',
        '',
        `  rc, err := client.Bucket(${q(bucket)}).Object(${q(key)}).NewReader(ctx)`,
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '  defer rc.Close()',
        '',
        '  f, err := os.Create("local-file")',
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '  defer f.Close()',
        '',
        '  if _, err := io.Copy(f, rc); err != nil {',
        '    panic(err)',
        '  }',
        '  fmt.Println("downloaded")',
        '}',
      ].join('\n');
    case 'java':
      return [
        '// Maven: com.google.cloud:google-cloud-storage',
        'import com.google.cloud.storage.BlobId;',
        'import com.google.cloud.storage.Storage;',
        'import com.google.cloud.storage.StorageOptions;',
        '',
        'public class DownloadGcs {',
        '  public static void main(String[] args) throws Exception {',
        '    Storage storage = StorageOptions.newBuilder()',
        `        .setHost(${q(endpoint)})`,
        "        .setProjectId('test-project')",
        '        .build()',
        '        .getService();',
        `    byte[] bytes = storage.readAllBytes(${q(bucket)}, ${q(key)});`,
        '    java.nio.file.Files.write(java.nio.file.Path.of("local-file"), bytes);',
        '  }',
        '}',
      ].join('\n');
  }
}

function s3Snippets(
  language: SnippetLanguage,
  profile: ConnectionProfile,
  bucket: string,
  key: string,
  paths: PathFormats,
): string {
  const endpoint = s3Endpoint(profile);
  const accessKey = profile.s3AccessKey ?? 'storagepilot';
  const secretKey = profile.s3SecretKey ?? 'storagepilot';
  const region = profile.s3Region ?? 'us-east-1';

  switch (language) {
    case 'cli':
      return `aws --endpoint-url ${endpoint} s3 cp ${paths.native} ./local-file`;
    case 'node':
      return [
        '// npm install @aws-sdk/client-s3',
        "const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');",
        "const fs = require('fs');",
        '',
        'const client = new S3Client({',
        `  endpoint: ${q(endpoint)},`,
        `  region: ${q(region)},`,
        '  credentials: {',
        `    accessKeyId: ${q(accessKey)},`,
        `    secretAccessKey: ${q(secretKey)},`,
        '  },',
        '  forcePathStyle: true,',
        '});',
        '',
        'async function download() {',
        '  const res = await client.send(new GetObjectCommand({',
        `    Bucket: ${q(bucket)},`,
        `    Key: ${q(key)},`,
        '  }));',
        '  const body = await res.Body.transformToByteArray();',
        "  fs.writeFileSync('./local-file', Buffer.from(body));",
        '}',
        '',
        'download().catch(console.error);',
      ].join('\n');
    case 'python':
      return [
        '# pip install boto3',
        'import boto3',
        '',
        's3 = boto3.client(',
        "  's3',",
        `  endpoint_url=${q(endpoint)},`,
        `  aws_access_key_id=${q(accessKey)},`,
        `  aws_secret_access_key=${q(secretKey)},`,
        `  region_name=${q(region)},`,
        ')',
        's3.download_file(',
        `  ${q(bucket)},`,
        `  ${q(key)},`,
        "  './local-file',",
        ')',
      ].join('\n');
    case 'go':
      return [
        '// go get github.com/aws/aws-sdk-go-v2/...',
        'package main',
        '',
        'import (',
        '  "context"',
        '  "fmt"',
        '  "os"',
        '',
        '  "github.com/aws/aws-sdk-go-v2/aws"',
        '  "github.com/aws/aws-sdk-go-v2/config"',
        '  "github.com/aws/aws-sdk-go-v2/credentials"',
        '  "github.com/aws/aws-sdk-go-v2/service/s3"',
        ')',
        '',
        'func main() {',
        '  ctx := context.Background()',
        '  cfg, err := config.LoadDefaultConfig(ctx,',
        `    config.WithRegion(${q(region)}),`,
        '    config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(',
        `      ${q(accessKey)},`,
        `      ${q(secretKey)},`,
        "      '',",
        '    )),',
        '  )',
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '',
        '  client := s3.NewFromConfig(cfg, func(o *s3.Options) {',
        `    o.BaseEndpoint = aws.String(${q(endpoint)})`,
        '    o.UsePathStyle = true',
        '  })',
        '',
        '  out, err := client.GetObject(ctx, &s3.GetObjectInput{',
        `    Bucket: aws.String(${q(bucket)}),`,
        `    Key:    aws.String(${q(key)}),`,
        '  })',
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '  defer out.Body.Close()',
        '',
        '  f, err := os.Create("local-file")',
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '  defer f.Close()',
        '',
        '  if _, err := f.ReadFrom(out.Body); err != nil {',
        '    panic(err)',
        '  }',
        '  fmt.Println("downloaded")',
        '}',
      ].join('\n');
    case 'java':
      return [
        '// Maven: software.amazon.awssdk:s3',
        'import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;',
        'import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;',
        'import software.amazon.awssdk.regions.Region;',
        'import software.amazon.awssdk.services.s3.S3Client;',
        'import software.amazon.awssdk.services.s3.model.GetObjectRequest;',
        '',
        'import java.net.URI;',
        'import java.nio.file.Files;',
        'import java.nio.file.Path;',
        '',
        'public class DownloadS3 {',
        '  public static void main(String[] args) throws Exception {',
        '    S3Client s3 = S3Client.builder()',
        `        .endpointOverride(URI.create(${q(endpoint)}))`,
        `        .region(Region.of(${q(region)}))`,
        '        .credentialsProvider(StaticCredentialsProvider.create(',
        '            AwsBasicCredentials.create(',
        `                ${q(accessKey)},`,
        `                ${q(secretKey)}`,
        '            )',
        '        ))',
        '        .forcePathStyle(true)',
        '        .build();',
        '',
        '    var response = s3.getObject(GetObjectRequest.builder()',
        `        .bucket(${q(bucket)})`,
        `        .key(${q(key)})`,
        '        .build());',
        '    Files.copy(response, Path.of("local-file"));',
        '  }',
        '}',
      ].join('\n');
  }
}

function azureSnippets(
  language: SnippetLanguage,
  profile: ConnectionProfile,
  bucket: string,
  key: string,
  paths: PathFormats,
): string {
  const account = azureAccount(profile);
  const accountKey = azureAccountKey(profile);
  const blobServiceUrl = azureBlobServiceUrl(profile);
  const connectionString = azureConnectionString(profile);

  switch (language) {
    case 'cli':
      return [
        'az storage blob download \\',
        `  --account-name ${account} \\`,
        `  --account-key ${q(accountKey)} \\`,
        `  --blob-url ${q(paths.http)} \\`,
        '  --file ./local-file',
      ].join('\n');
    case 'node':
      return [
        '// npm install @azure/storage-blob',
        "const { BlobServiceClient } = require('@azure/storage-blob');",
        "const fs = require('fs');",
        '',
        `const client = BlobServiceClient.fromConnectionString(${q(connectionString)});`,
        '',
        'async function download() {',
        `  const blob = client.getContainerClient(${q(bucket)}).getBlobClient(${q(key)});`,
        '  const buffer = await blob.downloadToBuffer();',
        "  fs.writeFileSync('./local-file', buffer);",
        '}',
        '',
        'download().catch(console.error);',
      ].join('\n');
    case 'python':
      return [
        '# pip install azure-storage-blob',
        'from azure.storage.blob import BlobServiceClient',
        '',
        `client = BlobServiceClient.from_connection_string(${q(connectionString)})`,
        `blob = client.get_blob_client(container=${q(bucket)}, blob=${q(key)})`,
        'with open("./local-file", "wb") as f:',
        '  f.write(blob.download_blob().readall())',
      ].join('\n');
    case 'go':
      return [
        '// go get github.com/Azure/azure-sdk-for-go/sdk/storage/azblob',
        'package main',
        '',
        'import (',
        '  "context"',
        '  "fmt"',
        '  "os"',
        '',
        '  "github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"',
        ')',
        '',
        'func main() {',
        '  ctx := context.Background()',
        `  client, err := azblob.NewClientWithSharedKey(${q(blobServiceUrl)}, &azblob.SharedKeyCredential{`,
        `    AccountName: ${q(account)},`,
        `    AccountKey:  ${q(accountKey)},`,
        '  }, nil)',
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '',
        '  resp, err := client.DownloadStream(ctx,',
        `    ${q(bucket)},`,
        `    ${q(key)},`,
        '    nil,',
        '  )',
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '  defer resp.Body.Close()',
        '',
        '  f, err := os.Create("local-file")',
        '  if err != nil {',
        '    panic(err)',
        '  }',
        '  defer f.Close()',
        '',
        '  if _, err := f.ReadFrom(resp.Body); err != nil {',
        '    panic(err)',
        '  }',
        '  fmt.Println("downloaded")',
        '}',
      ].join('\n');
    case 'java':
      return [
        '// Maven: com.azure:azure-storage-blob',
        'import com.azure.storage.blob.BlobClient;',
        'import com.azure.storage.blob.BlobContainerClient;',
        'import com.azure.storage.blob.BlobServiceClient;',
        'import com.azure.storage.blob.BlobServiceClientBuilder;',
        '',
        'import java.nio.file.Files;',
        'import java.nio.file.Path;',
        '',
        'public class DownloadAzure {',
        '  public static void main(String[] args) throws Exception {',
        '    BlobServiceClient service = new BlobServiceClientBuilder()',
        `        .connectionString(${q(connectionString)})`,
        '        .buildClient();',
        `    BlobContainerClient container = service.getBlobContainerClient(${q(bucket)});`,
        `    BlobClient blob = container.getBlobClient(${q(key)});`,
        '    blob.downloadToFile("local-file");',
        '    Files.exists(Path.of("local-file"));',
        '  }',
        '}',
      ].join('\n');
  }
}

export function generateSnippet(
  language: SnippetLanguage,
  provider: ProviderType,
  profile: ConnectionProfile,
  bucket: string,
  key: string,
  paths: PathFormats,
  operation: SnippetOperation = 'download',
): string {
  const opSnippet = operationSnippet(operation, language, provider, profile, bucket, key, paths);
  if (opSnippet) return opSnippet;

  switch (provider) {
    case 'gcs':
      return gcsSnippets(language, profile, bucket, key, paths);
    case 's3':
      return s3Snippets(language, profile, bucket, key, paths);
    case 'azure':
      return azureSnippets(language, profile, bucket, key, paths);
  }
}

/** Client-only setup snippets for sidebar / quick copy (no bucket operations). */
export function generateConnectionInitSnippet(
  language: SnippetLanguage,
  profile: ConnectionProfile,
): string {
  switch (profile.type) {
    case 'gcs':
      return gcsConnectionInit(language, profile);
    case 's3':
      return s3ConnectionInit(language, profile);
    case 'azure':
      return azureConnectionInit(language, profile);
  }
}

function gcsConnectionInit(language: SnippetLanguage, profile: ConnectionProfile): string {
  const endpoint = gcsEndpoint(profile);
  const emulatorHost = gcsEmulatorHost(profile);

  switch (language) {
    case 'cli':
      return `export STORAGE_EMULATOR_HOST=${emulatorHost}`;
    case 'node':
      return [
        '// npm install @google-cloud/storage',
        "const { Storage } = require('@google-cloud/storage');",
        '',
        'const storage = new Storage({',
        `  apiEndpoint: ${q(endpoint)},`,
        "  projectId: 'test-project',",
        '});',
      ].join('\n');
    case 'python':
      return [
        '# pip install google-cloud-storage',
        'import os',
        `os.environ["STORAGE_EMULATOR_HOST"] = ${q(endpoint)}`,
        '',
        'from google.cloud import storage',
        "client = storage.Client(project='test-project')",
      ].join('\n');
    case 'go':
      return [
        '// go get cloud.google.com/go/storage',
        'import (',
        '  "cloud.google.com/go/storage"',
        '  "google.golang.org/api/option"',
        ')',
        '',
        `client, err := storage.NewClient(ctx, option.WithEndpoint(${q(endpoint)}))`,
      ].join('\n');
    case 'java':
      return [
        '// Maven: com.google.cloud:google-cloud-storage',
        'Storage storage = StorageOptions.newBuilder()',
        `    .setHost(${q(endpoint)})`,
        "    .setProjectId('test-project')",
        '    .build()',
        '    .getService();',
      ].join('\n');
  }
}

function s3ConnectionInit(language: SnippetLanguage, profile: ConnectionProfile): string {
  const endpoint = s3Endpoint(profile);
  const accessKey = profile.s3AccessKey ?? 'storagepilot';
  const secretKey = profile.s3SecretKey ?? 'storagepilot';
  const region = profile.s3Region ?? 'us-east-1';

  switch (language) {
    case 'cli':
      return `aws --endpoint-url ${endpoint} s3 ls`;
    case 'node':
      return [
        '// npm install @aws-sdk/client-s3',
        "const { S3Client } = require('@aws-sdk/client-s3');",
        '',
        'const client = new S3Client({',
        `  endpoint: ${q(endpoint)},`,
        `  region: ${q(region)},`,
        '  credentials: {',
        `    accessKeyId: ${q(accessKey)},`,
        `    secretAccessKey: ${q(secretKey)},`,
        '  },',
        '  forcePathStyle: true,',
        '});',
      ].join('\n');
    case 'python':
      return [
        '# pip install boto3',
        'import boto3',
        '',
        's3 = boto3.client(',
        "  's3',",
        `  endpoint_url=${q(endpoint)},`,
        `  aws_access_key_id=${q(accessKey)},`,
        `  aws_secret_access_key=${q(secretKey)},`,
        `  region_name=${q(region)},`,
        ')',
      ].join('\n');
    case 'go':
      return [
        '// go get github.com/aws/aws-sdk-go-v2/service/s3',
        `endpoint := ${q(endpoint)}`,
        `cfg, _ := config.LoadDefaultConfig(ctx, config.WithRegion(${q(region)}))`,
        'client := s3.NewFromConfig(cfg, func(o *s3.Options) {',
        '  o.BaseEndpoint = aws.String(endpoint)',
        '  o.UsePathStyle = true',
        '})',
      ].join('\n');
    case 'java':
      return [
        '// Maven: software.amazon.awssdk:s3',
        'S3Client s3 = S3Client.builder()',
        `    .endpointOverride(URI.create(${q(endpoint)}))`,
        `    .region(Region.of(${q(region)}))`,
        '    .credentialsProvider(StaticCredentialsProvider.create(',
        '        AwsBasicCredentials.create(',
        `            ${q(accessKey)},`,
        `            ${q(secretKey)}`,
        '        )',
        '    ))',
        '    .forcePathStyle(true)',
        '    .build();',
      ].join('\n');
  }
}

function azureConnectionInit(language: SnippetLanguage, profile: ConnectionProfile): string {
  const account = azureAccount(profile);
  const accountKey = azureAccountKey(profile);
  const blobServiceUrl = azureBlobServiceUrl(profile);
  const connectionString = azureConnectionString(profile);

  switch (language) {
    case 'cli':
      return [
        'az storage blob list \\',
        `  --account-name ${account} \\`,
        `  --account-key ${q(accountKey)} \\`,
        `  --blob-endpoint ${q(blobServiceUrl)}`,
      ].join('\n');
    case 'node':
      return [
        '// npm install @azure/storage-blob',
        "const { BlobServiceClient } = require('@azure/storage-blob');",
        '',
        `const client = BlobServiceClient.fromConnectionString(${q(connectionString)});`,
      ].join('\n');
    case 'python':
      return [
        '# pip install azure-storage-blob',
        'from azure.storage.blob import BlobServiceClient',
        '',
        `client = BlobServiceClient.from_connection_string(${q(connectionString)})`,
      ].join('\n');
    case 'go':
      return [
        '// go get github.com/Azure/azure-sdk-for-go/sdk/storage/azblob',
        `client, err := azblob.NewClientWithSharedKey(${q(blobServiceUrl)}, &azblob.SharedKeyCredential{`,
        `  AccountName: ${q(account)},`,
        `  AccountKey:  ${q(accountKey)},`,
        '}, nil)',
      ].join('\n');
    case 'java':
      return [
        '// Maven: com.azure:azure-storage-blob',
        `BlobServiceClient client = new BlobServiceClientBuilder()`,
        `    .connectionString(${q(connectionString)})`,
        '    .buildClient();',
      ].join('\n');
  }
}

/** Generate snippets from a saved profile — no live provider connection required. */
export function generateSnippetForProfile(
  language: SnippetLanguage,
  profile: ConnectionProfile,
  bucket: string,
  key: string,
  operation: SnippetOperation = 'download',
): string {
  const paths = buildPathFormats(profile.type, bucket, key, profileBaseUrl(profile));
  return generateSnippet(language, profile.type, profile, bucket, key, paths, operation);
}
