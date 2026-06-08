import type { Page } from '@playwright/test';

export const DEMO_BUCKET = 'linkedin-demo';

/** Pause between steps so the recording reads clearly on LinkedIn. */
export async function demoPause(page: Page, ms?: number): Promise<void> {
  const delay = ms ?? Number(process.env.DEMO_PAUSE_MS ?? '1200');
  await page.waitForTimeout(delay);
}

export async function seedOnboardingComplete(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const preferences = {
      state: {
        onboardingComplete: true,
        onboardingStep: 1,
        enabledProviders: ['gcs', 's3', 'azure'],
      },
      version: 0,
    };
    localStorage.setItem('storagepilot-preferences', JSON.stringify(preferences));
  });
}

export async function waitForAppReady(page: Page): Promise<void> {
  await page.getByText('System Ready').waitFor({ state: 'visible', timeout: 60_000 });
}

export async function ensureDemoBucket(page: Page, bucketName = DEMO_BUCKET): Promise<void> {
  const existing = page.getByRole('row', { name: new RegExp(bucketName) });
  if (await existing.count()) {
    return;
  }

  await page.getByRole('button', { name: 'Create Bucket' }).click();
  await page.getByRole('dialog', { name: 'Create New Bucket' }).waitFor();
  await page.getByPlaceholder('unique-bucket-name').fill(bucketName);
  await page.getByRole('button', { name: 'Create Bucket' }).last().click();
  await page.getByText(`"${bucketName}" created`).waitFor({ state: 'visible' });
}

export async function closePerformanceMetrics(page: Page): Promise<void> {
  await page
    .locator('[aria-labelledby="perf-metrics-title"]')
    .getByRole('button', { name: 'Close', exact: true })
    .click();
}

export async function openBucket(page: Page, bucketName = DEMO_BUCKET): Promise<void> {
  await page.getByRole('row', { name: new RegExp(bucketName) }).click();
  await page
    .locator('main')
    .getByRole('button', { name: 'Upload', exact: true })
    .first()
    .waitFor({ state: 'visible' });
}
