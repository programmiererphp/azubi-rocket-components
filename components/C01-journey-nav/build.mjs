import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = new URL('./', import.meta.url);
const locales = await readFile(new URL('src/locales.js', base), 'utf8');
const main = await readFile(new URL('src/index.js', base), 'utf8');
const output = '// Azubi Rocket C01 v0.1.0 — deterministic standalone ESM\n' + locales + '\n' +
  main.replace("import { LOCALES } from './locales.js';\n", '');
await mkdir(new URL('dist/', base), { recursive: true });
await writeFile(new URL('dist/index.js', base), output);
const hash = createHash('sha256').update(output).digest('hex');
const manifestPath = new URL('manifest.json', base);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.entrypoints.sha256 = hash;
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ component: 'C01', bytes: Buffer.byteLength(output), sha256: hash }));
