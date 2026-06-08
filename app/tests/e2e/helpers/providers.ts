import type { Page } from '@playwright/test';

export const PROVIDER_PROFILES = {
  gcs: { id: 'default-gcs', label: 'GCS Emulator' },
  s3: { id: 'default-s3', label: 'LocalStack S3' },
  azure: { id: 'default-azure', label: 'Azure Azurite' },
} as const;

export type ProviderKey = keyof typeof PROVIDER_PROFILES;

export async function seedBundledApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'storagepilot-preferences',
      JSON.stringify({
        state: {
          onboardingComplete: true,
          onboardingStep: 1,
          enabledProviders: ['gcs', 's3', 'azure'],
        },
        version: 0,
      }),
    );
    localStorage.setItem(
      'storagepilot-connections',
      JSON.stringify({
        state: {
          profiles: [
            { id: 'default-gcs', name: 'GCS Emulator', type: 'gcs', gcsUrl: '/api/gcs' },
            {
              id: 'default-s3',
              name: 'LocalStack S3',
              type: 's3',
              s3Endpoint: `${window.location.protocol}//${window.location.hostname}:9000`,
              s3AccessKey: 'storagepilot',
              s3SecretKey: 'storagepilot',
              s3Region: 'us-east-1',
            },
            {
              id: 'default-azure',
              name: 'Azure Azurite',
              type: 'azure',
              azureHost: '/api/azure/devstoreaccount1',
              azureAccountName: 'devstoreaccount1',
              azureAccountKey:
                'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
            },
          ],
          activeProfileId: 'default-gcs',
          deletedDefaultIds: [],
          connectionStatus: {},
          connectionErrors: {},
        },
        version: 0,
      }),
    );
  });
}

export async function waitForAppReady(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Create Bucket' }).waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByText(/System Ready|Awaiting Connection/).waitFor({ state: 'visible', timeout: 60_000 });
}

export async function switchProvider(page: Page, provider: ProviderKey): Promise<void> {
  const { label } = PROVIDER_PROFILES[provider];
  await page.getByRole('button', { name: label }).click();
  await page.getByText('System Ready').waitFor({ state: 'visible', timeout: 30_000 });
}

export async function createBucket(page: Page, bucketName: string): Promise<void> {
  const existing = page.getByRole('row', { name: new RegExp(bucketName) });
  if (await existing.count()) return;

  await page.getByRole('button', { name: 'Create Bucket' }).click();
  await page.getByRole('dialog', { name: 'Create New Bucket' }).waitFor();
  await page.getByPlaceholder('unique-bucket-name').fill(bucketName);
  await page.getByRole('button', { name: 'Create Bucket' }).last().click();
  await page.getByText(`"${bucketName}" created`).waitFor({ state: 'visible' });
}

export async function openBucket(page: Page, bucketName: string): Promise<void> {
  await page.getByRole('row', { name: new RegExp(bucketName) }).click();
  await page
    .locator('main')
    .getByRole('button', { name: 'Upload', exact: true })
    .first()
    .waitFor({ state: 'visible' });
}

export async function uploadFile(
  page: Page,
  filePath: string,
  fileName: string,
): Promise<void> {
  await page.locator('main').getByRole('button', { name: 'Upload', exact: true }).first().click();
  await page.getByRole('dialog', { name: 'Upload Objects' }).waitFor();
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await page.getByRole('button', { name: /Start Upload/i }).click();
  await page.getByText(/Uploaded \d+ file/i).waitFor({ state: 'visible', timeout: 120_000 });
}

export async function deleteBucketFromDetail(page: Page, bucketName: string): Promise<void> {
  await page
    .getByRole('row', { name: new RegExp(bucketName) })
    .getByRole('button', { name: 'Bucket details' })
    .first()
    .click();
  await page.getByRole('button', { name: 'Delete Bucket' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  const deleteFiles = page.getByRole('button', { name: 'Delete all files' });
  if (await deleteFiles.isVisible()) {
    await deleteFiles.click();
  }
  await page.getByText(`Bucket "${bucketName}" deleted`).waitFor({ state: 'visible', timeout: 120_000 });
}
