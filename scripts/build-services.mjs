import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createElement, useRef } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { services, archivedPriceReplacements } from '../content/services.mjs';
import { createServiceRow, homeServicesModule } from '../components/services/home-directory.mjs';

const require = createRequire(import.meta.url);
const acorn = require('next/dist/compiled/acorn/acorn.js');
const directory = services.map(({ slug, title, category }) => ({ slug, title, category }));
const stylesheet = '/assets/local/home-directory.css';
const bridge = '/assets/local/native-navigation.js';

function rewriteFlight(source) {
  // Preserve non-JSON and length-prefixed text records byte-for-byte.
  return source.replace(/(^|\n)([\da-f]+):([^\n]*)/g, (record, newline, id, value) => {
    if (!value.startsWith('[') && !value.startsWith('{')) return record;
    let parsed;
    try { parsed = JSON.parse(value); } catch { return record; }
    let changed = false;
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node) && node[0] === '$' && node[1] === '$L28' && node[3]?.projects) { node[3].projects = directory; changed = true; return; }
      for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value);
    }
    walk(parsed);
    return changed ? `${newline}${id}:${JSON.stringify(parsed)}` : record;
  });
}
function elementBounds(source, start, tag = 'div') {
  const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g'); tokens.lastIndex = start;
  let depth = 0, match;
  while ((match = tokens.exec(source))) { depth += match[0].startsWith('</') ? -1 : 1; if (depth === 0) return [start, tokens.lastIndex]; }
  throw new Error(`Unclosed ${tag} at ${start}`);
}
function Scramble({ text }) {
  return jsxs('span', { className: 'relative inline-block max-w-full', children: [jsx('span', { className: 'invisible whitespace-normal break-words', children: text }), jsx('span', { className: 'sr-only', children: text }), jsx('span', { className: 'absolute left-0 top-0 w-full whitespace-normal break-words', 'aria-hidden': true, children: jsx('span', { className: '', children: text }) })] });
}
const Row = createServiceRow({ jsx, jsxs }, { useRef }, Scramble);
const markup = renderToStaticMarkup(createElement('div', { className: 'w-screen px-6 md:px-12 pt-32 md:pt-44 pb-20 md:pb-40 flex flex-col home-projects home-services-directory', id: 'services' }, createElement('div', { className: 'w-full flex flex-col xl:flex-row gap-8 xl:gap-0 mt-8' },
  ...[directory.slice(0, 4), directory.slice(4)].map((items, index) => createElement('div', { key: index, className: `w-full xl:w-1/2 flex flex-col gap-8 xl:${index ? 'pl' : 'pr'}-4` }, items.map(service => createElement(Row, { key: service.slug, service })))))));
let home = await fs.readFile('index.html', 'utf8');
const logo = home.match(/<svg\b[^>]*viewBox="0 0 356 266"[^>]*>[\s\S]*?<\/svg>/)?.[0];
assert(logo, 'Existing Optitech emblem must exist');
await fs.writeFile('assets/local/optitech-logo.svg', logo.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/xmlns="http:\/\/www.w3.org\/2000\/svg" /, ''));
const sectionStart = home.lastIndexOf('<div ', home.indexOf('flex flex-col home-projects'));
assert(sectionStart >= 0, 'Homepage service section must exist');
const [start, end] = elementBounds(home, sectionStart);
home = home.slice(0, start) + markup + home.slice(end);
const marqueeStart = home.lastIndexOf('<div class="mt-30 md:mt-60 w-screen relative z-10"', start);
assert(marqueeStart >= 0, 'Original section marquee must exist');
const [ms, me] = elementBounds(home, marqueeStart);
home = home.slice(0, ms) + home.slice(ms, me).replaceAll('Selected Work', 'What We Do').replaceAll('By Optitech · Demo reference', 'By Optitech') + home.slice(me);
home = home.replace(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g, (record, encoded) => `self.__next_f.push([1,${JSON.stringify(rewriteFlight(JSON.parse(encoded)))}])`);
await fs.writeFile('index.html', home);
const flight = await fs.readFile('pages/home.rsc', 'utf8');
assert(flight.includes('$L28'), 'Homepage Flight component reference must exist');
await fs.writeFile('pages/home.rsc', rewriteFlight(flight));

// Replace one module factory, leaving all neighbouring animation modules intact.
const chunk = 'assets/site/_next/static/chunks/068fq8h1ymnjo.js';
let code = await fs.readFile(chunk, 'utf8');
let factory;
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'ArrayExpression') node.elements.forEach((item, index) => { if (item?.value === 438942 && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.elements[index + 1]?.type)) factory = node.elements[index + 1]; });
  for (const value of Object.values(node)) if (value && typeof value === 'object') { if (Array.isArray(value)) value.forEach(visit); else visit(value); }
}
visit(acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }));
assert(factory, 'Expected original homepage client module');
const replacement = homeServicesModule.toString().replace('CREATE_SERVICE_ROW', `(${createServiceRow.toString()})`);
let factoryStart = factory.start, factoryEnd = factory.end;
while (code[factoryStart - 1] === '(' && code[factoryEnd] === ')') { factoryStart--; factoryEnd++; }
code = code.slice(0, factoryStart) + replacement + code.slice(factoryEnd);
acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
await fs.writeFile(chunk, code);

