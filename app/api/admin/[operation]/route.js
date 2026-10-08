export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body, status) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request, { params }) {
  const { operation } = await params;
  if (!["dashboard", "users"].includes(operation))
    return reply({ error: "Not found" }, 404);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "Invalid origin" }, 403);
  const token = request.headers.get("authorization");
  if (!token?.startsWith("Bearer ") || token.length > 10000)
    return reply({ error: "Sign in required" }, 401);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply({ error: "JSON required" }, 415);
  if (Number(request.headers.get("content-length")) > 24000)
    return reply({ error: "Request too large" }, 413);
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Missing request" }, 400);
  let length = 0;
  const chunks = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 24000) {
      await reader.cancel();
      return reply({ error: "Request too large" }, 413);
    }
    chunks.push(value);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return reply({ error: "Admin backend is unavailable" }, 503);
  try {
    const result = await fetch(`${url}/functions/v1/admin-${operation}`, {
      method: "POST",
      headers: {
        Authorization: token,
        apikey: key,
        "Content-Type": "application/json",
      },
      body: Buffer.concat(chunks),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    return reply(await result.json(), result.status);
  } catch {
    return reply({ error: "Unable to connect. Please try again." }, 503);
  }
}
