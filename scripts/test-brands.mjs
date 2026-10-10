import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { brands, brandsHeading } from '../content/brands.mjs';
import { factories, patchFactory, patchFunction, elementBounds } from './portfolio-archive.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/ARGHYA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4189';
const directory = process.env.BRANDS_REPORT_DIR || 'verification/brands';
const referenceCommit = 'bfeaf6f6ff8626ab1dedefee3839a4772da55511';
const baseline = file => execFileSync('git', ['show', referenceCommit + ':' + file], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).replaceAll('\r\n', '\n');
const checks = [], errors = [], failed = [];
function check(condition, label) { assert(condition, label); checks.push(label); }
await fs.mkdir(directory, { recursive: true });
const home = (await fs.readFile('index.html', 'utf8')).replaceAll('\r\n', '\n');
function withoutBrands(html) {
  const start = html.lastIndexOf('<section ', html.indexOf(' home-proof"'));
  const [, end] = elementBounds(html, start, 'section');
  return html.slice(0, start) + '<!-- BRANDS -->' + html.slice(end);
}
check(withoutBrands(home) === withoutBrands(baseline('index.html')), 'Every other homepage section and Flight record remains byte-identical');
const file = 'assets/site/_next/static/chunks/068fq8h1ymnjo.js';
const current = (await fs.readFile(file, 'utf8')).replaceAll('\r\n', '\n'), original = baseline(file);
check(patchFactory(current, 694911, () => '()=>{}') === patchFactory(original, 694911, () => '()=>{}'), 'Every neighbouring JS module remains byte-identical');
function animation(source) {
  source = patchFunction(source, 'f', () => 'function f(){}');
  return source.replace(/B=(?:Array\.from\(\{length:50\},\(e,t\)=>t\)\.filter\(e=>!x\.has\(e\)\)\.map\(e=>`[^`]+`\)|\["\/assets\/brands\/[^\]]+\])/, 'B=BRAND_DATA')
    .replace(/title:(?:"Platforms"|"Brands We've Worked With")/, 'title:BRAND_HEADING')
    .replace(/"(?:Platforms & Technologies We Work With\. |A selection of the brands we've worked with\. )"/, '"BRAND_LINE_1"')
    .replace(/"(?:WordPress, Shopify, Google, Meta, Stripe, PayPal, |From digital platforms to growing businesses, )"/, '"BRAND_LINE_2"')
    .replace(/"(?:React, Next\.js and Vercel\. Chosen for your goals\.|built with care, creativity and technical expertise\.)"/, '"BRAND_LINE_3"');
}
check(animation(factories(current).get(694911).source) === animation(factories(original).get(694911).source), 'All animation, layout and map code remains byte-identical after excluding changed logo data and copy');
const queryFile = 'assets/site/_next/static/chunks/133n6s~7.wlqw.js';
const queries = (await fs.readFile(queryFile, 'utf8')).replaceAll('\r\n', '\n');
check(queries.replace('initializeWithValue:n=!(typeof location!=="undefined"&&location.pathname==="/")', 'initializeWithValue:n=!0') === baseline(queryFile), 'Shared media-query hook differs only in homepage hydration initialization');
for (const css of ['0461f_cegkjv0.css', '0o7s~nivrs1sq.css']) check(await fs.readFile('assets/site/_next/static/chunks/' + css, 'utf8') === baseline('assets/site/_next/static/chunks/' + css), css + ': global styles unchanged');
check(brands.length === 6 && new Set(brands.map(b => b.src)).size === 6, 'Six distinct authorised logos');
const assetComparison = JSON.parse(await fs.readFile('verification/brands/asset-comparison.json', 'utf8'));
const fetchedAssets = await Promise.allSettled(assetComparison.map(async asset => {
  const response = await fetch(base + asset.url);
  assert(response.ok, asset.slug + ': HTTP ' + response.status);
  return { slug: asset.slug, hash: createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), expected: asset.optimisedSha256 };
}));
for (let i = 0; i < fetchedAssets.length; i++) {
  const result = fetchedAssets[i];
  check(result.status === 'fulfilled' && result.value.hash === result.value.expected, assetComparison[i].slug + ': HTTP asset bytes match the verified original-preserving output');
}
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-unsafe-swiftshader'] });
try {
  for (const [name, width, height, count] of [['desktop', 1440, 1000, 10], ['tablet', 820, 1180, 9], ['mobile', 390, 844, 10]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push({ name, message: error.message }));
    page.on('response', response => { if (response.status() >= 400) failed.push({ name, status: response.status(), url: response.url() }); });
    check((await page.goto(base, { waitUntil: 'domcontentloaded' })).status() === 200, name + ': homepage loads');
    await page.waitForTimeout(9000);
    await page.locator('.home-proof').scrollIntoViewIfNeeded();
    await page.waitForTimeout(3500);
    const section = page.locator('.home-proof');
    check((await section.locator('.title-and-desc-title').innerText()).includes(brandsHeading), name + ': heading');
    check(await section.locator('.logo-box').count() === count, name + ': original responsive cell count');
    check(await page.evaluate(async records => { for (const record of records) { const image = new Image(); image.src = record.src; await image.decode(); if (!image.naturalWidth) return false; } return true; }, brands), name + ': all six assets decode');
    const images = await section.locator('.logo-box img').evaluateAll(elements => elements.map(image => ({ src: new URL(image.src).pathname, alt: image.alt, complete: image.complete && image.naturalWidth > 0, fit: getComputedStyle(image).objectFit, filter: getComputedStyle(image).filter })));
    check(images.every(image => brands.some(b => b.src === image.src && b.name + ' logo' === image.alt)), name + ': local sources and accurate alt text');
    check(images.every(image => image.complete && image.fit === 'contain' && image.filter === 'none'), name + ': logos loaded without colour filters or stretching');
    check(new Set(images.map(image => image.src)).size === 6, name + ': all six brands represented');
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), name + ': no horizontal overflow');
    // Keep the real viewport when capturing: an oversized element screenshot
    // resizes mobile and restarts the archive's responsive SplitText animation.
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.home-proof').getBoundingClientRect().top + scrollY - 180));
    await page.waitForTimeout(2000);
    check(await section.locator('.title-and-desc-text').evaluate(element => +getComputedStyle(element).opacity > .95 && [...element.querySelectorAll('.title-and-desc-word')].every(word => +getComputedStyle(word).opacity > .95)), name + ': description reveal completed');
    await page.waitForFunction(() => [...document.querySelectorAll('.home-proof .logo-box')].every(box => +getComputedStyle(box).opacity > .999 && [...box.children].every(slot => { const style = getComputedStyle(slot), opacity = +style.opacity; return opacity < .001 || (opacity > .999 && ['none', 'blur(0px)'].includes(style.filter)); })), null, { timeout: 15000 });
    await page.screenshot({ path: directory + '/' + name + '.png' });
    if (name === 'desktop') {
      const before = await section.locator('.logo-box img').evaluateAll(images => images.map(image => image.src).join('|'));
      const fading = await page.evaluate(async () => {
        for (let i = 0; i < 75; i++) {
          if ([...document.querySelectorAll('.home-proof .logo-box > div')].some(element => { const opacity = +getComputedStyle(element).opacity; return opacity > .05 && opacity < .95; })) return true;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return false;
      });
      check(fading, 'desktop: original fade has intermediate opacity frames');
      await page.waitForTimeout(6000);
      check(await section.locator('.logo-box img').evaluateAll(images => images.map(image => image.src).join('|')) !== before, 'desktop: logos rotate through the original animation');
    }
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push({ name: 'reduced-motion', message: error.message }));
  page.on('response', response => { if (response.status() >= 400) failed.push({ name: 'reduced-motion', status: response.status(), url: response.url() }); });
  await page.goto(base); await page.waitForTimeout(7000);
  const before = await page.locator('.home-proof .logo-box img').evaluateAll(images => images.map(image => image.src).join('|'));
  await page.waitForTimeout(6000);
  check(before === await page.locator('.home-proof .logo-box img').evaluateAll(images => images.map(image => image.src).join('|')), 'Reduced motion stops logo cycling');
  await page.close();
} finally { await browser.close(); }
check(errors.length === 0, 'No browser runtime errors');
check(failed.length === 0, 'No failed HTTP requests');
await fs.writeFile(directory + '/browser-checks.json', JSON.stringify({ base, referenceCommit, checks, errors, failed }, null, 2) + '\n');
console.log(`Brands: ${checks.length} checks passed against ${base}`);
