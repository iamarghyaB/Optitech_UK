# Brand section verification

Six logos included: Makezaa, An-Noor Welfare Trust, NewMRKT, Elite Studios, phoenix and SuperSystem. Golden and Touch excluded following the user's explicit instruction.

## Asset preservation

- Local assets: `assets/brands/`; provenance: `assets/brands/SOURCES.md`.
- Total size reduced from 1,606,030 to 1,484,657 bytes, without resizing or repainting artwork.
- All PNG source and output RGBA pixels match exactly at original dimensions; ICC profiles retained.
- All SVG source and output RGBA pixels match exactly at widths 256, 512 and 1024. ViewBoxes, artwork, colours, gradients and original backgrounds retained.
- Files served directly so a secondary image optimiser cannot change their colours or alpha.

## UI preservation

Compared with commit `bfeaf6f6ff8626ab1dedefee3839a4772da55511`:

- Homepage markup outside the brand section and all Flight records are byte-identical.
- Every neighbouring module in the homepage bundle is byte-identical.
- Original grid classes, responsive cell counts (10 desktop/mobile, 9 tablet), maps, scroll reveals and fade timings remain byte-identical after excluding changed logo data and copy.
- All global styles remain unchanged. Existing `object-contain` preserves image proportions; no colour filters added.
- Original six-brand rotation repeats across the existing cells rather than changing the grid.

The current production homepage was independently checked before this update and produced React hydration error #418 at both 820px and 390px. The archived media-query hook now defers its initial value only on `/` until its existing layout effect, matching desktop server markup. Other routes and subsequent responsive changes retain the original behavior. This resolves the pre-existing tablet/mobile hydration error without changing the UI.

## Validation

- Production build passed, with the existing dynamic filesystem tracing warning.
- Brand generation is idempotent and included in normal builds and reference rebuilds.
- Browser checks cover 1440×1000, 820×1180 and 390×844, plus reduced motion: local assets decode, correct alt text, original cell counts, visible description, no stretching, no horizontal overflow, actual intermediate fade frames and changing logo sources.
- No browser runtime errors or failed HTTP requests in the final checks.
- Existing services checks passed: 290 checks across 8 services and 26 packages.

See `asset-comparison.json`, `browser-checks.json` and the three viewport screenshots for recorded evidence.
