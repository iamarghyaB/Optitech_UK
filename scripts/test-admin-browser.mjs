import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.BROWSER_MODULE_DIR, "playwright"),
);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.BROWSER_EXECUTABLE,
  args: ["--enable-unsafe-swiftshader"],
});
const base = process.env.BASE_URL || "http://127.0.0.1:4182";
const errors = [],
  failures = [];
let checks = 0;
const check = (x, m) => {
  assert(x, m);
  checks++;
};
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.invalid",
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const jwt = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: user.id,
    role: "authenticated",
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  "ui-fixture",
]
  .map((x) =>
    Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString(
      "base64url",
    ),
  )
  .join(".");
const auth = {
  access_token: jwt,
  refresh_token: "ui-fixture-only",
  expires_in: 3600,
  token_type: "bearer",
  user,
};
await fs.mkdir("verification/admin", { recursive: true });
try {
  for (const [kind, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } }),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push({ kind, error: e.message }));
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().includes("/api/admin/"))
        failures.push({ kind, url: r.url(), status: r.status() });
    });
    await page.goto(base + "/admin");
    await page.getByRole("heading", { name: "Welcome back." }).waitFor();
    check(
      await page.getByRole("button", { name: "Sign in →" }).isVisible(),
      "Login form visible",
    );
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Login no horizontal overflow",
    );
    await page.screenshot({
      path: `verification/admin/login-${kind}.png`,
      fullPage: true,
    });
    const received = [];
    let row = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Avery Jones",
      email: "avery@example.invalid",
      business: "Sample Studio",
      phone: "",
      requirements: "A clean business website with a quotation request form.",
      service: { slug: "web-development", title: "Web Development" },
      package: {
        id: "landing-page",
        name: "Landing Page",
        indicativePrice: "£350–£650",
        estimatedDelivery: "3–7 working days",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "new",
      internal_notes: "",
      version: 1,
    };
    const members = [
      {
        user_id: user.id,
        email: user.email,
        role: "super_admin",
        active: true,
        confirmed: true,
      },
      {
        user_id: "33333333-3333-4333-8333-333333333333",
        email: "staff@example.invalid",
        role: "admin",
        active: true,
        confirmed: true,
      },
    ];
    let conflict = true;
    await page.route("**/auth/v1/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          route.request().url().includes("/logout") ? {} : auth,
        ),
      }),
    );
    await page.route("**/api/admin/**", async (route) => {
      const input = route.request().postDataJSON();
      received.push(input);
      let data = {};
      let status = 200;
      if (
        input.action === "list" &&
        route.request().url().endsWith("/dashboard")
      )
        data = {
          member: { role: "super_admin", email: user.email },
          enquiries: input.status && input.status !== row.status ? [] : [row],
          count: input.status && input.status !== row.status ? 0 : 1,
          counts: {
            new: row.status === "new" ? 1 : 0,
            quoted: row.status === "quoted" ? 1 : 0,
            contacted: 0,
            won: 0,
          },
        };
      if (input.action === "update") {
        if (conflict) {
          status = 409;
          data = { error: "This enquiry has changed. Reload before saving." };
          conflict = false;
        } else {
          row = {
            ...row,
            status: input.status,
            internal_notes: input.notes,
            version: row.version + 1,
          };
          data = { enquiry: row };
        }
      }
      if (input.action === "list" && route.request().url().endsWith("/users"))
        data = { members };
      if (input.action === "access") {
        members[1].active = input.active;
        data = { saved: true };
      }
      if (input.action === "audit")
        data = {
          events: [
            {
              id: 1,
              action: "enquiry.updated",
              entity_id: row.id,
              actor_id: user.id,
              created_at: row.created_at,
            },
          ],
        };
      if (input.action === "invite")
        data = { tokenHash: "ui-fixture-not-a-real-invitation" };
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });
    await page.getByLabel("Email address").fill(user.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("UI fixture password only");
    await page.getByRole("button", { name: "Sign in →" }).click();
    await page
      .getByRole("button", { name: "Open enquiry from Avery Jones" })
      .waitFor();
    check(
      await page
        .getByRole("heading", { name: "Let’s move things forward." })
        .isVisible(),
      "Authenticated dashboard renders",
    );
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Dashboard no horizontal overflow",
    );
    await page.screenshot({
      path: `verification/admin/dashboard-${kind}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Open enquiry from Avery Jones" })
      .click();
    await page
      .getByRole("heading", { name: "Avery Jones", exact: true })
      .waitFor();
    check(
      await page.getByText(row.requirements, { exact: true }).isVisible(),
      "Full enquiry shown",
    );
    await page.getByLabel("Status", { exact: true }).selectOption("quoted");
    await page
      .getByLabel("Internal notes", { exact: true })
      .fill("Prepare an estimate and follow up next week.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("alert").waitFor();
    check(
      (await page
        .getByLabel("Internal notes", { exact: true })
        .inputValue()) === "Prepare an estimate and follow up next week.",
      "Conflict preserves unsaved notes",
    );
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Enquiry saved.", { exact: true }).waitFor();
    check(
      received.some(
        (x) =>
          x.action === "update" && x.status === "quoted" && x.version === 1,
      ),
      "Versioned update submitted",
    );
    await page.screenshot({
      path: `verification/admin/enquiry-${kind}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "All enquiries", exact: false })
      .click();
    await page.getByLabel("Search enquiries", { exact: true }).fill("Avery");
    const searched = page.waitForResponse((r) =>
      r.url().endsWith("/api/admin/dashboard"),
    );
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await searched;
    check(
      received.some((x) => x.search === "Avery"),
      "Server search submitted",
    );
    await page.getByLabel("Filter by status").selectOption("won");
    await page
      .getByRole("heading", { name: "No matching enquiries" })
      .waitFor();
    check(true, "Empty search state renders");
    await page
      .getByRole("button", { name: "Team access", exact: false })
      .click();
    await page.getByText("Protected owner", { exact: true }).waitFor();
    check(
      await page
        .getByRole("cell", { name: /staff@example.invalid/ })
        .isVisible(),
      "Team access list renders",
    );
    await page.getByRole("button", { name: "Disable access" }).click();
    await page.getByRole("button", { name: "Enable access" }).waitFor();
    check(
      received.some((x) => x.action === "access" && x.active === false),
      "Staff access change submitted",
    );
    await page
      .getByLabel("Staff email", { exact: true })
      .fill("invited@example.invalid");
    await page.getByRole("button", { name: "Create staff invitation" }).click();
    await page.getByLabel("Invitation link").waitFor();
    check(
      (await page.getByLabel("Invitation link").inputValue()).startsWith(
        base + "/admin/activate?",
      ),
      "Private invitation URL renders",
    );
    await page
      .getByRole("button", { name: "Activity log", exact: false })
      .click();
    await page.getByText("Enquiry updated", { exact: true }).waitFor();
    check(true, "Activity log renders");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByRole("heading", { name: "Welcome back." }).waitFor();
    check(
      (await page.getByText("Avery Jones", { exact: true }).count()) === 0,
      "Sign-out clears private dashboard",
    );
    await page.goto(base + "/admin/activate?type=invite&token_hash=ui-fixture");
    await page.getByLabel("New password", { exact: true }).waitFor();
    check(
      !page.url().includes("token_hash"),
      "Activation token removed from address bar",
    );
    await page
      .getByLabel("New password", { exact: true })
      .fill("Strong UI fixture password");
    await page
      .getByLabel("Confirm password", { exact: true })
      .fill("Strong UI fixture password");
    await page
      .getByRole("button", { name: "Save password & open dashboard" })
      .click();
    await page.waitForURL(base + "/admin");
    check(true, "Activation password form returns to dashboard");
    await context.close();
  }
} finally {
  await browser.close();
}
check(errors.length === 0, "No browser exceptions");
check(failures.length === 0, "No failing resources");
const result = {
  date: new Date().toISOString(),
  base,
  checks,
  errors,
  failures,
  authenticatedResponses:
    "Mocked UI fixtures; no Auth accounts created and no email sent.",
};
await fs.writeFile(
  "verification/admin/browser-results.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
