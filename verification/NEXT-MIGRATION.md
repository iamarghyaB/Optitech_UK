# Next.js migration verification — 28 September 2026

- Next.js 16.3.6 production build passes.
- All 18 existing routes return byte-identical saved HTML and original RSC navigation payloads (36 content comparisons).
- Five additional checks cover normal/suffix/invalid MP4 byte ranges, HEAD, and blocked POST submissions: 41 migration checks total.
- Full existing inventory suite: 3,495 checks, zero failures. Saved original layout comparisons also remain unchanged; these are not new layout measurements.
- Browser: desktop hero rendered, flags video playing (readyState 4), no broken loaded images or desktop console errors. Animated navigation to /work completed correctly.
- Mobile at 390 x 844: hero visible, no horizontal document overflow and no broken loaded images. The original recoverable React #418 hydration warning still occurs under mobile emulation, as documented before migration; the visual page completes correctly.
- No changes to assets/, index.html, pages/, or routes.json. Existing Git LFS media contents are retained.

Architecture: Next App Router route handlers serve the original full reference documents and media. This is a framework/server migration, not a rewrite of the compiled frontend into JSX. New explicit native App Router routes can be added alongside the compatibility catch-all.

Evidence: next-hero.png, next-results.json, results.json.