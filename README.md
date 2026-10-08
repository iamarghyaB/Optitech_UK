# Optitech — Next.js reference project

The reference website captured on 27 September 2026, including all 18 discovered public pages and their media.

## Open it

Run `npm install`, restore Git LFS media with `git lfs pull`, then run `npm run dev` and open **http://127.0.0.1:4173**. For production, run `npm run build` followed by `npm start`.

Node.js 20.9 or newer and Git LFS are required. You can also run `start-reference.cmd` on Windows. Keep the server running while viewing the site.

Use the local server rather than double-clicking `index.html`: the original interactive frontend needs HTTP for its modules, textures, responsive-image endpoint, video byte ranges, and page transitions.

## What is included

- `index.html`: homepage with the original Tailwind classes and inline compiled styles.
- `pages/`: the other HTML pages and the local navigation payloads.
- `assets/site/`: fonts, compiled Tailwind styles, JavaScript libraries and animation code, sound effects, logos, and texture decoder.
- `assets/cdn/`: flag videos, reel, ambient audio, and compressed animation textures.
- `assets/cms/`: project images, videos, logos, and image-size variants.
- `assets/optimized/`: cached responsive images from the original image endpoint.
- `assets/local/`: local reference behavior and disabled analytics stub.
- `server.mjs`: retained original server for comparison. Normal development and production now run through Next.js; no proxy to the original website is used.
- `research/`: original downloaded pages, source bundles, and download inventories.
- `verification/`: desktop/mobile screenshots, layout measurements, and check results.

## Fidelity and implementation

This is a localized copy of the **publicly shipped frontend**, preserving its existing HTML, Tailwind CSS, React/Next runtime, GSAP motion, graphics code, fonts, and media. It is not a rewritten approximation or the original author's uncompiled source project. Asset URLs and navigation payloads were adjusted for local serving; animation timing, easing, shader code, and responsive rules were retained.

The homepage's eight measured section boxes and hero typography match the reference at 1440 × 900 and 390 × 844. Menu opening/closing, navigation, project hovers, service media, reel playback, footer, and mobile menu were inspected in-browser. The automated checker also verifies every captured route, directly linked assets, previously missing assets, and video byte-range support.

Animations, randomized text/logo states, video frames, pointer effects, and graphics performance vary with timing and hardware, so the screenshots are not a claim that every frame on every device is pixel-identical. Both the live site and the local copy emitted the same recoverable React hydration warning during mobile viewport emulation; the visible mobile layout and menu completed correctly. See `verification/REPORT.md`.

Analytics are disabled. The preserved contact wizard is kept as a reference capture; `/contact` now redirects to the working quotation form at `/contact/quote`. Production enquiry delivery requires the setup described below. Retained third-party project imagery is labelled as demo/reference media, not Optitech client work.

## Working with the reference

Use this folder as a visual/motion reference for your later tech-service site. Content also exists in the original runtime and navigation payloads: editing only the rendered HTML is not sufficient for a reliable rebrand. Build editable components for the new company when adapting the design.

`npm run content:build` (also `npm run build:reference`) regenerates the preserved pages and applies Optitech copy without network access. `npm run build` builds Next.js. `npm run verify` checks the running local server and saved layout comparisons. Download scripts are provided for provenance and are not needed for normal use.

## Git LFS media setup and recovery

Images, MP4 videos, and KTX2 animation textures are tracked with Git LFS. A tiny file beginning with `version https://git-lfs.github.com/spec/v1` is a pointer, not playable media. Serving these files can return HTTP 200 while the hero, images, and videos remain broken.

After cloning, install Git LFS if needed, then run `git lfs install` and `git lfs pull` in this folder. For an existing clone with the objects already cached, `npm run assets:restore` restores the real files without redownloading them. Keep the current filenames: page payloads reference their exact URLs.

`npm start` and `npm run verify` now check for missing, empty, and unresolved LFS assets before proceeding. Run `npm run check:assets` separately at any time. Restore the objects instead of replacing the animation or excluding media from Git.

## Next.js structure

- `app/layout.jsx`: shared layout for future native Next pages.
- `app/[[...slug]]/route.js`: serves the 18 preserved reference pages and their original React navigation payloads.
- `app/api/reference-image/route.js`: preserves the responsive image endpoint through a rewrite.
- `lib/reference-server.mjs`: local media streaming, correct MIME types, byte ranges, and LFS-pointer protection.
- `components/`: place new editable React components here.
- `next.config.mjs`: Next configuration and image endpoint compatibility.

The current visual frontend remains the original compiled reference. It has not been rewritten into editable JSX sections: Next.js owns request routing while the preserved frontend owns its existing animations and hydration. This avoids altering appearance, timings, media, or transitions.

Add future native routes with files such as `app/studio/page.jsx`; explicit routes take precedence over the compatibility catch-all. To replace the homepage with native JSX, first narrow/remove the optional catch-all root handler to avoid overlapping routes. Existing styles are already compiled, including Tailwind utilities; no CSS reset has been introduced.

