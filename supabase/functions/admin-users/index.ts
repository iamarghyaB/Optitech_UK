import { admin, body, db, HttpError, json, serve } from "../_shared/runtime.ts";
serve(async (req) => {
  const { user } = await admin(req, true);
  const input = await body(req);
  if (input.action === "list") {
    const { data, error } = await db
      .from("admin_memberships")
      .select("*")
      .order("created_at");
    if (error) throw error;
    const members = await Promise.all(
      data.map(async (row) => {
        const { data, error } = await db.auth.admin.getUserById(row.user_id);
        if (error) throw error;
        return {
          ...row,
          email: data.user.email,
          confirmed: !!data.user.email_confirmed_at,
        };
      }),
    );
    return json({ members });
  }
  if (input.action === "access") {
    if (typeof input.userId !== "string" || typeof input.active !== "boolean")
      throw new HttpError(400, "Invalid access change");
    const { error } = await db.rpc("admin_set_member_active", {
      p_actor: user.id,
      p_member: input.userId,
      p_active: input.active,
    });
    if (error)
      throw new HttpError(
        400,
        "Only another staff admin’s access can be changed",
      );
    return json({ saved: true });
  }
  if (input.action === "invite") {
    if (
      typeof input.email !== "string" ||
      input.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
    )
      throw new HttpError(400, "Enter a valid email");
    // The caller receives a one-time invite to share privately. Supabase SMTP is optional.
    const { data, error } = await db.auth.admin.generateLink({
      type: "invite",
      email: input.email.trim().toLowerCase(),
    });
    if (error)
      throw new HttpError(
        400,
        "Unable to invite this account. It may already be registered.",
      );
    const { error: roleError } = await db.rpc("admin_register_staff", {
      p_actor: user.id,
      p_user: data.user.id,
    });
    if (roleError) throw roleError;
    return json({ tokenHash: data.properties.hashed_token });
  }
  throw new HttpError(400, "Unknown action");
});
