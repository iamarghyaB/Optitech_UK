# Responsive update

Preserved the archived media, GSAP/WebGL animations and desktop horizontal work gallery. Added a shared responsive stylesheet to all 18 HTML routes through the repeatable reference build.

Fixed footer overflow (baseline: 926px document at 768px, 1331px at 1280px), long service rows, clipped Optitech lettering, short-screen menu height and native scrolling, small-screen form input sizing, touch target sizes and clipped contact choices at 1024px. The gallery is contained below its existing 1280px stacked-layout breakpoint, including during hydration.

Validation: 63 browser layout observations at 320, 390, 768, 1024, 1440 and 1920px. Every checked page fit its viewport; the desktop work gallery intentionally scrolls horizontally. At 844x390 the menu scrolled natively by 92px and exposed the final link within the panel. Tablet and narrow-phone enquiry steps advanced, and the phone Back button worked. All three entry choices fit the measured contact form at 1024px.

Next.js 16.3.6 Vercel-mode production build passed. All 3206 assets passed inventory/LFS checks. All 18 HTML and 18 Flight responses matched their generated files, and the responsive stylesheet returned its exact contents.

The archived frontend retains the previously documented recoverable React 418 hydration warning on responsive views. The contact form still has no configured delivery backend. No claim of testing every physical device is made; these are browser viewport checks.
