# Pensatori Irrazionali — local reference

The reference website captured on 27 September 2026, including all 18 discovered public pages and their media.

## Open it

Run `npm start` in this folder, then open **http://127.0.0.1:4173**.

Node.js is the only requirement. There is no npm install step. You can also run `start-reference.cmd` on Windows. Keep the server running while viewing the site.

Use the local server rather than double-clicking `index.html`: the original interactive frontend needs HTTP for its modules, textures, responsive-image endpoint, video byte ranges, and page transitions.

## What is included

- `index.html`: homepage with the original Tailwind classes and inline compiled styles.
- `pages/`: the other HTML pages and the local navigation payloads.
- `assets/site/`: fonts, compiled Tailwind styles, JavaScript libraries and animation code, sound effects, logos, and texture decoder.
- `assets/cdn/`: flag videos, reel, ambient audio, and compressed animation textures.
- `assets/cms/`: project images, videos, logos, and image-size variants.
- `assets/optimized/`: cached responsive images from the original image endpoint.
- `assets/local/`: local reference behavior and disabled analytics stub.
- `server.mjs`: local-only server; does not proxy requests to the original website.
- `research/`: original downloaded pages, source bundles, and download inventories.
- `verification/`: desktop/mobile screenshots, layout measurements, and check results.

## Fidelity and implementation

This is a localized copy of the **publicly shipped frontend**, preserving its existing HTML, Tailwind CSS, React/Next runtime, GSAP motion, graphics code, fonts, and media. It is not a rewritten approximation or the original author's uncompiled source project. Asset URLs and navigation payloads were adjusted for local serving; animation timing, easing, shader code, and responsive rules were retained.

The homepage's eight measured section boxes and hero typography match the reference at 1440 × 900 and 390 × 844. Menu opening/closing, navigation, project hovers, service media, reel playback, footer, and mobile menu were inspected in-browser. The automated checker also verifies every captured route, directly linked assets, previously missing assets, and video byte-range support.

Animations, randomized text/logo states, video frames, pointer effects, and graphics performance vary with timing and hardware, so the screenshots are not a claim that every frame on every device is pixel-identical. Both the live site and the local copy emitted the same recoverable React hydration warning during mobile viewport emulation; the visible mobile layout and menu completed correctly. See `verification/REPORT.md`.

Analytics are disabled. Contact forms are visual references and cannot send messages. External editorial/social/map links remain external. The original branding and media remain in place for reference.

## Working with the reference

Use this folder as a visual/motion reference for your later tech-service site. Content also exists in the original runtime and navigation payloads: editing only the rendered HTML is not sufficient for a reliable rebrand. Build editable components for the new company when adapting the design.

`npm run build` regenerates the localized files from `research/` without network access. `npm run verify` checks the running local server and saved layout comparisons. Download scripts are provided for provenance and are not needed for normal use.
