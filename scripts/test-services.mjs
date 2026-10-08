import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { services, quoteHref, siteUrl, archivedPriceReplacements } from '../content/services.mjs';
import { validateEnquiry, deliverEnquiry } from '../lib/enquiries.mjs';

const base = process.env.BASE_URL || 'http://127.0.0.1:4181';
let checks = 0;
const check = (condition, message) => { assert(condition, message); checks++; };
const read = async url => { const response = await fetch(base + url); check(response.ok, `${url}: ${response.status}`); return response.text(); };
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');
const homepage = await read('/');
for (const [oldPrice] of archivedPriceReplacements) check(!homepage.includes(oldPrice), `No stale homepage price ${oldPrice}`);
const section = homepage.slice(homepage.indexOf('flex flex-col home-projects'), homepage.indexOf('home-clients'));
for (const service of services) check(section.includes(`href="/services/${service.slug}"`), `Home link ${service.slug}`);
check(!section.includes('project-item-floyd-mayweather'), 'Demo rows removed from service directory');
const flight = await fetch(base + '/', { headers: { RSC: '1' } }).then(response => response.text());
check(services.every(service => flight.includes(`"slug":"${service.slug}"`)), 'All 8 services in homepage Flight');
const inlineFlight = [...homepage.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)].map(match => JSON.parse(match[1])).join('');
check(services.every(service => inlineFlight.includes(`"slug":"${service.slug}"`)), 'All 8 services in embedded hydration data');
const allLinks = new Set();
for (const service of services) {
  const html = await read(`/services/${service.slug}`), clean = decode(html);
  check((html.match(/<h1\b/g) || []).length === 1, `${service.slug}: one H1`);
  check(clean.includes(`<title>${service.seoTitle}</title>`), `${service.slug}: unique title`);
  check(clean.includes(`href="${siteUrl}/services/${service.slug}"`), `${service.slug}: canonical`);
  check(clean.includes('name="description"'), `${service.slug}: description`);
  check(clean.includes('name="robots" content="index, follow"'), `${service.slug}: indexable`);
  check(service.faqs.length >= 4 && service.faqs.length <= 6, `${service.slug}: specific FAQs`);
  for (const item of service.packages) {
    check(clean.includes(item.price), `${item.name}: price`);
    check(clean.includes(item.timeline), `${item.name}: delivery`);
    check(clean.includes(`href="${quoteHref(service, item.id)}"`), `${item.name}: contextual quote action`);
    const quote = decode(await read(quoteHref(service, item.id)));
    check(quote.includes(`value="${service.slug}" selected=""`), `${item.name}: selected service`);
    check(quote.includes(`value="${item.id}" selected=""`), `${item.name}: selected package`);
  }
  for (const match of html.matchAll(/href="([^"#]+)"/g)) { const href = decode(match[1]); if (href.startsWith('/') && !href.startsWith('/_next')) allLinks.add(href); }
}
for (const href of allLinks) check((await fetch(base + href)).ok, `Internal navigation ${href}`);
const contact = await fetch(base + '/contact?service=seo&package=growth', { redirect: 'manual' });
check(contact.status === 308 && contact.headers.get('location')?.endsWith('/contact/quote?service=seo&package=growth'), 'Existing contact path preserves quote context');
check((await fetch(base + '/services/unknown-service')).status === 404, 'Unknown service returns 404');
const invalidQuote = await read('/contact/quote?service=seo&package=shopify');
check(invalidQuote.includes('Please select an option below'), 'Invalid query context is recoverable');

// Exercise validation and unconfigured production without sending anything externally.
const sample = { id: randomUUID(), service: 'web-development', package: 'landing-page', name: 'Local Test', email: 'local-test@example.invalid', business: 'Verification fixture', phone: '', requirements: 'Synthetic local verification enquiry. No external delivery.', consent: true, website: '' };
const parsed = validateEnquiry(sample);
check(parsed.package.name === 'Landing Page' && parsed.package.indicativePrice === '£350–£650', 'Server derives authoritative package context');
const previous = { webhook: process.env.ENQUIRY_WEBHOOK_URL, vercel: process.env.VERCEL };
delete process.env.ENQUIRY_WEBHOOK_URL; process.env.VERCEL = '1';
await assert.rejects(deliverEnquiry(parsed), /not configured/); checks++;
if (previous.webhook === undefined) delete process.env.ENQUIRY_WEBHOOK_URL; else process.env.ENQUIRY_WEBHOOK_URL = previous.webhook;
if (previous.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous.vercel;

const post = (body, extraHeaders = {}) => fetch(base + '/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', ...extraHeaders }, body: JSON.stringify(body) });
for (const [body, label] of [[{ ...sample, service: 'unknown' }, 'unknown service'], [{ ...sample, package: 'shopify' }, 'mismatched package'], [{ ...sample, consent: false }, 'missing consent'], [{ ...sample, requirements: 'short' }, 'short requirements']]) check((await post(body)).status === 400, `Reject ${label}`);
check((await post(sample, { Origin: 'https://another-site.invalid' })).status === 403, 'Reject foreign origin');
check((await post({ ...sample, requirements: 'x'.repeat(19000) })).status === 413, 'Reject oversized input');
// Opt-in prevents a verifier from contacting a production delivery endpoint.
if (process.env.TEST_LOCAL_ENQUIRIES === '1') {
  const response = await post(sample); check(response.status === 201, 'Local enquiry accepted');
  const receipt = await response.json(); check(receipt.mode === 'local', 'No external delivery in local test');
  try {
    const saved = JSON.parse(await fs.readFile(`.data/enquiries/${receipt.id}.json`, 'utf8'));
    check(saved.service.slug === sample.service && saved.package.id === sample.package && saved.requirements === sample.requirements, 'Enquiry context durably saved');
    check((await post(sample)).status === 201, 'Safe local retry');
    check((await fs.readdir('.data/enquiries')).filter(file => file === `${receipt.id}.json`).length === 1, 'Retry does not duplicate local record');
  } finally { await fs.unlink(`.data/enquiries/${receipt.id}.json`); }
}
const result = { date: new Date().toISOString(), services: services.length, packages: services.reduce((count, service) => count + service.packages.length, 0), checks, localEnquiryTested: process.env.TEST_LOCAL_ENQUIRIES === '1', failures: [] };
await fs.mkdir('verification', { recursive: true });
await fs.writeFile('verification/services-results.json', JSON.stringify(result, null, 2));
console.log(result);
