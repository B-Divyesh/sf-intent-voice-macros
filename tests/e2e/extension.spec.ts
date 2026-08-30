import { expect, test, chromium, type Browser } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

declare const chrome: any;

test('@claim:json-export @claim:keyboard-access packaged settings keep ten free commands and export JSON', async ({}, testInfo) => {
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
      if (index === 1) {
        await page.getByRole('button', { name: 'Add command' }).focus();
        await page.keyboard.press('Enter');
      } else await page.getByRole('button', { name: 'Add command' }).click();
      await expect(page.locator('#status')).toHaveText(`Added “focus ${index}” for example.com.`);
    }
    await expect(page.getByText('10 / 10')).toBeVisible();

    await page.getByLabel('Phrase you’ll say').fill('one too many');
    await page.getByLabel('Action label').fill('One too many');
    await page.getByLabel('CSS selector').fill('#search');
    await page.getByRole('button', { name: 'Add command' }).click();
    await expect(page.locator('#status')).toHaveText('This website already has 10 commands. Delete one or unlock more room.');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export setup' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^say-the-action-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await download.path();
    expect(path).not.toBeNull();
    const exported = JSON.parse(await (await import('node:fs/promises')).readFile(path!, 'utf8')) as { version: number; macros: unknown[]; logs: unknown[] };
    expect(exported.version).toBe(1);
    expect(exported.macros).toHaveLength(10);
    expect(exported.logs).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('@claim:risky-confirmation @claim:local-action-data runs a real focus action and keeps delete behind cancel or confirm', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'the action harness runs once in Chromium');
  const extensionPath = resolve('.output-test/chrome-mv3');
  const debuggingPort = 9337;
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      `--remote-debugging-port=${debuggingPort}`
    ]
  });
  let cdpBrowser: Browser | undefined;
  try {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const site = '127.0.0.1';
    const macros = [
      { id: 'focus', site, phrase: 'focus ticket search', label: 'Focus ticket search', kind: 'focus', selector: '#sample-search', confirm: false, createdAt: 1 },
      { id: 'delete', site, phrase: 'delete draft reply', label: 'Delete draft reply', kind: 'click', selector: '#sample-delete', confirm: false, createdAt: 2 },
      { id: 'submit', site, phrase: 'submit form', label: 'Submit form', kind: 'click', selector: '#demo-form button[type="submit"]', confirm: false, createdAt: 3 },
      { id: 'link', site, phrase: 'open checkout', label: 'Open checkout', kind: 'click', selector: '#buy-link', confirm: false, createdAt: 4 },
      { id: 'pay', site, phrase: 'pay invoice', label: 'Pay invoice', kind: 'click', selector: '#fixture-pay', confirm: false, createdAt: 5 },
      { id: 'publish', site, phrase: 'publish update', label: 'Publish update', kind: 'click', selector: '#fixture-publish', confirm: false, createdAt: 6 },
      { id: 'send', site, phrase: 'send reply', label: 'Send reply', kind: 'click', selector: '#fixture-send', confirm: false, createdAt: 7 },
      { id: 'signout', site, phrase: 'sign out', label: 'Sign out', kind: 'click', selector: '#fixture-signout', confirm: false, createdAt: 8 },
      { id: 'navigate', site, phrase: 'open account', label: 'Open account', kind: 'navigate', url: 'http://127.0.0.1:4173/account', confirm: false, createdAt: 9 }
    ];
    await worker.evaluate(async (items) => chrome.storage.local.set({ macros: items, logs: [] }), macros);

    const target = await context.newPage();
    await target.goto('http://127.0.0.1:4173/?demo=1#workspace');
    await target.evaluate(() => {
      for (const [id, text] of [['fixture-pay', 'Pay invoice'], ['fixture-publish', 'Publish update'], ['fixture-send', 'Send reply'], ['fixture-signout', 'Sign out']] as const) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.addEventListener('click', () => { button.dataset.ran = 'true'; });
        document.body.append(button);
      }
    });
    await target.bringToFront();
    await worker.evaluate(() => chrome.action.openPopup());

    cdpBrowser = await chromium.connectOverCDP(`http://127.0.0.1:${debuggingPort}`);
    const popup = cdpBrowser.contexts().flatMap((item) => item.pages()).find((item) => item.url().includes('popup.html'));
    expect(popup, 'the real extension popup target opens').toBeTruthy();
    await expect(popup!.locator('#site-badge')).toHaveText(site);

    await popup!.getByRole('button', { name: /focus ticket search/i }).click();
    await expect(popup!.locator('#status')).toHaveText('Done: Focus ticket search.');
    await expect.poll(() => target.locator('#sample-search').evaluate((element) => document.activeElement === element)).toBe(true);

    for (const phrase of ['submit form', 'open checkout', 'pay invoice', 'publish update', 'send reply', 'sign out', 'open account']) {
      await popup!.getByRole('button', { name: new RegExp(phrase, 'i') }).click();
      await expect(popup!.getByRole('dialog')).toBeVisible();
      await popup!.getByRole('button', { name: 'Cancel' }).click();
      await expect(popup!.locator('#status')).toHaveText('Cancelled. Nothing happened.');
    }
    for (const selector of ['#fixture-pay', '#fixture-publish', '#fixture-send', '#fixture-signout']) {
      await expect(target.locator(selector)).not.toHaveAttribute('data-ran', 'true');
    }

    await popup!.getByRole('button', { name: /delete draft reply/i }).click();
    await expect(popup!.getByRole('dialog')).toBeVisible();
    await expect(popup!.getByText(/will Delete draft reply on 127\.0\.0\.1/)).toBeVisible();
    await popup!.getByRole('button', { name: 'Cancel' }).click();
    await expect(target.locator('#sample-draft')).toBeVisible();
    await expect(popup!.locator('#status')).toHaveText('Cancelled. Nothing happened.');

    await popup!.getByRole('button', { name: /delete draft reply/i }).click();
    await popup!.getByRole('button', { name: 'Run action' }).click();
    await expect(target.locator('#sample-draft')).toBeHidden();
    const stored = await worker.evaluate(async () => chrome.storage.local.get(['macros', 'logs']));
    expect(stored.macros).toHaveLength(9);
    expect(stored.logs.map((entry: { result: string }) => entry.result)).toEqual(expect.arrayContaining(['ran', 'cancelled']));
    expect(Object.keys(stored).sort()).toEqual(['logs', 'macros']);
  } finally {
    if (cdpBrowser) await cdpBrowser.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
});
