import { serveReference } from '../../../lib/reference-server.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request) { return serveReference(request, '/_next/image'); }
export function HEAD(request) { return serveReference(request, '/_next/image'); }
