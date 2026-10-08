import { createClient } from "npm:@supabase/supabase-js@2.117.3";
export const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
export async function body(req: Request) {
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON required");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 24000) {
      await reader.cancel();
      throw new HttpError(413, "Request too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let pos = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, pos);
    pos += chunk.length;
  }
  try {
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || Array.isArray(data) || typeof data !== "object")
      throw new Error();
    return data;
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function admin(req: Request, superOnly = false) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) throw new HttpError(401, "Sign in required");
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user || !user.email_confirmed_at)
    throw new HttpError(401, "A verified account is required");
  const { data: member, error: lookup } = await db
    .from("admin_memberships")
    .select("role,active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookup) throw lookup;
  if (!member?.active || (superOnly && member.role !== "super_admin"))
    throw new HttpError(403, "Admin access required");
  return { user, member };
}
export async function hash(text: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(bytes))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof HttpError)
        return json({ error: error.message }, error.status);
      console.error(
        "Request failed",
        error instanceof Error ? error.name : "Unknown error",
      );
      return json(
        { error: "The operation could not be completed. Please try again." },
        500,
      );
    }
  });
}
