# Optitech services upgrade

Implemented directly in the existing Next.js project. No deployment or runtime dependency installation was performed.

## Implemented

- Eight homepage service rows replace the six demo rows. The original two-column pattern, editorial type, horizontal dividers, hover scramble, arrows and 1.6-second GSAP reveal with 0.05-second stagger are reused. Metadata replaces demo logos. The existing section marquee reads “What We Do”.
- Eight reusable detail pages, with the supplied 26 packages, GBP prices and delivery estimates, service-specific offerings, inclusions, processes, five FAQs per service, final quotation CTAs and related links.
- Website-type and maintenance-plan comparison tables. Maintenance support allowances and response targets are explicit and are not guaranteed SLAs.
- Unique titles, descriptions, canonical URLs, breadcrumbs and one H1 per service. Keyboard-operable FAQs, focus styling, responsive layouts and reduced-motion support.
- A services directory, services links in both navigation systems and footer, and document navigation across the archived/native Next.js boundary. Demo projects and their media remain available under `/work`.
- Four existing service-price references synchronised with the catalogue: business websites from £799, e-commerce from £1,299, local SEO from £350/month and advertising management from £350/month. Their surrounding layouts and animation code are preserved.
- `/contact` redirects to `/contact/quote`, retaining query parameters. Package CTAs preselect their service/package; changing service clears an incompatible package. Requirements and catalogue-derived package details remain in the submitted enquiry.
- Validated POST endpoint with consent, package membership, body-size, origin and honeypot checks. A local outbox allows complete local verification. Failed delivery keeps form data; success is reported only after saving/delivery.
- Cancel-safe media streaming and removal of stale generated deployment copies that otherwise shadow editable assets in local previews.

## Routes

`/services`, `/services/web-development`, `/services/ecommerce`, `/services/seo`, `/services/google-business-profile`, `/services/digital-advertising`, `/services/ai-automation`, `/services/custom-software`, `/services/website-maintenance`, `/contact/quote`, `/api/enquiries`. The existing `/contact` entry redirects to the quotation form.

## Main source files

- `content/services.mjs`: central service catalogue, prices, comparisons, FAQs, enquiry links and archived price synchronisation.
- `app/services/[slug]/page.jsx`, `app/services/page.jsx`, `app/services/layout.jsx`: native pages and metadata.
- `app/contact/quote/page.jsx`, `app/contact/route.js`, `app/api/enquiries/route.js`: quotation flow and submission endpoint.
- `components/services/ServicePage.jsx`: shared hero, sections, pricing cards, comparison table, breadcrumbs, final CTA and related services.
- `components/services/ServiceShell.jsx`, `SiteNavigation.jsx`, `ServiceMotion.jsx`, `QuoteForm.jsx`: shared shell, accessible menu, motion and form.
- `app/services.css`: scoped styles using existing fonts and colours.
- `components/services/home-directory.mjs` and `.css`, `scripts/build-services.mjs`: repeatable homepage SSR/Flight/client integration.
- `assets/local/native-navigation.js`, `home-directory.css`, `optitech-logo.svg`: local bridge, scoped directory styles and the existing emblem.
- `lib/enquiries.mjs`: validation and delivery/local outbox.
- `lib/reference-server.mjs`: safe cancellation of media streams.
- `.env.example`, `.gitignore`, `package.json`, `README.md`, `components/README.md`, `scripts/prepare-vercel-assets.mjs`: setup, build and documentation updates.
- `scripts/test-services.mjs`, `test-services-browser.mjs`, `test-home-preservation.mjs`, `test-next.mjs`: verification.

Generated changes include `index.html`, `pages/home.rsc`, archived HTML/navigation payloads with service links or synchronised price text, and the corresponding archived client bundles. Original captures in `research/` are retained; regeneration uses `npm run content:build`.

## Verification results

| Check | Result |
| --- | --- |
| `npm run build` | Pass: all eight service pages generated |
| `npm run test:services` | Pass: 295 checks across 8 services and 26 packages, including a saved local enquiry |
| `npm run test:migration` | Pass: 40 checks; archived HTML/Flight, contact redirect and media byte ranges |
| `npm run test:home-preservation` | Pass: unrelated homepage markup, neighbouring animation modules and original global styles match the Git baseline, allowing only the four documented service-price copy updates |
| Headless Chrome / Playwright | Pass: 97 checks at 1440×1000 and 390×844; all service pages, homepage reveals/links, archived/native menus, keyboard FAQs, service/package selection, failed-submit recovery and saved enquiries |
| Asset inventory | Pass: no missing, empty or unresolved Git LFS assets |
| JavaScript syntax / `git diff --check` | Pass |
| ESLint | No lint command is configured in the project |

Browser evidence is in this folder. Test enquiry fixtures were removed from the ignored local outbox after verification. `services-results.json`, `browser-results.json` and `home-preservation.json` contain machine-readable results; the migration result is in `verification/next-results.json`.

## Remaining setup and limitations

Production quotation delivery requires an agency-owned HTTPS endpoint in `ENQUIRY_WEBHOOK_URL`, with optional `ENQUIRY_WEBHOOK_TOKEN`. It must durably accept the JSON payload and should honour `Idempotency-Key`. Configure the variables on the host before collecting production enquiries. Local file storage is not used on Vercel; an unconfigured production endpoint returns 503 without claiming success. No external recipient, email service or payment gateway has been fabricated.

The preserved mobile homepage still emits the recoverable React #418 hydration warning documented in the earlier `verification/REPORT.md`. It was recorded separately in browser results; the new native service and quote pages had no client exceptions. The in-app browser automation runtime was unavailable, so verification used the installed Chrome executable and bundled Playwright. Live deployment behaviour and delivery to an external CRM have not been tested or published.
