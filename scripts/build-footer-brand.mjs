import fs from 'node:fs/promises';
import { elementBounds, patchFactory, patchFunction } from './portfolio-archive.mjs';

const brand = JSON.parse(await fs.readFile('content/footer-brand.json', 'utf8'));
const gradient = { id: 'optitech-footer-gradient', x1: '3046.42', y1: '755.966', x2: '521.751', y2: '-5.02912', gradientUnits: 'userSpaceOnUse' };
const tree = ['svg', { width: '100%', viewBox: '0 0 1920 686', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', role: 'img', 'aria-label': 'Optitech' }, [
  ['title', {}, ['Optitech']],
  ['path', { ...brand.background, fill: 'url(#optitech-footer-gradient)' }],
  ['path', { ...brand.foreground, fill: '#434343' }],
  ['path', { d: 'M640 429H0V435H640V429Z', fill: '#009246' }],
  ['path', { d: 'M1280 429H640V435H1280V429Z', fill: 'white' }],
  ['path', { d: 'M1920 429H1280V435H1920V429Z', fill: '#CE2B37' }],
  ['defs', {}, [['linearGradient', gradient, [['stop', { stopColor: '#434343' }], ['stop', { offset: '1', stopColor: '#EFEFEF' }]]]]],
]];
const attribute = key => ({ stopColor: 'stop-color' }[key] || key);
function html(node) {
  if (typeof node === 'string') return node;
  const [tag, props, children = []] = node;
  return `<${tag}${Object.entries(props).map(([key, value]) => ` ${attribute(key)}="${value}"`).join('')}>${children.map(html).join('')}</${tag}>`;
}
function jsx(node, runtime) {
  if (typeof node === 'string') return JSON.stringify(node);
  const [tag, props, children = []] = node;
  const body = Object.entries(props).map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`);
  if (children.length) body.push(`children:${children.length === 1 ? jsx(children[0], runtime) : `[${children.map(child => jsx(child, runtime)).join(',')}]`}`);
  return `(0,${runtime}.${children.length > 1 ? 'jsxs' : 'jsx'})(${JSON.stringify(tag)},{${body.join(',')}})`;
}
const svg = html(tree);
await fs.mkdir('assets/local', { recursive: true });
await fs.writeFile('assets/local/optitech-footer.svg', svg + '\n');
const routes = JSON.parse(await fs.readFile('routes.json', 'utf8'));
let pages = 0;
for (const { html: file } of Object.values(routes)) {
  const source = await fs.readFile(file, 'utf8');
  const footer = source.indexOf('<footer');
  if (footer < 0) continue;
  const start = source.indexOf('<svg', footer);
  const [, end] = elementBounds(source, start, 'svg');
  if (!source.slice(start, end).includes('viewBox="0 0 1920 686"')) throw new Error(`Unexpected footer artwork: ${file}`);
  await fs.writeFile(file, source.slice(0, start) + svg + source.slice(end));
  pages++;
}
for (const [file, name, runtime] of [
  ['0ndy1i9m_~.sw.js', 'o', 't'],
  ['0xhnisy4i1o1s.js', 'c', 'e'],
  ['0zb9pymy317.5.js', 'c', 'e'],
]) {
  const path = `assets/site/_next/static/chunks/${file}`;
  const source = await fs.readFile(path, 'utf8');
  const updated = patchFactory(source, 865969, factory => patchFunction(factory, name, () => `function ${name}(){return ${jsx(tree, runtime)}}`));
  await fs.writeFile(path, updated);
}
console.log(`Optitech footer artwork updated across ${pages} pages and 3 browser bundles.`);
