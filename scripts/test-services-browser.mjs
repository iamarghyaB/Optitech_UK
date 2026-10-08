import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { services } from '../content/services.mjs';

const require = createRequire(import.meta.url);
const moduleRoot = process.env.BROWSER_MODULE_DIR;
const { chromium } = require(moduleRoot ? path.join(moduleRoot, 'playwright') : 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}), args: ['--enable-unsafe-swiftshader'] });
const base = process.env.BASE_URL || 'http://127.0.0.1:4181';
const failures = [], screenshots = [], errors = [], legacyWarnings = [];
let checks = 0;
const check = (value, label) => { assert(value, label); checks++; };
await fs.mkdir('verification/services', { recursive: true });
try {
  for (const [kind, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    page.on('pageerror', error => {
      const record = { kind, url: page.url(), error: error.message };
      // Documented on the unchanged reference in verification/REPORT.md and README.
      if (kind === 'mobile' && page.url() === base + '/' && error.message.includes('React error #418')) legacyWarnings.push(record);
      else errors.push(record);
    });
    page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base) && response.url() !== base + '/api/enquiries') failures.push({ kind, url: response.url(), status: response.status() }); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    const directory = page.locator('.home-services-directory');
    check(await directory.locator('a').count() === 8, `${kind}: 8 hydrated homepage rows`);
    await directory.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2200);
    const homeMetrics = await directory.evaluate(element => ({ viewport: innerWidth, columns: Array.from(element.firstElementChild.children).map(column => ({ left: column.getBoundingClientRect().left, width: column.getBoundingClientRect().width })), rows: Array.from(element.querySelectorAll('a')).map(row => ({ title: row.textContent, opacity: getComputedStyle(row.querySelector('.project-item-inner')).opacity, width: row.getBoundingClientRect().width })), overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    check(!homeMetrics.overflow, `${kind}: homepage has no horizontal overflow`);
    check(homeMetrics.rows.every(row => Number(row.opacity) > .99), `${kind}: homepage rows finish revealing`);
    check(kind === 'desktop' ? homeMetrics.columns[1].left > homeMetrics.columns[0].left : homeMetrics.columns[0].left === homeMetrics.columns[1].left, `${kind}: original responsive column pattern`);
    await directory.screenshot({ path: `verification/services/home-${kind}.png` }); screenshots.push(`home-${kind}.png`);
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const menuService = page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Services', exact: true });
    await menuService.waitFor({ state: 'visible' });
    await menuService.click();
    await page.waitForURL('**/services');
    check(await page.locator('.service-directory>a').count() === 8, `${kind}: archived menu reaches services index`);
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    await directory.locator('a[href="/services/web-development"]').click();
    await page.waitForURL('**/services/web-development');
    check(await page.locator('h1').count() === 1, `${kind}: home row navigates to native service`);
    for (const service of services) {
      await page.goto(`${base}/services/${service.slug}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      check(await page.locator('h1').textContent() === service.headline, `${kind}: ${service.slug} headline`);
      check(await page.locator('.service-price-card').count() === service.packages.length, `${kind}: ${service.slug} package count`);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${kind}: ${service.slug} no page overflow`);
      if (['web-development', 'website-maintenance'].includes(service.slug)) {
        await page.waitForTimeout(1700);
        await page.screenshot({ path: `verification/services/${service.slug}-${kind}.png`, fullPage: true }); screenshots.push(`${service.slug}-${kind}.png`);
      }
      const faq = page.locator('.service-faqs summary').first();
      await faq.focus(); await page.keyboard.press('Enter');
      check(await page.locator('.service-faqs details').first().getAttribute('open') !== null, `${kind}: ${service.slug} FAQ keyboard interaction`);
    }
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    check(await page.locator('dialog').evaluate(element => element.open), `${kind}: menu opens`);
    await page.keyboard.press('Escape');
    check(!await page.locator('dialog').evaluate(element => element.open), `${kind}: menu closes with Escape`);
    check(await page.evaluate(() => document.activeElement.getAttribute('aria-label')) === 'Open navigation menu', `${kind}: menu restores focus`);
    await page.goto(`${base}/services/web-development`);
    await page.getByRole('link', { name: 'Get a Quote for Landing Page', exact: true }).click();
    await page.waitForURL('**/contact/quote?service=web-development&package=landing-page');
    check(await page.locator('select[name=service]').inputValue() === 'web-development', `${kind}: enquiry service retained`);
    check(await page.locator('select[name=package]').inputValue() === 'landing-page', `${kind}: enquiry package retained`);
    await page.locator('select[name=service]').selectOption('seo');
    check(await page.locator('select[name=package]').inputValue() === '', `${kind}: changing service clears incompatible package`);
    await page.locator('select[name=service]').selectOption('web-development');
    await page.locator('select[name=package]').selectOption('landing-page');
    await page.getByLabel('Your name', { exact: true }).fill('Browser Test');
    await page.getByLabel('Email address', { exact: true }).fill('browser-test@example.invalid');
    await page.getByLabel('Your requirements', { exact: true }).fill('Synthetic local browser enquiry; no external delivery.');
    await page.locator('input[name=consent]').check();
    // A failed delivery keeps values and selection available for retry.
    await page.route('**/api/enquiries', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Please try again later.' }) }));
    await page.getByRole('button', { name: 'Request My Free Quote' }).click();
    await page.getByRole('alert').waitFor();
    check(await page.getByLabel('Your name', { exact: true }).inputValue() === 'Browser Test', `${kind}: failed enquiry retains details`);
    await page.unroute('**/api/enquiries');
    await page.screenshot({ path: `verification/services/quote-${kind}.png`, fullPage: true }); screenshots.push(`quote-${kind}.png`);
    if (process.env.TEST_LOCAL_ENQUIRIES === '1') {
      const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/enquiries') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Request My Free Quote' }).click();
      const receipt = await (await responsePromise).json();
      check(receipt.mode === 'local', `${kind}: local enquiry saved`);
      await page.getByRole('heading', { name: 'Enquiry saved for local review.' }).waitFor();
      try { const saved = JSON.parse(await fs.readFile(`.data/enquiries/${receipt.id}.json`)); check(saved.service.slug === 'web-development' && saved.package.id === 'landing-page', `${kind}: submitted context persists`); }
      finally { await fs.unlink(`.data/enquiries/${receipt.id}.json`); }
    }
    await context.close();
    console.log(`${kind}: rendered all 8 services, homepage and enquiry interactions verified.`);
  }
  // Reduced-motion preference leaves all directory content accessible.
  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await reduced.newPage();
  await page.goto(base + '/services/web-development');
  check(await page.locator('h1').isVisible(), 'Reduced motion retains hero content');
  await reduced.close();
  check(errors.length === 0, `No client exceptions: ${JSON.stringify(errors)}`);
  check(failures.length === 0, `No failed local resources: ${JSON.stringify(failures)}`);
  const result = { date: new Date().toISOString(), checks, screenshots, errors, failures, legacyWarnings };
  await fs.writeFile('verification/services/browser-results.json', JSON.stringify(result, null, 2));
  console.log(result);
} finally { await browser.close(); }
