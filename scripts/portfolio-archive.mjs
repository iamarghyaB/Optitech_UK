import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import NextImage from 'next/image.js';
const require = createRequire(import.meta.url);
const acorn = require('next/dist/compiled/acorn/acorn.js');
export function parse(source) { return acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' }); }
export function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) if (value && typeof value === 'object') Array.isArray(value) ? value.forEach(x => walk(x, visit)) : walk(value, visit);
}
export function factories(source) {
  const found = new Map();
  walk(parse(source), node => {
    if (node.type !== 'ArrayExpression') return;
    node.elements.forEach((item, i) => {
      if (!['ArrowFunctionExpression', 'FunctionExpression'].includes(item?.type)) return;
      const ids = [];
      for (let n = i - 1; n >= 0 && typeof node.elements[n]?.value === 'number'; n--) ids.unshift(node.elements[n].value);
      for (const id of ids) found.set(id, { node: item, ids, source: source.slice(item.start, item.end) });
    });
  });
  return found;
}
export function patchFactory(code, id, patch) {
  const found = factories(code).get(id);
  if (!found) throw new Error(`Archived module ${id} missing`);
  const replacement = patch(found.source);
  parse(`(${replacement})`);
  return code.slice(0, found.node.start) + replacement + code.slice(found.node.end);
}
export function patchFunction(code, name, transform) {
  let fn;
  walk(parse(`(${code})`), n => { if (n.type === 'FunctionDeclaration' && n.id?.name === name) fn = n; });
  if (!fn) throw new Error(`Archived function ${name} missing`);
  const start = fn.start - 1, end = fn.end - 1;
  return code.slice(0, start) + transform(code.slice(start, end)) + code.slice(end);
}
export function elementBounds(source, start, tag = 'div') {
  const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g'); tokens.lastIndex = start;
  let depth = 0, match;
  while ((match = tokens.exec(source))) { depth += match[0].startsWith('</') ? -1 : 1; if (depth === 0) return [start, tokens.lastIndex]; }
  throw new Error(`Unclosed ${tag} at ${start}`);
}

// Only animation hooks are inert on the server. Presentation components are
// evaluated from the same factories the browser loads, including ProjectItem.
export async function serverModules() {
  const moduleMap = new Map();
  for (const file of ['0mev8.m5ulcaj.js', '0fm1kie0c60_p.js', '0oo84nz.jrles.js', '04et1ujm.1ogt.js']) {
    for (const [id, entry] of factories(await fs.readFile(`assets/site/_next/static/chunks/${file}`, 'utf8'))) moduleMap.set(id, entry);
  }
  const values = new Map();
  const motionValue = value => ({ get: () => value, set() {}, on() {} });
  const motion = new Proxy({}, { get: (_, tag) => ({ children, style, ...props }) => {
    const clean = Object.fromEntries(Object.entries(props).filter(([key]) => !key.startsWith('on') && !['drag', 'dragConstraints', 'dragElastic', 'dragMomentum'].includes(key)));
    if (style?.x?.get) style = { ...style, x: undefined, transform: `translateX(${style.x.get()}px)` };
    return React.createElement(tag, { ...clean, style }, children);
  } });
  const Scramble = ({ text }) => jsxRuntime.jsxs('span', { className: 'relative inline-block max-w-full', children: [jsxRuntime.jsx('span', { className: 'invisible whitespace-normal break-words', children: text }), jsxRuntime.jsx('span', { className: 'sr-only', children: text }), jsxRuntime.jsx('span', { className: 'absolute left-0 top-0 w-full whitespace-normal break-words', 'aria-hidden': true, children: jsxRuntime.jsx('span', { className: '', children: text }) })] });
  const shims = {
    819009: jsxRuntime, 451873: { c: n => Array(n).fill(Symbol.for('react.memo_cache_sentinel')) },
    137686: { ...React, default: React }, 625555: { default: NextImage.default || NextImage },
    325707: { default: ({ children, className, style, repeat = 3, direction = 'right' }) => jsxRuntime.jsx('div', { className: ['flex', ['left', 'right'].includes(direction) ? 'flex-row' : 'flex-col', className].filter(Boolean).join(' '), style, children: Array.from({ length: repeat }, (_, i) => jsxRuntime.jsx('div', { className: 'shrink-0 flex', style: { transform: 'none' }, 'aria-hidden': i > 0, children }, i)) }) },
    766993: { cn: (...args) => args.filter(Boolean).join(' '), getContrastTextColor: () => '#434343' },
    554300: { urlForImage: image => image?.asset?.url ? { url: () => image.asset.url, width() { return this; }, height() { return this; } } : undefined },
    641307: { useLenis: () => null }, 954528: { useRouter: () => ({ prefetch() {}, push() {} }) },
    807880: { useMediaQuery: () => false }, 348280: { default() {} },
    911269: { motion }, 38914: { useMotionValue: motionValue }, 469891: { useTransform: (value, fn) => motionValue(typeof fn === 'function' ? fn(value.get()) : 0) },
    659593: { useVelocity: () => motionValue(0) }, 923801: { useSpring: () => motionValue(0) },
    62216: { useAnimationFrame() {} },
    683261: { PortableText: ({ value }) => value.map(block => React.createElement('p', { key: block._key }, block.children?.map(child => child.text).join(''))) },
  };
  function get(id) {
    if (shims[id]) return shims[id];
    if (values.has(id)) return values.get(id);
    const entry = moduleMap.get(id);
    if (!entry) return new Proxy({ default: () => null }, { get: (target, key) => target[key] || (() => null) });
    for (const key of entry.ids) values.set(key, {});
    const factory = new Function(`return (${entry.source})`)();
    factory({ i: get, A: () => Promise.resolve({ default: () => null }), s(exports, target = entry.ids[0]) { const out = values.get(target); for (let i = 0; i < exports.length; i += 3) out[exports[i]] = exports[i + 1] === 0 ? exports[i + 2] : exports[i + 2](); } });
    return values.get(id);
  }
  return get;
}
