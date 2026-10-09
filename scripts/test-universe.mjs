import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { universe, universePhotos } from '../content/universe.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/ARGHYA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('sharp');
const base = process.env.BASE_URL || 'http://127.0.0.1:4188';
const directory = process.env.UNIVERSE_REPORT_DIR || 'verification/universe';
const manifest = JSON.parse(await fs.readFile('content/universe-images.json', 'utf8'));
const checks = [], errors = [], failed = [];
function check(condition, label) { assert(condition, label); checks.push(label); }
await fs.mkdir(directory, { recursive: true });
check(manifest.length === 14 && universePhotos.length === 14, '14 unique photo records');
check(new Set(manifest.map(item => item.url)).size === 14, 'No duplicate image URLs');
for (const image of manifest) {
  const metadata = await sharp(image.url.slice(1)).metadata();
  check(metadata.width === image.width && metadata.height === image.height, image.slug + ': dimensions match');
  for (const variant of Object.values(image.sizes)) {
    const actual = await sharp(variant.url.slice(1)).metadata();
    check(actual.width === variant.width && actual.height === variant.height && Math.abs(actual.width / actual.height - image.width / image.height) < 0.003, image.slug + ': responsive aspect ratio preserved');
  }
}
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-unsafe-swiftshader'] });
try {
  for (const [name, width, height, point] of [
    ['desktop', 1440, 1000, [1120, 260]],
    ['tablet', 820, 1180, [720, 350]],
    ['mobile', 390, 844, [365, 270]],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push({ name, message: error.message }));
    page.on('response', response => { if (response.status() >= 400) failed.push({ name, url: response.url(), status: response.status() }); });
    check((await page.goto(base + '/universe')).status() === 200, name + ': route loads');
    await page.waitForTimeout(9000);
    check(await page.locator('main h1').innerText() === universe.heading, name + ': heading');
    check(await page.locator('#universe-description').innerText() === universe.description, name + ': accurate partner copy');
    check(await page.locator('#universe-photo-descriptions li').count() === 14, name + ': accessible photo descriptions');
    check(await page.title() === universe.title, name + ': metadata');
    check(await page.locator('#gallery canvas').count() === 1, name + ': original WebGL gallery');
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), name + ': no horizontal overflow');
    check(!await page.evaluate(() => document.body.innerText.includes('Demo media')), name + ': old captions removed');
    // Decode all local photos in the actual browser, including focus originals.
    const decoded = await page.evaluate(async records => {
      for (const record of records) for (const url of [record.url, ...Object.values(record.sizes).map(size => size.url)]) {
        const image = new Image(); image.src = url; await image.decode();
        if (!image.naturalWidth || !image.naturalHeight) return false;
      }
      return true;
    }, manifest);
    check(decoded, name + ': all 56 WebP assets decode');
    await page.screenshot({ path: directory + '/' + name + '.png' });
    await page.mouse.move(...point);
    await page.waitForTimeout(400);
    await page.mouse.click(...point);
    await page.waitForTimeout(600);
    const close = page.getByRole('button', { name: 'Close', exact: true });
    // The floating gallery uses viewport-dependent placement. Find a tile if
    // this device's initial frame does not cover the first probe point.
    if (!await close.isVisible()) {
      for (const [x, y] of [[width * .2, height * .65], [width * .85, height * .7], [width * .15, height * .28]]) {
        await page.mouse.click(x, y); await page.waitForTimeout(450);
        if (await close.isVisible()) break;
      }
    }
    await close.waitFor({ state: 'visible', timeout: 4000 });
    await page.waitForTimeout(1700);
    check(await close.isVisible(), name + ': photo focus transition');
    await page.screenshot({ path: directory + '/focus-' + name + '.png' });
    await close.click(); await page.waitForTimeout(1000);
    check(!await close.isVisible(), name + ': close returns to gallery');
    await page.mouse.move(width / 2, height / 2); await page.mouse.down();
    await page.mouse.move(width / 2 - 130, height / 2 + 150, { steps: 18 });
    await page.mouse.up(); await page.waitForTimeout(1500);
    await page.screenshot({ path: directory + '/drag-' + name + '.png' });
    await page.mouse.wheel(180, 240); await page.waitForTimeout(1300);
    check(await page.locator('#gallery').isVisible(), name + ': drag and wheel retain gallery');
    await page.screenshot({ path: directory + '/wheel-' + name + '.png' });
    await page.close();
    console.log(name + ': loading, focus, close, dragging and wheel checks passed');
  }
  check(errors.length === 0, 'No browser runtime errors');
  check(failed.length === 0, 'No failed page or asset requests');
} finally {
  await browser.close();
  await fs.writeFile(directory + '/results.json', JSON.stringify({ date: new Date().toISOString(), base, checks, errors, failed }, null, 2));
}
console.log(checks.length + ' Universe checks passed.');
