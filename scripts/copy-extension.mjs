import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('.output');
const zip = (await readdir(output)).find((name) => name.endsWith('.zip'));
if (!zip) throw new Error('WXT did not produce an extension zip');
await mkdir(resolve('dist/site/downloads'), { recursive: true });
await copyFile(resolve(output, zip), resolve('dist/site/downloads/say-the-action.zip'));
