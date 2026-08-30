import { access, readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const zipPath = resolve('dist/site/downloads/say-the-action.zip');
const configPath = resolve('dist/site/staticwebapp.config.json');
const outputPath = resolve('.output');

const metadata = await stat(zipPath);
if (metadata.size < 1_000) throw new Error(`Extension download is unexpectedly small (${metadata.size} bytes): ${zipPath}`);
const signature = (await readFile(zipPath)).subarray(0, 4).toString('binary');
if (signature !== 'PK\x03\x04') throw new Error(`Extension download is not a ZIP file: ${zipPath}`);
const outputZip = (await readdir(outputPath)).find((name) => name.endsWith('.zip'));
if (!outputZip) throw new Error('Packaged extension ZIP is missing from .output.');
const [downloadBytes, packagedBytes] = await Promise.all([readFile(zipPath), readFile(resolve(outputPath, outputZip))]);
if (!downloadBytes.equals(packagedBytes)) {
  throw new Error('Stable download is not byte-for-byte identical to the packaged extension ZIP.');
}
try {
  await execFileAsync('unzip', ['-tqq', zipPath]);
} catch (error) {
  throw new Error(`Extension download ZIP integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
}

await access(configPath);
const config = JSON.parse(await readFile(configPath, 'utf8'));
if (!config.navigationFallback?.exclude?.includes('/downloads/*')) {
  throw new Error('Static-host fallback must exclude /downloads/* so a missing ZIP returns 404 instead of HTML.');
}
const downloadRoute = config.routes?.find((route) => route.route === '/downloads/*');
if (downloadRoute?.headers?.['Content-Type'] !== 'application/zip') {
  throw new Error('Static-host download route must declare application/zip.');
}
if (!config.globalHeaders?.['Permissions-Policy'] || !config.globalHeaders?.['Content-Security-Policy']) {
  throw new Error('Static-host response policy headers are missing.');
}

console.log(`Verified deployable extension ZIP (${metadata.size} bytes) and static-host download policy.`);
