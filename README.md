# MOON — Satoshi theme demo build

An interactive, clickable demo of **moonalienlike.com** rebuilt on the design language of the
**Satoshi** Shopify theme ([themes.shopify.com/themes/satoshi](https://themes.shopify.com/themes/satoshi)),
using the brand's own one-pager as the brief and the brand's live product catalogue as data.

Reference stores used for the visual direction: [11-11.in](https://11-11.in),
[almostgods.com](https://almostgods.com), [norblacknorwhite.in](https://norblacknorwhite.in).

---

## Run it

No build step, no dependencies. Either:

```bash
# from this folder
python3 -m http.server 4317
# then open http://127.0.0.1:4317/index.html
```

Serving it is the tested path. Double-clicking `index.html` should also work in Chrome and Safari
(every asset is referenced relatively, loaded with plain `<script>` tags, and there is no
`fetch`/`XHR`, so nothing hits a cross-origin wall) — but that route was not machine-verified here,
and some browsers restrict `localStorage` on `file://`, in which case the cart simply won't persist
between page loads. Use the local server if you want the exact behaviour described below.

## Pages

| Page | What it is |
| --- | --- |
| [index.html](index.html) | Homepage — hero, swipeable category rail (all five collections), featured grid, Boot Leg '72 craft story, WILD capsule, MOON World, brand pillars, studio notes, newsletter |
| [shop.html](shop.html) | Collection grid with category facets, sorting, quick-add and deep links (`?collection=bottoms&sort=price-asc`) |
| [product.html](product.html) | Product detail, driven by `?handle=…` — gallery, real per-variant availability, colourways, accordions, maker block, related pieces |
| [about.html](about.html) | **The Visionaries** — the full brand DNA from the one-pager, published as a page |
| [journal.html](journal.html) | MOON World — drop logs, maker stories, the ₹10,000 series, community |
| [contact.html](contact.html) | Contact form, stockists, shipping/sizing/care FAQ |

## Structure

```
assets/css/satoshi.css    design system: type scale, grid, cards, drawers, PDP, responsive
assets/js/products.js     generated product data — do not hand-edit
assets/js/site.js         chrome injection, cart, search, and every page renderer
assets/img/favicon.svg    crescent mark
tools/build-products.py   regenerates products.js from the Shopify export
```

The header, announcement bar, drawers and footer are injected by `site.js` into
`#moon-chrome-top` / `#moon-chrome-bottom`, so navigation only has to be maintained in one place.

## Regenerating the product data

```bash
python3 tools/build-products.py
```

It reads the Shopify export and rebuilds `assets/js/products.js`: 11 products, 77 images, real
prices, sizes, colourways, fabrics and metafields. Variant rows in a Shopify export only carry
option *names* on the first row of each product, and the export mixes `s` with `S` — the script
handles both, and keeps the label's own colour order.

It also carries a `BODY_OVERRIDES` map. The export's own copy leans on one boilerplate paragraph
("crafted by a 72-year-old master tailor…") that read the same on every surface, so Boot Leg '72's
description is replaced in the script rather than in the generated file — a rebuild reproduces it
byte for byte instead of reverting to the export.

## Layout rules worth keeping

Two rules keep the top of the page from being clipped, and both are load-bearing:

- **The hero is sized by its copy.** `.hero__media` is absolutely positioned behind `.hero__inner`,
  which sets the height with `min-height: clamp(560px, 90svh, 1000px)`. A long headline or a short
  viewport makes the hero *taller* instead of pushing the first line out of view — a fixed height
  plus `justify-content: flex-end` silently clipped it. The top padding also clears `--header-h`,
  and a band at the bottom is reserved for the scroll hint so it can never land on the buttons.
- **The header is selected explicitly.** `<body>` carries `data-header` (the page's header mode) as
  well as the rendered `<header>`, so the transparent-over-hero state must be applied to
  `header[data-header]`. It is also never hidden on scroll: the shop toolbar, product gallery and
  thumbnails are sticky offsets of `--header-h`, so a header that slides away leaves a gap above
  them.

## What is real vs. placeholder

**Real (straight from the export):** product titles, descriptions, body copy, prices (₹999–₹3,799),
sizes S/M/L and One Size, colourways, fabrics, fit/rise/neckline/sleeve metafields, inventory-based
availability (Jorts-cum-pants is genuinely out of stock at 0 units and renders as sold out), and all
77 product images, served from the brand's Shopify CDN with width parameters.

**Replaced for the demo:** shipping thresholds and returns wording, size-guide prose, contact
details and social links, and the checkout — the cart is real and persists to `localStorage`, but
Checkout and Buy-it-now stop at an explanatory toast instead of a payment flow.

**Not included:** customer accounts, payment/UPI integration, discount codes, order tracking,
Shopify search-and-discovery apps. Those come from the platform once this design is applied to the
real Satoshi theme.

## Mapping back to Shopify Satoshi

The section stack here mirrors Satoshi's own sections so it can be rebuilt in the theme editor:
announcement marquee → header with mega/drawer nav → full-bleed hero with overlay → swipeable
collection-list rail (all five collections, snap scrolling, arrows above 820px) → featured
collection grid with hover-swap cards and quick-add → image-with-text craft
block → inverted capsule collection → editorial cards → rich text pillars → testimonial quotes →
newsletter → multi-column footer. On the product template: thumbnail-rail gallery, variant pickers,
accordion blocks, related products and a sticky add-to-cart bar on mobile.

## Verified

Served locally and driven through a real browser: every page renders with no console errors and no
failed requests; category facets, sorting, search, quick-add, variant selection, cart
quantity/remove, cart persistence across navigation, mobile drawer at 390px, keyboard `Esc`,
`⌘K` search and the sold-out state were all exercised. No horizontal overflow at 1440px or 390px.

The hero was measured at 390×844, 820×1180, 1024×768, 1440×700, 1600×980: the copy never starts
above the viewport, never sits under the header, and the scroll hint never overlaps the buttons. The
headline lands in 3 lines from 1024px up (its designed breaks are dropped below 900px where they
would not fit) and the demo banner stays one line on a phone.

Every image was measured against the boxes it renders in (74 unique files, all resolving). 68 are
portrait or square and crop between 11% and 30% in the 4:5 cards and 3:4 tiles (median 17% and
11%) — normal for a lookbook grid. The other 6 are wide uploads, including 4:1 website
screenshots: cropped with `cover` those lost up to 81% of themselves and read as an unreadable
sliver, so `site.js` tags anything wider than 1.2:1 and they are letterboxed on the paper
background instead. The hero crop was set to `center 6%` for the same reason — at the previous
22% the model's head sat outside the frame.
