import { admin, body, db, HttpError, json, serve } from "../_shared/runtime.ts";
const statuses = ["new", "contacted", "quoted", "won", "lost", "archived"];
serve(async (req) => {
  const { user, member } = await admin(req);
  const input = await body(req);
  if (input.action === "update") {
    if (
      typeof input.id !== "string" ||
      !statuses.includes(input.status) ||
      typeof input.notes !== "string" ||
      input.notes.length > 10000 ||
      !Number.isInteger(input.version) ||
      input.version < 1
    )
      throw new HttpError(400, "Invalid enquiry update");
    const { data, error } = await db.rpc("admin_update_enquiry", {
      p_actor: user.id,
      p_id: input.id,
      p_version: input.version,
      p_status: input.status,
      p_notes: input.notes,
    });
    if (error)
      throw new HttpError(
        error.message.includes("Conflict") ? 409 : 400,
        error.message.includes("Conflict")
          ? "This enquiry has changed. Reload before saving."
          : "Update could not be saved",
      );
    return json({ enquiry: data });
  }
  if (input.action === "audit") {
    if (member.role !== "super_admin")
      throw new HttpError(403, "Super admin required");
    const { data, error } = await db
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return json({ events: data });
  }
  if (input.action !== "list") throw new HttpError(400, "Unknown action");
  const page =
    Number.isInteger(input.page) && input.page >= 0 && input.page <= 10000
      ? input.page
      : 0;
  const search =
    typeof input.search === "string" ? input.search.trim().slice(0, 100) : "";
  let query = db
    .from("enquiries")
    .select(
      "id,created_at,name,email,business,phone,requirements,service,package,status,internal_notes,updated_at,version",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id")
    .range(page * 20, page * 20 + 19);
  if (input.status && !statuses.includes(input.status))
    throw new HttpError(400, "Invalid status");
  if (input.status) query = query.eq("status", input.status);
  // Encode the value as a quoted PostgREST literal, stripping wildcard operators.
  if (search) {
    const value = search.replace(/[\\"%_(),.]/g, " ");
    query = query.or(
      `name.ilike."%${value}%",email.ilike."%${value}%",business.ilike."%${value}%"`,
    );
  }
  const [result, ...counts] = await Promise.all([
    query,
    ...statuses.map((status) =>
      db
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", status),
    ),
  ]);
  if (result.error || counts.some((x) => x.error))
    throw result.error || new Error("Counts unavailable");
  return json({
    member: { role: member.role, email: user.email },
    enquiries: result.data,
    count: result.count,
    counts: Object.fromEntries(
      statuses.map((status, i) => [status, counts[i].count]),
    ),
  });
});
