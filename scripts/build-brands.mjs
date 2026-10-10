import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { brands, brandsHeading, brandsDescription, brandRotation } from '../content/brands.mjs';
import { patchFactory, elementBounds } from './portfolio-archive.mjs';

const oldDescription = [
  'Platforms & Technologies We Work With. ',
  'WordPress, Shopify, Google, Meta, Stripe, PayPal, ',
  'React, Next.js and Vercel. Chosen for your goals.',
];
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const brand of brands) await fs.access(brand.src.slice(1));
const chunk = 'assets/site/_next/static/chunks/068fq8h1ymnjo.js';
const current = await fs.readFile(chunk, 'utf8');
const updated = patchFactory(current, 694911, source => {
  // Change data and image delivery only. The original GSAP animation remains intact.
  source = source.replace(/B=Array\.from\(\{length:50\},\(e,t\)=>t\)\.filter\(e=>!x\.has\(e\)\)\.map\(e=>`[^`]+`\)/, 'B=' + JSON.stringify(brandRotation));
  if (source.includes('/assets/brands/')) {
    source = source.replace(/B=\["\/assets\/brands\/[^\]]+\]/, 'B=' + JSON.stringify(brandRotation));
  }
  const names = Object.fromEntries(brands.map(brand => [brand.src, brand.name + ' logo']));
  source = source.replace(/src:n,(?:unoptimized:!0,)?alt:(?:"Local SEO"|\(\{[^}]+\}\)\[n\]\|\|"Company logo")/, 'src:n,unoptimized:!0,alt:(' + JSON.stringify(names) + ')[n]||"Company logo"');
  source = source.replace('title:"Platforms"', 'title:' + JSON.stringify(brandsHeading));
  oldDescription.forEach((text, i) => { source = source.replace(JSON.stringify(text), JSON.stringify(brandsDescription[i])); });
  assert(source.includes(JSON.stringify(brandRotation)), 'Brand rotation was not installed');
  assert(source.includes('unoptimized:!0,alt:('), 'Direct lossless asset delivery was not installed');
  assert(source.includes(JSON.stringify(brandsHeading)), 'Brand heading was not installed');
  return source;
});
await fs.writeFile(chunk, updated);

let html = await fs.readFile('index.html', 'utf8');
const position = html.indexOf(' home-proof"');
assert(position >= 0, 'Homepage brand section missing');
const start = html.lastIndexOf('<section ', position);
const [, end] = elementBounds(html, start, 'section');
let section = html.slice(start, end).replace('<!-- -->Platforms<!-- -->', '<!-- -->' + escape(brandsHeading) + '<!-- -->');
oldDescription.forEach((text, i) => { section = section.replace(escape(text), escape(brandsDescription[i])); });
let imageIndex = 0;
section = section.replace(/<img\b[^>]*>/g, tag => {
  const cell = Math.floor(imageIndex / 2), slot = imageIndex++ % 2;
  const brand = brands[(cell + slot * 10) % brands.length];
  return tag.replace(/ alt="[^"]*"/, ' alt="' + escape(brand.name + ' logo') + '"')
    .replace(/ sizes="[^"]*"| srcSet="[^"]*"/g, '')
    .replace(/ src="[^"]*"/, ' src="' + brand.src + '"');
});
assert.equal(imageIndex, 20, 'Expected two slots in each of ten original logo cells');
html = html.slice(0, start) + section + html.slice(end);
await fs.writeFile('index.html', html);
// The archived homepage server renders desktop markup. Reading matchMedia on
// the first browser render caused React #418 on tablet/mobile, including before
// this logo update. Defer homepage queries until the hook's existing layout
// effect runs; all later responsive updates and all other routes stay intact.
const queriesPath = 'assets/site/_next/static/chunks/133n6s~7.wlqw.js';
const queries = await fs.readFile(queriesPath, 'utf8');
const initialValue = 'initializeWithValue:n=!(typeof location!=="undefined"&&location.pathname==="/")';
await fs.writeFile(queriesPath, patchFactory(queries, 807880, source => {
  source = source.replace('initializeWithValue:n=!0', initialValue);
  assert(source.includes(initialValue), 'Homepage hydration initializer missing');
  return source;
}));
console.log(`Brands: ${brands.length} original logos; grid, proportions, colour and animations preserved.`);
