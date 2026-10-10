The footer artwork replaces the inherited Pensatori / Irrazionali wordmark with
OPTITECH and decorative Optitech lettering. `footer-brand.json` contains the
outlined letter paths, so browsers need no extra fonts or remote assets.

The uppercase wordmark uses Georgia Bold outlines. The script uses the Ballet
font already bundled with the website. Both retain the original SVG footprint
(1920 × 686), foreground colour, background gradient and three-colour rule.

`scripts/build-footer-brand.mjs` produces `assets/local/optitech-footer.svg` and
the identical inline artwork in archived HTML and the three client bundles.
It runs after the content builders so future builds retain the new branding.
Footer links, scroll animations, wrappers and styles are preserved.
