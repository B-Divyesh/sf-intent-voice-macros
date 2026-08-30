import { readFile } from 'node:fs/promises';

const runtimeFiles = [
  'site/index.html',
  'site/main.ts',
  'entrypoints/options/index.html',
  'entrypoints/options/main.ts',
  'entrypoints/popup/index.html',
  'entrypoints/popup/main.ts',
  'lib/billing.ts',
  'lib/license.ts',
  'public/_headers',
  'public/staticwebapp.config.json'
];
const runtime = (await Promise.all(runtimeFiles.map((path) => readFile(path, 'utf8')))).join('\n');
if (runtime.includes('pilot-api.sociobot.in')) throw new Error('Runtime source contains the staging billing host.');

const claims = JSON.parse(await readFile('.factory/claims.json', 'utf8'));
if (!Array.isArray(claims) || claims.length === 0) throw new Error('Claims manifest is empty.');
const testSource = (await Promise.all([
  readFile('tests/unit/core.test.ts', 'utf8'),
  readFile('tests/e2e/claims.spec.ts', 'utf8'),
  readFile('tests/e2e/extension.spec.ts', 'utf8'),
  readFile('tests/e2e/site.spec.ts', 'utf8')
])).join('\n');
const ids = new Set();
for (const claim of claims) {
  if (!claim.id || !claim.claim || !claim.where || !claim.test || !claim.sandbox) throw new Error(`Incomplete claim: ${JSON.stringify(claim)}`);
  if (ids.has(claim.id)) throw new Error(`Duplicate claim id: ${claim.id}`);
  ids.add(claim.id);
  const matches = testSource.match(new RegExp(`@claim:${claim.id}(?![a-z0-9-])`, 'g')) ?? [];
  if (matches.length !== 1) throw new Error(`Claim ${claim.id} must have exactly one tagged test; found ${matches.length}.`);
}

for (const path of ['site/index.html', 'site/privacy/index.html', 'site/terms/index.html', 'site/404.html']) {
  const html = await readFile(path, 'utf8');
  const required = [/<html lang="en">/, /<title>[^<]+<\/title>/, /<main\b/, /rel="canonical"/, /property="og:image"/, /name="twitter:card"/, /rel="apple-touch-icon"/];
  if (required.some((pattern) => !pattern.test(html))) throw new Error(`${path} is missing required page metadata or structure.`);
  if ((html.match(/<h1\b/g) ?? []).length !== 1) throw new Error(`${path} must contain exactly one h1.`);
}

console.log(`Content lint passed for ${claims.length} claims and four site routes.`);
