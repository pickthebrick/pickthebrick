# Al Salhiya Lighting import - ON HOLD, do not run

**Rejected 2026-08-11: too residential/decorative for an office fitout
catalog (crystal chandeliers, ornate multi-arm pendants) - not office-like.**
Left here for reference only. Do not run `import.mjs` in this folder against
production. A replacement supplier/product set for Single Pendant,
Cluster / Multi-Drop, and Feature Installation (plus Elitco's rejected Wall
Sconce picks) is being re-researched - see task tracking. `../elitco/`'s
current import excludes Wall Sconce for the same reason and is safe to run on
its own.

Real pendant and feature-lighting products scraped from
salhiyalighting.com (Al Salhiya Lighting, a UAE lighting retailer) to
replace part of the 60 generic placeholder Lighting products on the live
site. Covers the decorative/pendant half of the Lighting taxonomy that
elitco.com's catalog is thin on. The technical/functional half (downlights,
track, profile, panel, wall sconce) is sourced separately from elitco.com -
see `../elitco/`.

- `import-ready.json` - 9 real products across 2 types / 3 subtypes, curated
  to match PTB's existing Lighting taxonomy exactly (case-insensitive label
  match against production): `Pendant Lights > Single Pendant`, `... >
  Cluster / Multi-Drop`, `Decorative / Feature Lighting > Feature
  Installation`.
- `import.mjs` - posts `import-ready.json` to
  `POST /api/admin/products/import`, which re-hosts each image via R2
  server-side.
- `../../admin/delete-placeholder-products.mjs` - bulk-deletes existing
  products by category (used to clear the 60 placeholders first - run once
  before both `../elitco/import.mjs` and this script).

## No downloadable datasheets

salhiyalighting.com doesn't publish downloadable PDF datasheets on its
product pages either - only the product name/description and a price. What
technical detail is available (finish, arm/drop count, wattage, color
temperature where shown) is captured as structured `specs` entries on each
product instead of a `downloads` link, since there's no real PDF to point to.
See `../elitco/README.md` for the same note in more depth.

## Source pages scraped (2026-08-11)

- https://salhiyalighting.com/en/indoor/pendant-lights-217 (single pendants)
- https://salhiyalighting.com/en/indoor/chandeliers (cluster/multi-drop pendants + feature installations)

Prices are salhiyalighting.com's listed AED prices (the current discounted
price shown on-site), used as-is for our `rate` field (no install charge
concept in this app - see AGENTS.md/architecture notes). Images are
hot-linked from Salhiya's own CDN
(`salhiyalighting.com/media/catalog/product/...`) in this file only as scrape
metadata - the import API downloads and re-hosts them to our own R2 bucket at
import time, so production never depends on Salhiya's site staying up.

## How to run

Don't - see the hold notice at the top. `../elitco/README.md` has the
current run instructions for the 8 subtypes that *are* going live.
