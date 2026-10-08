# Optitech admin dashboard and Supabase backend

## Implemented

- `/admin`: Supabase Auth password sign-in, session refresh and sign-out; responsive enquiry dashboard.
- `/admin/activate`: Supabase invitation/recovery session handling and user-chosen password; one-time token hashes removed from the address bar.
- Enquiries: counts, status filtering, server search, 20-row pagination, full request details, statuses and internal notes.
- Super admins: staff invitations, enable/disable staff access, latest 100 audit events. Owner access cannot be disabled through the dashboard.
- Staff invitations produce private one-time activation links. The UI explicitly says that no email was sent.
- `/api/admin/dashboard` and `/api/admin/users`: same-origin Next.js proxies; bearer tokens forwarded to Supabase, no cached private responses.
- Edge Functions: `enquiry-intake`, `admin-dashboard`, `admin-users`.
- Database: `admin_memberships`, `enquiries`, `admin_audit_log`, `integration_credentials`; RLS and explicit grants; no client role writes or anonymous reads.
- Live role lookup uses the Auth user ID and database membership. User-editable metadata and email comparisons are not authorization inputs.
- Quote intake: private server integration token, SHA-256 token storage, bounded bodies, validated fields, authoritative website catalogue context, idempotent UUID receipts, mismatched retries rejected.
- Enquiry updates and their audit entries share a transaction. Version checks prevent a stale save from overwriting another admin's update.
- Integration token exists only in server environment variables and ignored local configuration. Service-role credentials are used only inside Edge Functions.
- Next.js updated to 16.3.8; Supabase JS pinned to 2.117.3. Dependency audit reports zero vulnerabilities.

## Owner setup

The user-requested owner account was invited through the Supabase Auth Admin API and its Auth UUID assigned `super_admin` in `admin_memberships`. No password or owner-email rule is hardcoded in application sources or migrations.

The short-lived setup handler has been replaced with the authenticated `admin-users` function and its setup credential deleted. No extra Auth test accounts were created.

Supabase's connector cannot update Auth redirect settings, and the local Supabase CLI has no Management API login. The user was asked to set:

- Site URL: `https://optitech-uk.vercel.app`
- Redirect URL: `https://optitech-uk.vercel.app/admin/activate`

These intended values are also saved in `supabase/config.toml`. The owner must activate the emailed invitation and choose a password. Authenticated production browser/API verification remains pending that activation; no owner invitation token was used for automated sign-in.

## Verification

- Production build: passes; both admin pages and the admin proxy are present.
- Deno checks: all three Edge Functions pass.
- Database verification: `scripts/test-admin-database.sql` passes. Fixtures are rolled back. Checks include owner read access, non-member and anonymous denials, blocked role self-assignment, private credential protection, audited status/note updates, stale-write conflict and protected owner access.
- HTTP verification: 24 checks pass, including real Supabase intake, durable receipt, safe retry, mismatched payload rejection, anonymous REST denial and unauthenticated/forged Edge request denial. One synthetic quote was checked in the database and deleted afterwards.
- Browser verification: 34 checks pass at 1440×1000 and 390×844, including sign-in UI, enquiry details, conflict recovery, save requests, search/filter, team access, invitations, activity log, sign-out and activation UI. Authenticated responses use isolated UI fixtures; these checks do not claim live authenticated Edge coverage. No Auth fixture accounts or emails were created.
- Existing service regression: 290 checks pass across eight services and 26 packages.
- Archived website regression: 40 checks pass across 18 routes, exact HTML/Flight and video range handling.
- Asset verification: 3,209 files pass with no missing, empty or unresolved LFS assets.
- Security advisors: database warnings resolved. Supabase still reports its project-level leaked-password protection setting disabled; this requires Auth configuration access. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
- Performance advisors only report unused indexes on the newly created, empty tables.

## Operations

Production Vercel environment variables are configured: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ENQUIRY_WEBHOOK_URL`, and server-only `ENQUIRY_WEBHOOK_TOKEN`. Preview deployments were not granted the production integration token.

Database migrations are committed under `supabase/migrations`. The owner identity and integration credential values are operational records, not migration seeds. Deploy function sources with the corresponding `verify_jwt` configuration: user functions require JWT verification; intake validates its private integration token in the handler.

To grant a new owner role outside the staff UI, verify the Auth account and update its UUID membership through a trusted project operator. Do not put authorization roles in user metadata. Disabling a membership denies subsequent admin requests even before an existing JWT expires.

For local verification run the build, start Next.js, set `BASE_URL`, then run `node --env-file=.env.local scripts/test-admin-http.mjs`. Real intake verification is opt-in with `TEST_SUPABASE_INTAKE=1`; it writes the synthetic request UUID to ignored `.data/admin-setup/test-enquiry-id.txt` for exact cleanup. Browser tests require Playwright and Chrome paths in `BROWSER_MODULE_DIR` and `BROWSER_EXECUTABLE`.
