import { expect, test, chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

test('packaged MV3 settings rejects unusable hostnames and keeps ten free commands usable at 390px', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'the test creates its own 390px extension context');
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to command setup' })).toBeFocused();
    await page.getByLabel('Website hostname').fill('example.com:443');
    await page.getByLabel('Phrase you’ll say').fill('port command');
    await page.getByLabel('Action label').fill('Port command');
    await page.getByLabel('CSS selector').fill('#search');
    await page.getByRole('button', { name: 'Add command' }).click();
    await expect(page.locator('#status')).toHaveText('Enter only a hostname such as example.com, without https://, a port, or a page path.');

    for (let index = 1; index <= 10; index += 1) {
      await page.getByLabel('Website hostname').fill('example.com');
      await page.getByLabel('Phrase you’ll say').fill(`focus ${index}`);
      await page.getByLabel('Action label').fill(`Focus ${index}`);
      await page.getByLabel('CSS selector').fill('#search');
      await page.getByRole('button', { name: 'Add command' }).click();
      await expect(page.locator('#status')).toHaveText(`Added “focus ${index}” for example.com.`);
    }
    await expect(page.getByText('10 / 10')).toBeVisible();

    await page.getByLabel('Phrase you’ll say').fill('one too many');
    await page.getByLabel('Action label').fill('One too many');
    await page.getByLabel('CSS selector').fill('#search');
    await page.getByRole('button', { name: 'Add command' }).click();
    await expect(page.locator('#status')).toHaveText('This website already has 10 commands. Delete one or unlock more room.');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
