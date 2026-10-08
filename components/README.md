# New components

`services/` contains the shared service shell, navigation, page template, pricing
cards, comparison table, breadcrumbs, FAQs, motion and quotation form. Content
and pricing live in `content/services.mjs`. `home-directory.mjs` supplies a shared
renderer for the preserved homepage's SSR and compiled client module; its builder
updates both representations together without replacing the homepage.

Place editable React components here and import them into new App Router pages.
Existing reference pages remain served byte-for-byte through the compatibility
route so their compiled React runtime, WebGL scenes, and navigation stay intact.

Add a native page, for example app/studio/page.jsx. Explicit routes take
precedence over the compatibility catch-all. Replacing the existing homepage
with app/page.jsx is an intentional redesign and requires removing or narrowing
the optional catch-all route first to avoid an overlapping root route.