const marqueeChunk = 'assets/site/_next/static/chunks/0oo84nz.jrles.js';
let marqueeCode = await fs.readFile(marqueeChunk, 'utf8');
if (!marqueeCode.includes('e.serviceDirectory?')) marqueeCode = marqueeCode.replace('"By Optitech · Demo reference",a]', 'e.serviceDirectory?"By Optitech":"By Optitech · Demo reference",a]');
acorn.parse(marqueeCode, { ecmaVersion: 'latest', sourceType: 'module' });
await fs.writeFile(marqueeChunk, marqueeCode);

// Add a menu entry with the original row renderer; archive/native navigation is handled above.
const navChunk = 'assets/site/_next/static/chunks/08-om41l.yg-h.js';
let navCode = await fs.readFile(navChunk, 'utf8');
if (!navCode.includes('text:"Services",href:"/services"')) {
  const work = '(0,e.jsx)(N,{isMenuOpen:f,setIsOpen:h,closeSilently:m,text:"Work",href:"/work",onHoverSound:x})';
  assert(navCode.includes(work), 'Expected existing navigation row');
  navCode = navCode.replace(work, '(0,e.jsx)(N,{isMenuOpen:f,setIsOpen:h,closeSilently:m,text:"Services",href:"/services",onHoverSound:x}),' + work);
}
acorn.parse(navCode, { ecmaVersion: 'latest', sourceType: 'module' });
await fs.writeFile(navChunk, navCode);

for (const [file, runtime, link, marker, privacy] of [
  ['0ndy1i9m_~.sw.js', 't', 'l', 'children:[g,_,H,', 'H'],
  ['0xhnisy4i1o1s.js', 'e', 'r', 'children:[v,w,y,', 'y'],
  ['0zb9pymy317.5.js', 'e', 'i', 'children:[w,j,_,', '_'],
]) {
  const filePath = `assets/site/_next/static/chunks/${file}`;
  let footerCode = await fs.readFile(filePath, 'utf8');
  if (!footerCode.includes('href:"/services"')) {
    assert(footerCode.includes(marker), `Expected footer links in ${file}`);
    footerCode = footerCode.replace(marker, marker.slice(0, -privacy.length - 1) + `(0,${runtime}.jsx)(${link}.default,{href:"/services",className:"text-[#5E5E5E] tracking-tighter hover:text-[#434343] transition-colors duration-200 ease-out",children:"Services"}),${privacy},`);
    acorn.parse(footerCode, { ecmaVersion: 'latest', sourceType: 'module' });
    await fs.writeFile(filePath, footerCode);
  }
}

const routes = JSON.parse(await fs.readFile('routes.json', 'utf8'));
for (const { html: file } of Object.values(routes)) {
  let doc = await fs.readFile(file, 'utf8');
  const headerEnd = doc.indexOf('</header>');
  const header = doc.slice(0, headerEnd);
  if (!header.includes('href="/services"')) {
    const matches = [...header.matchAll(/<a\b[^>]*href="\/contact"[^>]*>[\s\S]*?<\/a>/g)];
    const row = matches.find(match => match[0].includes('nav-item'));
    assert(row, `Existing primary navigation missing in ${file}`);
    const workAt = header.indexOf('href="/work"');
    const workStart = header.lastIndexOf('<a', workAt);
    doc = doc.slice(0, workStart) + row[0].replace('href="/contact"', 'href="/services"').replace('>Contact</span>', '>Services</span>') + doc.slice(workStart);
  }
  if (!doc.includes(`href="${stylesheet}"`)) doc = doc.replace('</head>', `<link rel="stylesheet" href="${stylesheet}"/><script defer src="${bridge}"></script></head>`);
  // The footer contact link remains the working contact entry point. Add a services link beside it.
  const footerStart = doc.indexOf('<footer');
  if (footerStart >= 0) {
    const footerEnd = doc.indexOf('</footer>', footerStart);
    const footer = doc.slice(footerStart, footerEnd);
    if (!footer.includes('href="/services"')) {
      const at = footer.indexOf('href="/privacy-policy"');
      if (at >= 0) { const linkStart = footer.lastIndexOf('<a', at), bounds = elementBounds(footer, linkStart, 'a'); const original = footer.slice(...bounds); doc = doc.slice(0, footerStart + linkStart) + original.replace('href="/privacy-policy"', 'href="/services"').replace(/Privacy Policy|Privacy policy/g, 'Services') + doc.slice(footerStart + linkStart); }
    }
  }
  await fs.writeFile(file, doc);
}
await fs.copyFile('components/services/home-directory.css', 'assets/local/home-directory.css');
for (const [before, after] of archivedPriceReplacements) assert.equal(Buffer.byteLength(before), Buffer.byteLength(after), 'Archived price update must preserve Flight text record lengths');
const syncPrices = source => archivedPriceReplacements.reduce((text, [before, after]) => text.replaceAll(before, after), source);
for (const files of Object.values(routes)) for (const file of Object.values(files)) {
  const source = await fs.readFile(file, 'utf8'), updated = syncPrices(source);
  if (updated !== source) await fs.writeFile(file, updated);
}
for (const file of (await fs.readdir('assets/site/_next/static/chunks')).filter(file => file.endsWith('.js'))) {
  const target = `assets/site/_next/static/chunks/${file}`, source = await fs.readFile(target, 'utf8'), updated = syncPrices(source);
  if (updated !== source) { acorn.parse(updated, { ecmaVersion: 'latest', sourceType: 'module' }); await fs.writeFile(target, updated); }
}
console.log('Services directory: 8 rows; homepage SSR, Flight and one client module updated. Portfolio preserved.');