Keep `assets/`, `pages/`, `index.html`, and `routes.json` in the deployment alongside the Next build. This uses the Node.js runtime, not static export. Images continue to use the captured optimizer cache; the `/_next/image` endpoint is reserved for reference compatibility. For new native pages, use regular images or unoptimized Next Image until you intentionally replace that compatibility endpoint.

Commands:
- `npm run dev`: Next development server on port 4173.
- `npm run build` / `npm start`: production build / Next production server.
- `npm run test:migration`: byte-identical HTML/RSC checks, video range checks, and blocked form POST checks. Set `BASE_URL` to the running server URL; this test defaults to port 4181.
- `npm run verify`: full original route and asset suite, defaulting to port 4173. Also supports `BASE_URL`.

Git LFS must hydrate files before build/start. All original media remains tracked in LFS, with no substitutions or recompression. The original `server.mjs` is not needed to run Next.
## Editing Optitech content

Edit `content/agency-content.mjs` for agency copy, services, GBP starting prices, FAQs and process stages, then run `npm run content:build`. The generator updates HTML, byte-counted Flight navigation records and application-bundle copy together. Library exports, stylesheets, animation timing and shaders are preserved. The original captures in `research/` make regeneration repeatable.

The original contact wizard capture is retained in `pages/contact.html` for reference. Public contact links now reach the native quotation flow described below.

## Digital services and quotation requests

The homepage demo directory is now an eight-service directory. The original two-column pattern, typography, dividers, hover scramble, arrow effects and GSAP reveal timing are reused. Demo projects and media remain available at `/work`. Other homepage layouts and animation modules are preserved; four existing service price references are synchronised with the catalogue (business websites £799, e-commerce £1,299, local SEO £350/month and advertising management £350/month).

- `/services`: service directory.
- `/services/web-development`, `/services/ecommerce`, `/services/seo`, `/services/google-business-profile`.
- `/services/digital-advertising`, `/services/ai-automation`, `/services/custom-software`, `/services/website-maintenance`.
- `/contact/quote`: quotation form, accepting `service` and optional `package` query parameters.
- `/contact`: redirects to the quotation form, preserving query parameters.
- `/api/enquiries`: validated JSON enquiry submission endpoint.

Edit `content/services.mjs` for service content, all 26 packages, GBP prices, delivery estimates, FAQs, comparisons and care-plan allowances. New pages use the reusable components in `components/services/` and scoped styles in `app/services.css`. The existing emblem and fonts are local assets. No runtime dependency was added.

`scripts/build-services.mjs` applies the directory to the archived HTML, embedded hydration data, Flight payload and one compiled homepage module. It adds menu/footer links and a document-navigation bridge between the two Next.js builds. `npm run content:build` regenerates everything from the retained captures; `npm run build` also reapplies services before compiling. On a local build, stale generated `public/assets` deployment copies are removed so they cannot shadow the editable source assets. Vercel builds generate fresh static copies as before.

### Enquiry delivery setup

Copy `.env.example` to `.env.local` and configure `ENQUIRY_WEBHOOK_URL` with an agency-owned **HTTPS** CRM/form endpoint. `ENQUIRY_WEBHOOK_TOKEN` optionally sends a bearer token. Add these variables in the production host's settings too. The endpoint must durably accept the JSON enquiry and return a successful HTTP status. It should honour `Idempotency-Key` to prevent duplicate deliveries after a retry. No recipient address or external service has been invented, and no payment flow is implemented.

The payload includes an enquiry UUID, creation time, customer details, requirements, consent, service slug/title and the selected package ID/name/indicative price/delivery estimate. Package details are derived from the catalogue on the server. Inputs, package membership, request size and request origin are checked; a honeypot rejects automated form fills. Failed requests retain form values and show an error rather than a success notice.

Development without a webhook saves enquiries to `.data/enquiries/<id>.json`, ignored by Git. For a local production preview, set `ENQUIRY_TRANSPORT=local`. The success notice explicitly says the enquiry was saved locally and was **not delivered**. Local file storage is never used on Vercel. An unconfigured production deployment returns HTTP 503 and does not claim that an enquiry was received.

### Verification

Run `npm run build`, then start a local preview with the local transport. Set `BASE_URL` if its port differs from 4181. Run `npm run test:services` and `npm run test:migration`. Set `TEST_LOCAL_ENQUIRIES=1` only for a local preview to verify saved submissions; test fixtures are deleted afterwards. `npm run test:home-preservation` compares unrelated homepage markup, neighbouring animation modules and original global styles against the Git baseline.

`scripts/test-services-browser.mjs` uses Playwright when available, with optional `BROWSER_MODULE_DIR` and `BROWSER_EXECUTABLE`. It checks desktop/mobile rendering, homepage links and reveals, keyboard FAQs/menu, package selection, failed-submit recovery and optional local submission. Evidence is saved under `verification/services/`. The previously documented recoverable React #418 warning on the preserved mobile homepage is reported separately. There is no ESLint command configured; Next.js compilation and JavaScript syntax checks are used. See `verification/services/REPORT.md` for the final results and limitations.
