import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('@claim:packaged-download serves a real extension ZIP', async ({ request }) => {
  const response = await request.get('/downloads/say-the-action.zip');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toMatch(/^application\/(zip|x-zip-compressed)/i);
  expect((await response.body()).subarray(0, 4).toString('binary')).toBe('PK\x03\x04');
  const manifest = JSON.parse(await readFile('.output/chrome-mv3/manifest.json', 'utf8')) as { manifest_version: number; name: string };
  expect(manifest).toMatchObject({ manifest_version: 3, name: 'Say the Action' });
});

test('@claim:exact-approved-phrase runs only the exact typed sample phrase', async ({ page }) => {
  await page.goto('/?demo=1#workspace');
  await page.getByLabel('Or type an exact phrase').fill('focus the ticket search');
  await page.getByRole('button', { name: 'Run phrase' }).click();
  await expect(page.getByText('No approved phrase matched. Nothing ran.')).toBeVisible();
  await page.getByLabel('Or type an exact phrase').fill('focus ticket search');
  await page.getByRole('button', { name: 'Run phrase' }).click();
  await expect(page.getByText('Done: Focus the ticket search field.')).toBeVisible();
  await expect(page.getByLabel('Ticket search')).toBeFocused();
});

test('@claim:demo-isolation keeps sample changes separate and discards them on exit', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sb_license:intent-voice-macros', 'real-license-kept'));
  await page.goto('/?demo=1&license=must-not-be-saved#workspace');
  await expect(page).toHaveTitle('Demo — Say the Action');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Demo — Say the Action');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://intent-voice-macros.sociobot.in/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByLabel('Or type an exact phrase').fill('delete draft reply');
  await page.getByRole('button', { name: 'Run phrase' }).click();
  await page.getByRole('button', { name: 'Run action' }).click();
  await expect(page.locator('#sample-draft')).toBeHidden();
  await page.reload();
  await expect(page.locator('#sample-draft')).toBeHidden();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#sample-draft')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sb_license:intent-voice-macros'))).toBe('real-license-kept');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem('demo:intent-voice-macros:workspace'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:intent-voice-macros'))).toBe('real-license-kept');
});

test('@claim:no-tracking-audio keeps demo traffic same-origin and requests no audio permission', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/?demo=1#workspace');
  await page.getByLabel('Or type an exact phrase').fill('focus ticket search');
  await page.getByRole('button', { name: 'Run phrase' }).click();
  const expectedOrigin = new URL(baseURL!).origin;
  expect([...new Set(requests.map((url) => new URL(url).origin))]).toEqual([expectedOrigin]);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.every((key) => key.startsWith('demo:'))).toBe(true);
  const manifest = JSON.parse(await readFile('.output/chrome-mv3/manifest.json', 'utf8')) as { permissions?: string[] };
  expect(manifest.permissions).not.toContain('audioCapture');
  expect(manifest.permissions).not.toContain('microphone');
  expect((manifest as { host_permissions?: string[] }).host_permissions ?? []).toEqual([]);
});

