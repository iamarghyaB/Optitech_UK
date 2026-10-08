import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.BASE_URL || "http://127.0.0.1:4182";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let checks = 0;
const check = (condition, message) => {
  assert(condition, message);
  checks++;
};
for (const path of ["/admin", "/admin/activate"]) {
  const r = await fetch(base + path);
  const html = await r.text();
  check(r.ok, `${path} available`);
  check(/noindex/.test(html), "Admin noindex");
  check(!html.includes("arghya.rkbk19@gmail.com"), "Owner email not hardcoded");
  check(
    !html.includes(process.env.ENQUIRY_WEBHOOK_TOKEN || "NO_SECRET"),
    "Integration token excluded from HTML",
  );
}
for (const operation of ["dashboard", "users"]) {
  const r = await fetch(`${base}/api/admin/${operation}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"action":"list"}',
  });
  check(r.status === 401, "Unauthenticated proxy denied");
  const invalid = await fetch(`${base}/api/admin/${operation}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid",
    },
    body: '{"action":"list"}',
  });
  check(invalid.status === 401, "Invalid bearer denied");
  const edge = await fetch(`${supabase}/functions/v1/admin-${operation}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: '{"action":"list"}',
  });
  check(edge.status === 401, "Direct unauthenticated Edge Function denied");
}
const headers = { apikey: key, "Content-Type": "application/json" };
for (const table of [
  "enquiries",
  "admin_memberships",
  "admin_audit_log",
  "integration_credentials",
]) {
  const r = await fetch(`${supabase}/rest/v1/${table}?select=*`, { headers });
  check(!r.ok, "Anonymous REST read denied: " + table);
}
const intake = await fetch(`${supabase}/functions/v1/enquiry-intake`, {
  method: "POST",
  headers,
  body: "{}",
});
check(intake.status === 401, "Direct intake requires integration secret");
const forged = await fetch(`${supabase}/functions/v1/enquiry-intake`, {
  method: "POST",
  headers: { ...headers, Authorization: "Bearer forged" },
  body: "{}",
});
check(forged.status === 401, "Forged integration secret denied");
if (process.env.TEST_SUPABASE_INTAKE === "1") {
  const id = randomUUID();
  const sample = {
    id,
    service: "web-development",
    package: "landing-page",
    name: "Optitech integration verification",
    email: "verification@example.invalid",
    business: "Synthetic verification",
    phone: "",
    requirements:
      "Synthetic quote request to verify the dashboard backend. Safe to delete.",
    consent: true,
    website: "",
  };
  await mkdir(".data/admin-setup", { recursive: true });
  await writeFile(".data/admin-setup/test-enquiry-id.txt", id);
  const post = (input) =>
    fetch(base + "/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify(input),
    });
  const r = await post(sample);
  check(r.status === 201, "Quote saved in Supabase");
  const receipt = await r.json();
  check(
    receipt.id === id && receipt.mode === "delivered",
    "Durable receipt returned",
  );
  check((await post(sample)).status === 201, "Identical retry accepted");
  check(
    (
      await post({
        ...sample,
        requirements:
          "Changed details with same reference should not overwrite the first request.",
      })
    ).status === 503,
    "Different payload cannot overwrite reference",
  );
  console.log("Synthetic enquiry reference:", id);
}
const result = {
  date: new Date().toISOString(),
  base,
  checks,
  failures: [],
  authenticatedEdgeTest:
    "Pending owner activation; database authorization tested separately",
};
await mkdir("verification/admin", { recursive: true });
await writeFile(
  "verification/admin/http-results.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
