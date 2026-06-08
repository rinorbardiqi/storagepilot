import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import {
  createBucket,
  openBucket,
  seedBundledApp,
  uploadFile,
  waitForAppReady,
  type ProviderKey,
} from './helpers/providers';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURE = join(__dirname, 'fixtures/sample.txt');

const providers: ProviderKey[] = ['gcs', 's3', 'azure'];

test.describe('provider flows', () => {
  test.beforeEach(async ({ page }) => {
    await seedBundledApp(page);
  });

  for (const provider of providers) {
    test(`${provider}: create bucket, upload, and list object`, async ({ page }) => {
      const bucket = `e2e-${provider}-${Date.now()}`;

      await page.goto(`/${provider}`);
      await waitForAppReady(page);
      await createBucket(page, bucket);
      await openBucket(page, bucket);
      await uploadFile(page, FIXTURE, 'sample.txt');
      await expect(page.getByText('sample.txt')).toBeVisible();
    });
  }
});
