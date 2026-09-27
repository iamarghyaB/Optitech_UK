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

Analytics are disabled. Contact forms are visual references and cannot send messages. External editorial/social/map links remain external. The original branding and media remain in place for reference.

## Working with the reference

Use this folder as a visual/motion reference for your later tech-service site. Content also exists in the original runtime and navigation payloads: editing only the rendered HTML is not sufficient for a reliable rebrand. Build editable components for the new company when adapting the design.

`npm run build:reference` regenerates the localized reference files from `research/` without network access. `npm run build` builds Next.js. `npm run verify` checks the running local server and saved layout comparisons. Download scripts are provided for provenance and are not needed for normal use.

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