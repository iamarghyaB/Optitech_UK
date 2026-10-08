import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { archivedPriceReplacements } from '../content/services.mjs';
import { createRequire } from 'node:module';
const acorn = createRequire(import.meta.url)('next/dist/compiled/acorn/acorn.js');
const normalise = source => archivedPriceReplacements.reduce((text, [before, after]) => text.replaceAll(before, after), source.replaceAll('\r\n', '\n'));
const baseline = file => normalise(execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
function bounds(source, start) {
  const token = /<\/?div\b[^>]*>/g; token.lastIndex = start;
  let depth = 0, match;
  while ((match = token.exec(source))) { depth += match[0].startsWith('</') ? -1 : 1; if (!depth) return [start, token.lastIndex]; }
  throw new Error('Unbalanced homepage section');
}
function unrelatedMain(html) {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>') + 7);
  const start = main.indexOf('<div class="mt-30 md:mt-60 w-screen relative z-10"');
  const rowStart = main.lastIndexOf('<div ', main.indexOf('flex flex-col home-projects'));
  assert(start > 0 && rowStart > start);
  const [, end] = bounds(main, rowStart);
  return main.slice(0, start) + '<!-- service section -->' + main.slice(end);
}
const homeBefore = baseline('index.html'), homeAfter = normalise(await fs.readFile('index.html', 'utf8'));
assert.equal(unrelatedMain(homeAfter), unrelatedMain(homeBefore), 'All unrelated homepage section markup remains byte-identical');
function otherModules(source) {
  let factory;
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ArrayExpression') for (let index = 0; index < node.elements.length; index++) if (node.elements[index]?.value === 438942) factory = node.elements[index + 1];
    for (const value of Object.values(node)) if (value && typeof value === 'object') { if (Array.isArray(value)) value.forEach(walk); else walk(value); }
  }
  walk(acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' })); assert(factory);
  // Parentheses added around the replacement factory are not part of Acorn's range.
  let start = factory.start, end = factory.end;
  while (source[start - 1] === '(' && source[end] === ')') { start--; end++; }
  return source.slice(0, start) + 'SERVICE_FACTORY' + source.slice(end);
}
const file = 'assets/site/_next/static/chunks/068fq8h1ymnjo.js';
const currentModules = otherModules(normalise(await fs.readFile(file, 'utf8'))), originalModules = otherModules(baseline(file));
let difference = 0; while (difference < currentModules.length && currentModules[difference] === originalModules[difference]) difference++;
assert(currentModules === originalModules, `Neighbouring module changed at ${difference}: ${currentModules.slice(difference - 80, difference + 120)} / baseline: ${originalModules.slice(difference - 80, difference + 120)}`);
for (const file of ['assets/site/_next/static/chunks/0461f_cegkjv0.css', 'assets/site/_next/static/chunks/0o7s~nivrs1sq.css']) assert.equal(normalise(await fs.readFile(file, 'utf8')), baseline(file), 'Original global styles are unchanged');
const result = { date: new Date().toISOString(), unrelatedHomepageMarkupUnchanged: true, neighbouringAnimationModulesUnchanged: true, originalStylesUnchanged: true, allowedServicePriceCopyUpdates: archivedPriceReplacements };
await fs.writeFile('verification/services/home-preservation.json', JSON.stringify(result, null, 2));
console.log(result);
