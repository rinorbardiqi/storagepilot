import { test as base, expect } from '@playwright/test';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEMO_BUCKET,
  closePerformanceMetrics,
  demoPause,
  ensureDemoBucket,
  openBucket,
  seedOnboardingComplete,
  waitForAppReady,
} from './helpers/demo';

const demoVideoPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../demo-videos/storagepilot-linkedin-demo.webm',
);

const test = base.extend({
  page: async ({ browser }, use) => {
    mkdirSync(dirname(demoVideoPath), { recursive: true });
    const context = await browser.newContext({
      recordVideo: {
        dir: dirname(demoVideoPath),
        size: { width: 1920, height: 1080 },
      },
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();
    await use(page);
    const video = page.video();
    await context.close();
    if (!video) return;
    const src = await video.path();
    if (!src) return;
    copyFileSync(src, demoVideoPath);
  },
});

export { expect };

/**
 * Records a LinkedIn-style product demo as WebM video.
 *
 * Prerequisites (pick one):
 * - Docker full stack: `docker compose up -d` then `pnpm demo:record:docker`
 * - Dev + emulators: `docker compose -f docker-compose.stack.yml up -d` then `pnpm demo:record`
 *
 * Output: `demo-videos/storagepilot-linkedin-demo.webm`
 */
test('StoragePilot LinkedIn demo walkthrough', async ({ page }) => {
  test.setTimeout(120_000);
  await seedOnboardingComplete(page);

  await page.goto('/');
  await waitForAppReady(page);
  await demoPause(page, 1500);

  await ensureDemoBucket(page);
  await demoPause(page, 800);
  await openBucket(page);
  await demoPause(page, 1000);

  await page.locator('aside').getByRole('button', { name: 'Stats Dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Real-Time Performance Metrics' })).toBeVisible();
  await demoPause(page, 1800);
  await closePerformanceMetrics(page);

  await page.getByRole('button', { name: 'Developer Tools' }).click();
  await expect(page.getByRole('heading', { name: 'Developer Tools Hub' })).toBeVisible();
  await demoPause(page, 1000);
  await page.getByRole('button', { name: 'Generate Batch', exact: true }).click();
  await page.getByRole('dialog', { name: 'Fake Data Generator' }).waitFor();

  await page.locator('select').first().selectOption(DEMO_BUCKET);
  await page.getByLabel('Object count').fill('40');
  await demoPause(page, 800);
  await page.getByRole('button', { name: /Generate 40 files/i }).click();
  await page.getByText(/Generated 40 object/i).waitFor({ state: 'visible', timeout: 120_000 });
  await demoPause(page, 1200);

  await page.locator('aside').getByRole('button', { name: 'Stats Dashboard', exact: true }).click();
  await expect(page.getByText('Requests / sec')).toBeVisible();
  await demoPause(page, 2500);

  await closePerformanceMetrics(page);
  await page.getByRole('button', { name: /Activity Log/i }).click();
  await demoPause(page, 1800);

  await page.getByRole('button', { name: 'Explorer' }).click();
  await page.getByRole('row', { name: /record-1\.json/i }).first().click();
  await expect(page.getByText('Object Inspector')).toBeVisible();
  await page.getByRole('button', { name: 'Preview' }).click();
  await demoPause(page, 2500);

  await page.getByRole('button', { name: 'Developer Tools' }).click();
  await expect(page.getByRole('heading', { name: 'Developer Tools Hub' })).toBeVisible();
  await demoPause(page, 1500);

  await page.getByRole('button', { name: 'Explorer' }).click();
  await demoPause(page, 800);
  await page.getByRole('button', { name: /^LocalStack S3/i }).first().click();
  await demoPause(page, 1200);
  await page.getByRole('button', { name: /^GCS Emulator/i }).first().click();
  await demoPause(page, 1500);

  await demoPause(page, 2000);
});
