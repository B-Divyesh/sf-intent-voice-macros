import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const seriousAxeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page: page as never }).analyze();
  return results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''));
};

test('landing page has plain audience copy, keyboard structure, and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle('Say the Action — browser actions by voice');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Run approved browser actions by voice');
  await expect(page.getByText(/limited keyboard or mouse access/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  expect(await seriousAxeViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('legal pages share navigation, metadata, and semantic structure', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('header nav')).toBeVisible();
    await expect(page.locator('footer nav')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.png$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    expect(await seriousAxeViolations(page)).toEqual([]);
  }
});

test('designed 404 and static response override are complete', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Say the Action');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This action has no page');
  await expect(page.getByRole('link', { name: 'Return to the home page' })).toBeVisible();
  const config = JSON.parse(await readFile('dist/site/staticwebapp.config.json', 'utf8')) as { responseOverrides?: Record<string, { rewrite?: string }> };
  expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');
  expect(await seriousAxeViolations(page)).toEqual([]);
});

test('390px layout has no horizontal overflow and keeps the demo action visible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only assertion');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('dark and reduced-motion treatments remain accessible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'one dark-theme pass is sufficient');
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/?demo=1#workspace');
  expect(await seriousAxeViolations(page)).toEqual([]);
  const animation = await page.locator('.mic-dot').evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(animation)).toBeLessThanOrEqual(0.01);
});
