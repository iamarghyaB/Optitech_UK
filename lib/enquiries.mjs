import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { findService } from '../content/services.mjs';

export function validateEnquiry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Please complete the enquiry form.');
  const text = (key, max, required = false) => {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`Please check your ${key}.`);
    return value.trim();
  };
  const name = text('name', 100, true), email = text('email', 254, true), requirements = text('requirements', 5000, true);
  if (name.length < 2 || requirements.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please provide your name, a valid email address and at least 10 characters describing your requirements.');
  if (input.consent !== true || text('website', 200)) throw new Error('Please check the enquiry details and confirm consent.');
  const service = findService(text('service', 100, true));
  if (!service) throw new Error('Please select an available service.');
  const packageId = text('package', 100);
  const item = service.packages.find(item => item.id === packageId);
  if (packageId && !item) throw new Error('Please select a package belonging to this service.');
  const suppliedId = text('id', 50);
  if (suppliedId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedId)) throw new Error('Please refresh the form and try again.');
  return { id: suppliedId || randomUUID(), createdAt: new Date().toISOString(), name, email, business: text('business', 200), phone: text('phone', 50), requirements, consent: true,
    service: { slug: service.slug, title: service.title }, package: item ? { id: item.id, name: item.name, indicativePrice: item.price, estimatedDelivery: item.timeline } : null };
}

export async function deliverEnquiry(enquiry) {
  const endpoint = process.env.ENQUIRY_WEBHOOK_URL;
  if (endpoint) {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') throw new Error('Delivery endpoint must use HTTPS.');
    const response = await fetch(url, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': enquiry.id, ...(process.env.ENQUIRY_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.ENQUIRY_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify(enquiry), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Enquiry delivery failed.');
    return 'delivered';
  }
  // Local outbox is explicitly unavailable on Vercel's ephemeral filesystem.
  if (process.env.VERCEL !== '1' && (process.env.NODE_ENV === 'development' || process.env.ENQUIRY_TRANSPORT === 'local')) {
    const dir = path.join(process.cwd(), '.data', 'enquiries');
    await mkdir(dir, { recursive: true });
    try { await writeFile(path.join(dir, `${enquiry.id}.json`), JSON.stringify(enquiry, null, 2), { flag: 'wx' }); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
    return 'local';
  }
  throw new Error('Enquiry delivery is not configured.');
}
