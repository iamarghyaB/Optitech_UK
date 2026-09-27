import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
let checked = 0;
async function scan(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await scan(file); continue; }
    checked++;
    const stat = await fs.stat(file);
    if (!stat.size) problems.push({ file: path.relative(root, file), issue: 'empty asset' });
    else if (stat.size < 1024) {
      const text = await fs.readFile(file, 'utf8');
      if (text.startsWith('version https://git-lfs.github.com/spec/v1')) {
        problems.push({ file: path.relative(root, file), issue: 'Git LFS pointer instead of media' });
      }
    }
  }
}
await scan(path.join(root, 'assets'));
const downloads = JSON.parse(await fs.readFile(path.join(root, 'research/downloads.json'), 'utf8'));
const extras = JSON.parse(await fs.readFile(path.join(root, 'research/extra-downloads.json'), 'utf8'));
const expected = new Set([
  ...Object.values(downloads).filter(entry => entry.type === 'asset').map(entry => entry.file),
  ...extras.filter(entry => !entry.error).map(entry => entry.file),
]);
for (const file of expected) {
  try { await fs.access(path.join(root, file)); }
  catch { problems.push({ file, issue: 'missing asset from download inventory' }); }
}
if (problems.length) {
  console.error(`Asset check failed: ${problems.length} problem(s).`);
  for (const item of problems.slice(0, 20)) console.error(`${item.issue}: ${item.file}`);
  if (problems.length > 20) console.error(`...and ${problems.length - 20} more.`);
  console.error('Restore cached media with: git lfs checkout');
  console.error('If objects are not cached, download them with: git lfs pull');
  process.exitCode = 1;
} else {
  console.log(`Asset check passed: ${checked} files; no missing, empty, or unresolved Git LFS assets.`);
}
