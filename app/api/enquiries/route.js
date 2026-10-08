import { validateEnquiry, deliverEnquiry } from '@/lib/enquiries.mjs';

export const runtime = 'nodejs';
const response = (body, status) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || new URL(request.url).host;
  try { if (origin && new URL(origin).host !== host) return response({ error: 'Please submit your enquiry from this website.' }, 403); }
  catch { return response({ error: 'Invalid request origin.' }, 403); }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return response({ error: 'Unsupported enquiry format.' }, 415);
  let enquiry;
  try {
    if (Number(request.headers.get('content-length')) > 18000) return response({ error: 'Your enquiry is too long.' }, 413);
    const reader = request.body?.getReader();
    if (!reader) return response({ error: 'Please complete the enquiry form.' }, 400);
    const chunks = []; let length = 0;
    for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > 18000) { await reader.cancel(); return response({ error: 'Your enquiry is too long.' }, 413); } chunks.push(value); }
    enquiry = validateEnquiry(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch (error) { return response({ error: error instanceof SyntaxError ? 'Please check the enquiry format.' : error.message }, 400); }
  try {
    const mode = await deliverEnquiry(enquiry);
    return response({ id: enquiry.id, mode }, 201);
  } catch {
    // Never claim success without saving or delivering the complete enquiry.
    return response({ error: 'We could not send your enquiry at the moment. Please try again later.' }, 503);
  }
}
