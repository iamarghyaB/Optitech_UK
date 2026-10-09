import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { projects, portfolioAttribution, legacyProjectSlugs } from '../content/projects.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/ARGHYA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4187';
const output = process.env.PORTFOLIO_REPORT_DIR || 'verification/portfolio';
await fs.mkdir(output, { recursive: true });
const checks = [], failures = [], errors = [], failedResources = [];
function check(value, name) { checks.push(name); assert(value, name); }
const list = await fetch(base + '/work').then(r => r.text());
check(list.includes(portfolioAttribution), 'Listing attribution');
check(!list.slice(list.indexOf('<main'), list.indexOf('</main>')).includes('Demo'), 'No placeholder projects');
const titles = new Set();
for (const [i, project] of projects.entries()) {
  const route = `/work/${project.slug}`, response = await fetch(base + route), html = await response.text();
  check(response.status === 200, route + ' HTML');
  const flight = await fetch(base + route, { headers: { RSC: '1' } });
  check(flight.status === 200 && (await flight.text()).includes(`"id":"${project.id}"`), route + ' Flight');
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  check(title && !titles.has(title), route + ' unique title'); titles.add(title);
  check(html.includes(`rel="canonical" href="https://optitech-uk.vercel.app${route}"`), route + ' canonical');
  check((html.match(/<h1\b/g) || []).length === 1, route + ' one H1');
  check(html.includes('name="robots" content="index, follow"'), route + ' indexable');
  check(html.includes(project.liveUrl) && html.includes('noopener noreferrer'), route + ' live link');
  for (const image of [project.cover, ...project.gallery]) {
    const asset = await fetch(base + image.src);
    check(asset.status === 200 && asset.headers.get('content-type')?.includes('image/webp'), image.src);
  }
}
for (const slug of legacyProjectSlugs) { const r = await fetch(base + `/work/${slug}`, { redirect: 'manual' }); check(r.status === 308 && r.headers.get('location') === '/work', `Legacy demo ${slug} redirects`); }
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-unsafe-swiftshader'] });
async function pageFor(viewport) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) failedResources.push({ url: response.url(), status: response.status() }); });
  return page;
}
const sizes = [['desktop', { width: 1440, height: 1000 }], ['tablet', { width: 820, height: 1180 }], ['mobile', { width: 390, height: 844 }]];
try {
  for (const [size, viewport] of sizes) {
    const page = await pageFor(viewport);
    await page.goto(base + '/work'); await page.waitForTimeout(6500);
    const cards = size === 'desktop' ? page.locator('a.work-slide:not([aria-hidden="true"])') : page.locator('main button[aria-label]');
    check(await cards.count() === projects.length, `${size}: seven accessible cards`);
    const names = await cards.evaluateAll(elements => elements.map(el => el.getAttribute('aria-label')));
    check(names.every((name, i) => name.startsWith(projects[i].title)), `${size}: source order`);
    if (size !== 'desktop') check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${size}: no horizontal overflow`);
    await page.screenshot({ path: `${output}/work-${size}.png` });
    if (size === 'desktop') {
      const card = cards.first();
      await card.hover(); await page.waitForTimeout(550);
      check(await card.locator('span').first().evaluate(el => Number(getComputedStyle(el).opacity) > 0.95), 'Desktop hover reveals title');
      const before = await page.evaluate(() => scrollX);
      await page.mouse.move(1100, 460); await page.mouse.down(); await page.mouse.move(750, 460, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(650);
      check(await page.evaluate(() => scrollX) !== before, 'Carousel pointer dragging');
      await card.focus(); await page.keyboard.press('Enter');
      await page.waitForURL('**/work/the-workers-agency', { timeout: 18000 });
      check(await page.locator('main h1').innerText() === 'The Workers Agency', 'Desktop keyboard opens animated detail');
    } else {
      await cards.first().focus(); await page.keyboard.press('Enter');
      await page.waitForURL('**/work/the-workers-agency', { timeout: 18000 });
      check(await page.locator('main h1').innerText() === 'The Workers Agency', `${size}: keyboard opens animated detail`);
    }
    await page.close();
    for (const project of projects) {
      const page = await pageFor(viewport);
      try {
        await page.goto(`${base}/work/${project.slug}`); await page.waitForTimeout(8000);
        const headings = await page.locator('main h1,main h2').allTextContents();
        check(headings.join('|') === [project.title, 'Project Overview', 'What Was Built', 'Technologies Used', 'Project Screenshots', 'Have a Similar Project in Mind?', 'Explore More Work'].join('|'), `${size}/${project.slug}: section hierarchy`);
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${size}/${project.slug}: no horizontal overflow`);
        const hero = page.locator('main .project-item-image img').first();
        await hero.waitFor();
        check(await hero.evaluate(img => img.complete && img.naturalWidth > 0 && !!img.alt), `${size}/${project.slug}: authentic cover loaded`);
        const gallery = page.getByRole('heading', { name: 'Project Screenshots', exact: true });
        await gallery.scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
        const screenshots = page.locator('main section').filter({ has: gallery }).locator('img[alt]:not([alt=""])');
        for (const image of await screenshots.all()) await image.evaluate(img => img.decode());
        check(await screenshots.count() === project.gallery.length * 2, `${size}/${project.slug}: gallery images loaded`);
        const live = page.getByRole('link', { name: 'Visit Live Website ↗', exact: true });
        check(await live.getAttribute('href') === project.liveUrl && await live.getAttribute('target') === '_blank', `${size}/${project.slug}: safe live URL`);
        const cta = page.getByRole('link', { name: 'Start Your Project ↗', exact: true });
        check(await cta.getAttribute('href') === '/contact/quote', `${size}/${project.slug}: enquiry CTA`);
        if (project.id === 'newmrkt') await page.screenshot({ path: `${output}/newmrkt-gallery-${size}.png` });
      } catch (error) { failures.push({ size, project: project.id, message: error.message }); }
      await page.close();
    }
    console.log(`${size}: listing, animations and seven detail pages checked`);
  }
} finally { await browser.close(); }
const report = { date: new Date().toISOString(), base, projects: projects.map(p => ({ title: p.title, route: `/work/${p.slug}` })), checks: checks.length, failures, errors, failedResources };
await fs.writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
assert.equal(failures.length, 0, JSON.stringify(failures));
assert.equal(errors.length, 0, JSON.stringify(errors));
assert.equal(failedResources.length, 0, JSON.stringify(failedResources));
console.log(`Portfolio verification passed: ${checks.length} checks, zero runtime or asset errors.`);
