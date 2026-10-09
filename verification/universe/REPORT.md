# Optitech Universe photo replacement

## Outcome

`/universe` now displays 14 distinct supplied workplace, development and equipment photographs. The previous gallery data contained 38 records, representing 29 images, eight videos and one record without media. Those records are replaced completely; no old gallery photographs or videos remain in either the initial HTML Flight payload or navigation RSC response.

The original infinite WebGL gallery controls tile placement and repetition. Its renderer, responsive presets, geometry, shaders, hover/focus transitions, animation timings, wheel/drag controls, stars, parallax, grain and audio code are unchanged. Photo aspect ratios are passed to its existing image-sizing logic: the processed photos are not cropped, stretched or retouched. No dependencies were added.

The original heading was screen-reader-only. That placement is retained, with “The People Behind the Work” and the supplied Optitech/Makezaa description. Neutral focus captions describe scenes without inventing names, roles, qualifications or achievements. Metadata and accessible photo descriptions are updated. No visible heading or new text block was introduced over the gallery.

## Files

- `content/universe.mjs`: ordered captions, descriptive alt text and page copy.
- `content/universe-images.json`: processed image dimensions and responsive asset locations.
- `assets/universe/`: 14 original-resolution WebP derivatives, capped at 2560 pixels wide, and 42 responsive derivatives at up to 480/960/1536 pixels. Source resolution is never enlarged. EXIF orientation is applied and personal metadata is omitted. Combined size: 9,591,018 bytes.
- `scripts/build-universe.mjs`: repeatable replacement of route-specific HTML/Flight/RSC data; preserves byte-counted Flight text records.
- `pages/universe.html`, `pages/universe.rsc`: generated route files.
- `assets/site/_next/static/chunks/08-om41l.yg-h.js`: defers the header's initial media-query read on `/universe`, using the existing `/work` hydration fix. Its later responsive behaviour is unchanged. This resolves a mobile hydration error observed on the previous production page.
- `package.json`: adds Universe generation to build/content pipelines and `test:universe`.
- `scripts/test-universe.mjs`: browser and image verification.
- `verification/universe/`: desktop/tablet/mobile screenshots, focus/drag/wheel states and results.

## Used attachments

| Supplied photo | Asset name |
| --- | --- |
| WhatsApp Image 2025-06-15 at 21.58.17_dcd64e32.jpg | team-at-work |
| optitech (1).jpeg | electronics-testing |
| optitech (2).jpeg | research-workspace |
| optitech (3).jpeg | hardware-upgrades |
| optitech (4).jpeg | hardware-components |
| optitech (5).jpeg | web-development-workspace |
| optitech (6).jpeg | local-ai-workspace |
| optitech (7).jpeg | keyboard-and-controllers |
| optitech (8).jpeg | keyboard-configuration |
| optitech (9).jpeg | network-cable-testing |
| optitech_image (8).jpg | interface-prototyping |
| optitech_image (10).jpg | production-workspace |
| optitech_image (11).jpg | mobile-app-development |
| optitech_image (12).jpg | mobile-development-workspace |

All 23 supplied attachments were visually inspected, and their local dimensions/orientation were checked before selection. The originals remain untouched.

## Unused attachments

| Attachment | Reason |
| --- | --- |
| optitech_image (1).jpg | Footwear design scene; less relevant to the requested digital team gallery. |
| optitech_image (2).jpg | Illustrated/composited programmer graphic; excluded under the authentic photograph requirement. |
| optitech_image (3).jpg | Staged outdoor desk scene; excluded in favour of direct workplace material. |
| optitech_image (4).jpg | Medical study scene; unrelated to the digital services focus. |
| optitech_image (5).jpg | Generic posed laptop portrait; no identified team context, and stronger workplace images were available. |
| optitech_image (6).jpg | Café image with large editorial/music/date overlays; less suitable for a clean behind-the-scenes photo. |
| optitech_image (7).jpg | Stylised computer-in-a-field scene; excluded in favour of direct workplace material. |
| optitech_image (9).jpg | Coding poster/illustration, rather than a team photograph. |
| codex-clipboard-58aab196-b52d-4d58-a69b-c8c0e39b30dd.jpg | Duplicate of optitech (5).jpeg. |

These selection reasons concern relevance and visible presentation; they do not claim verified identities or provenance for unidentified people.

## Verification

- Production build passes; all 3326 workspace assets pass the existing asset validation.
- 96 browser/image checks pass: 1440×1000 desktop, 820×1180 tablet, 390×844 mobile; WebP decoding, dimensions, responsive aspect ratios, titles/copy, accessible descriptions, no overflow, original canvas, focus/close, dragging and wheel interaction.
- Zero browser runtime errors and zero failed page/asset requests in the tested flow.
- Build generation is idempotent: a second run leaves both generated route files byte-identical.
- The full WebGL renderer is byte-identical to the previous Git commit.
- No unrelated HTML/RSC page or CSS file changed.
- `git diff --check` passes. There is no configured lint script.

## Existing limitations

The local production build retains the existing Turbopack dynamic-filesystem tracing warning in `lib/reference-server.mjs`; no new build error was introduced. The gallery remains the original canvas presentation, so its images are described by an accessible text list rather than DOM image elements. The original initial viewport can show partial tiles at its edges; focusing a tile brings its complete photograph into view. Browser checks verify the responsive viewports and interactions, not a frame-rate guarantee on every physical device.
