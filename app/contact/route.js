export function GET(request) {
  const source = new URL(request.url);
  const destination = new URL('/contact/quote', source);
  destination.search = source.search;
  return Response.redirect(destination, 308);
}
export function HEAD(request) { return GET(request); }
