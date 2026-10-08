import { body, db, hash, HttpError, json, serve } from "../_shared/runtime.ts";
serve(async (req) => {
  const token =
    req.headers.get("authorization")?.replace(/^Bearer /i, "") || "";
  if (!token || token.length > 200) throw new HttpError(401, "Unauthorized");
  const { data: credential, error: lookup } = await db
    .from("integration_credentials")
    .select("token_hash,expires_at")
    .eq("name", "enquiry_intake")
    .maybeSingle();
  if (lookup) throw lookup;
  if (
    !credential ||
    credential.token_hash !== (await hash(token)) ||
    (credential.expires_at && Date.parse(credential.expires_at) < Date.now())
  )
    throw new HttpError(401, "Unauthorized");
  const input = await body(req);
  const string = (key: string, max: number, min = 0) => {
    const value = input[key];
    if (
      typeof value !== "string" ||
      value.length > max ||
      value.trim().length < min
    )
      throw new HttpError(400, "Invalid enquiry");
    return value.trim();
  };
  const id = string("id", 36, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    throw new HttpError(400, "Invalid reference");
  const service = input.service,
    pack = input.package;
  if (
    input.consent !== true ||
    !service ||
    typeof service.slug !== "string" ||
    typeof service.title !== "string" ||
    service.slug.length > 100 ||
    service.title.length > 200 ||
    (pack !== null &&
      (!pack ||
        ["id", "name", "indicativePrice", "estimatedDelivery"].some(
          (k) => typeof pack[k] !== "string" || pack[k].length > 300,
        )))
  )
    throw new HttpError(400, "Invalid service");
  const email = string("email", 254, 3);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "Invalid email");
  const record = {
    id,
    name: string("name", 100, 2),
    email,
    business: string("business", 200),
    phone: string("phone", 50),
    requirements: string("requirements", 5000, 10),
    service: { slug: service.slug, title: service.title },
    package: pack
      ? {
          id: pack.id,
          name: pack.name,
          indicativePrice: pack.indicativePrice,
          estimatedDelivery: pack.estimatedDelivery,
        }
      : null,
    consent: true,
  };
  const fingerprint = await hash(JSON.stringify(record));
  const { error } = await db
    .from("enquiries")
    .insert({ ...record, payload_hash: fingerprint });
  if (error) {
    if (error.code !== "23505") throw error;
    const { data: existing, error: read } = await db
      .from("enquiries")
      .select("payload_hash")
      .eq("id", id)
      .single();
    if (read) throw read;
    if (existing.payload_hash !== fingerprint)
      throw new HttpError(409, "Reference already used for different details");
  }
  return json({ id, received: true }, 201);
});
