import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.VERCEL === '1') {
  const manifest = {};
  async function scan(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await scan(file);
      else manifest[path.relative(root, file).split(path.sep).join('/')] = true;
    }
  }
  await scan(path.join(root, 'assets'));
  await fs.mkdir(path.join(root, 'public'), { recursive: true });
  await fs.cp(path.join(root, 'assets'), path.join(root, 'public/assets'), { recursive: true });
  // The platform reserves /_next/image even with custom rewrites. Point the
  // deployment's archived image loader at our equivalent image endpoint.
  for (const file of Object.keys(manifest).filter(file => file.endsWith('.js'))) {
    const target = path.join(root, 'public', file);
    const source = await fs.readFile(target, 'utf8');
    if (source.includes('/_next/image')) await fs.writeFile(target, source.replaceAll('/_next/image', '/api/reference-image'));
  }
  await fs.writeFile(path.join(root, 'reference-assets.json'), JSON.stringify(manifest));
  console.log('Prepared ' + Object.keys(manifest).length + ' assets for Vercel static delivery.');
}
