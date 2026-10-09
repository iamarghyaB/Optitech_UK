# Optitech portfolio content integration

Verified on 9 October 2026. The existing Work carousel, mobile card layout,
typography, gallery hover behaviour, GSAP opening transitions and automatic
next-project animation are retained. No homepage sections were added or changed.

## Published projects and routes

The Workers Agency and NewMRKT appear first. Makezaa's five published projects
follow in the source order at [Makezaa Projects](https://www.makezaa.com/projects).
No completion dates are published, so none are assigned.

| Project | Optitech detail route | Verified live website |
| --- | --- | --- |
| The Workers Agency | `/work/the-workers-agency` | https://theworkersagency.com/ |
| NewMRKT | `/work/newmrkt` | https://www.newmrkt.com/ |
| An-Noor | `/work/an-noor` | https://annoor.co.uk/ |
| Campusflow | `/work/campusflow` | https://campusflow.makezaa.com/ |
| Nike Air Max Showcase | `/work/nike-air-max-showcase` | https://makezaa-shoegrab-au.vercel.app/ |
| Makezaa Platform | `/work/makezaa-agent-ready-platform` | https://www.makezaa.com/ |
| Golden Touch Contractors | `/work/golden-touch-contractors` | https://goldentouchcontractors.com/ |

The live URLs returned HTTP 200 in browser checks. The Workers Agency footer
credits Makezaa. Its WordPress, Elementor and Tailwind assets were identified.
NewMRKT's Shopify assets, collection navigation and product options were inspected.
No checkout, donation, recruitment or customer account transaction was submitted.

## Content and image sources

All five Makezaa detail pages were inspected. Their source URLs and evidence notes
are stored with each record in `content/projects.mjs`. Makezaa publishes one cover
per project and no additional gallery images on those detail pages. Those five
covers are used unchanged apart from WebP optimisation. Additional live homepage
screenshots were captured for the five projects.

The Workers Agency has a homepage cover and an employer page screenshot.
NewMRKT has homepage, collection and product page screenshots. All 15 authentic
images are under `assets/portfolio/`, with 45 smaller versions at 256, 640 and
1280 pixels. Images total approximately 2.4 MB, including responsive versions.
No stock or generated project imagery is used. Descriptive alt text and the
existing cropping rules are retained.

Every detail page includes an overview, verified features, technology information,
screenshots, a safe external live link, the requested enquiry CTA, breadcrumbs
and related work. Listing and details carry delivery attribution to Makezaa.
The Nike interface is expressly labelled as a concept, with no Nike commission
or operational checkout claim. Campusflow's technology stack is not specified
in its public case study and is explicitly left unspecified. Business metrics
and unverified client-management claims are excluded.

## Implementation

- `content/projects.mjs`: one shared data source for seven projects.
- `components/portfolio/sections.mjs`: shared content renderer using existing classes.
- `scripts/build-portfolio.mjs`: repeatable SSR/Flight content integration and image variants.
- `scripts/portfolio-archive.mjs`: renders the existing archived components for SSR.
- `pages/work.html`, `pages/work.rsc`, seven new HTML/Flight pairs and `routes.json`.
- Existing compiled Work/detail components: data, image, accessibility and content additions.
- `assets/local/portfolio.css`: attribution placement, focus indicators and long-title wrapping.
- `lib/reference-server.mjs`: local responsive image resolution and legacy demo redirects.
- `package.json`: includes portfolio generation in the normal build and content rebuild.
- Existing services navigation/footer: “Demo Work” label changed to “Work”.

Eleven previous demo URLs redirect to `/work`; they are absent from the public
route map. Carousel loop copies are preserved for the existing infinite-scroll
animation; only one copy of each project enters the keyboard tab order.

A pre-existing mobile header hydration mismatch was reproduced on the previous
production Work page. Portfolio routes now initialise its media queries to match
the SSR header before applying the same responsive behaviour. Unrelated routes
and header animations remain unchanged. Content generation is idempotent.

## Verification

- Production Next.js build passed.
- Portfolio browser/HTTP verification: **216 checks**, all seven detail pages at
  desktop 1440px, tablet 820px and mobile 390px; **zero runtime or asset errors**.
- Verified source order, seven accessible cards, hover title reveal, carousel
  dragging, keyboard opening transitions, covers, gallery loading, metadata,
  canonical URLs, headings, live URLs, enquiry links and eleven legacy redirects.
- Services regression checks: **290 passed** across eight services and 26 packages.
- Compatibility checks: **32 passed** across 14 routes, including HTML/Flight
  responses and video byte ranges.
- Homepage preservation check passed: unrelated markup, neighbouring animation
  modules and original styles remain unchanged.
- All 3270 assets are present and restored from Git LFS.
- `git diff --check` passed. This repository has no lint command; JavaScript
  syntax parsing and the production build passed.

Browser evidence and machine-readable results are saved in this folder. Source
research and extra diagnostic captures remain in the ignored `.data/portfolio/`
directory. No portfolio-specific manual configuration is required.