test('@claim:no-audio-page-storage keeps speech, analytics, and page content out of persisted sample data', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.addInitScript(() => {
    class RecognitionMock {
      lang = '';
      continuous = false;
      interimResults = false;
      processLocally = false;
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null = null;
      onerror = null;
      onend = null;
      constructor() { (window as unknown as { __privacyRecognition: RecognitionMock }).__privacyRecognition = this; }
      start() {}
      stop() {}
    }
    Object.defineProperty(window, 'SpeechRecognition', { value: RecognitionMock });
  });
  await page.goto('/?demo=1#workspace');
  const privatePageMarker = 'PRIVATE SUPPORT NOTE: member 1842 uses a replacement keyboard.';
  await page.locator('#sample-draft').evaluate((element, marker) => element.append(` ${marker}`), privatePageMarker);
  await page.getByRole('button', { name: 'Press to talk' }).click();
  await page.evaluate(() => {
    const recognition = (window as unknown as {
      __privacyRecognition: { onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null };
    }).__privacyRecognition;
    recognition.onresult?.({ results: [{ 0: { transcript: 'focus ticket search' } }] });
  });
  await expect(page.getByText('Done: Focus the ticket search field.')).toBeVisible();
  await expect(page.getByLabel('Ticket search')).toBeFocused();

  const persisted = await page.evaluate(() => {
    const key = 'demo:intent-voice-macros:workspace';
    return { keys: Object.keys(localStorage), state: JSON.parse(localStorage.getItem(key) ?? 'null') };
  });
  expect(persisted.keys).toEqual(['demo:intent-voice-macros:workspace']);
  expect(Object.keys(persisted.state).sort()).toEqual(['commands', 'draftPresent', 'logs']);
  expect(persisted.state.commands).toEqual(expect.arrayContaining([
    { phrase: 'focus ticket search', label: 'Focus the ticket search field', kind: 'focus' }
  ]));
  expect(persisted.state.logs[0]).toEqual({ phrase: 'focus ticket search', result: 'ran' });
  expect(persisted.state.logs.every((entry: Record<string, unknown>) => Object.keys(entry).sort().join(',') === 'phrase,result')).toBe(true);
  expect(JSON.stringify(persisted.state)).not.toContain(privatePageMarker);
  const expectedOrigin = new URL(baseURL!).origin;
  expect([...new Set(requests.map((url) => new URL(url).origin))]).toEqual([expectedOrigin]);
});

test('@claim:push-to-talk-speech starts only on press and requests local processing when available', async ({ page }) => {
  await page.addInitScript(() => {
    class RecognitionMock {
      lang = '';
      continuous = false;
      interimResults = false;
      processLocally = false;
      starts = 0;
      onresult = null;
      onerror = null;
      onend = null;
      constructor() { (window as unknown as { __recognitionInstance: RecognitionMock }).__recognitionInstance = this; }
      start() { this.starts += 1; }
      stop() {}
    }
    Object.defineProperty(window, 'SpeechRecognition', { value: RecognitionMock });
  });
  await page.goto('/?demo=1#workspace');
  const before = await page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>('#demo-listen')!;
    return { pressed: button.getAttribute('aria-pressed'), label: button.textContent };
  });
  expect(before).toEqual({ pressed: 'false', label: 'Press to talk' });
  await page.getByRole('button', { name: 'Press to talk' }).click();
  await expect(page.getByRole('button', { name: 'Listening—press to stop' })).toHaveAttribute('aria-pressed', 'true');
  const recognition = await page.evaluate(() => {
    const instance = (window as unknown as { __recognitionInstance: { processLocally: boolean; starts: number } }).__recognitionInstance;
    return { processLocally: instance.processLocally, starts: instance.starts };
  });
  expect(recognition).toEqual({ processLocally: true, starts: 1 });
});

test('@claim:offline-reload reloads the sample workspace offline after one visit', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/?demo=1#workspace`);
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 10_000 }).catch(async () => {
      await page.reload();
      await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
    });
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.getByText('The saved page and sample workspace still work.')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:one-time-license uses the production billing path and handles rate limits', async ({ page }) => {
  let verifyRequest = '';
  await page.route('https://api.sociobot.in/**', async (route) => {
    verifyRequest = route.request().url();
    await route.fulfill({
      status: 429,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Retry-After',
        'Retry-After': '120'
      },
      body: ''
    });
  });
  await page.goto('/?license=fixture-token');
  await expect(page).not.toHaveURL(/license=/);
  expect(await page.evaluate(() => localStorage.getItem('sb_license:intent-voice-macros'))).toBe('fixture-token');
  await expect(page.locator('#license-status')).toHaveText('Too many license checks. Try again in 120 seconds.');
  expect(verifyRequest).toContain('https://api.sociobot.in/api/v1/products/intent-voice-macros/verify?license=fixture-token');
  await expect(page.getByText('There is no subscription.')).toBeVisible();
  await expect(page.locator('#buy-link')).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/intent-voice-macros/checkout');
  await expect(page.locator('#buy-link')).toContainText('$19');
});
