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
  await fs.writeFile(path.join(root, 'reference-assets.json'), JSON.stringify(manifest));
  console.log('Prepared ' + Object.keys(manifest).length + ' assets for Vercel static delivery.');
}
