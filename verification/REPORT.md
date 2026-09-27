# Verification report

Reference: https://pensatori-irrazionali.com/ — captured 27 September 2026.

## Confirmed

- 18 public routes captured: Home, Work, Universe, Contact, Clients, the two policy pages, and 11 project detail pages.
- Main download completed with 3,098 files and zero download failures. Additional dynamically constructed logos, texture frames, scripts, and media were acquired separately.
- All media, fonts, styles, decoder files, and animation scripts are served from this project's `assets` folder.
- Original Tailwind utility rules, animation durations/easings, and graphics code were preserved.
- Desktop comparison: 1440 × 900; all eight measured homepage section rectangles and the hero paragraph's text, font family, size, line height, and rectangle match exactly.
- Mobile comparison: 390 × 844; the same geometry and typography checks match exactly.
- Browser checks: hero playback, entrance sequence, desktop/mobile menu, internal navigation, project hover previews, service media, reel playback, footer and back-to-top control, Work gallery and contact form steps.
- HTTP checks: captured HTML routes, React navigation responses, linked assets, recovered dynamic assets, and partial video requests. See `results.json` for the final count.

## Evidence

`desktop-layout.json` and `mobile-layout.json` contain both sets of measurements. Paired `reference-*.png` and `local-*.png` files show the observed views. Video and continuously animated content may be at different playback phases in paired captures.

## Limits and deliberate differences

- This preserves the site's distributed frontend rather than reconstructing its private source components or backend.
- Contact submission and analytics are disabled for this local reference.
- Both original and local pages logged React error 418 during mobile viewport emulation, then recovered and rendered the matching layout. It was also present on the reference site.
- No claim is made that all frames, random states, GPUs, browser engines, or physical devices have been exhaustively tested. Browser testing used the installed Chromium-based browser.
- No website was published and no messages were sent to the original company.
