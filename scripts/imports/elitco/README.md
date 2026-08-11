# elitco.com lighting import

Real lighting products scraped from elitco.com (Electrical Lighting Co. LLC,
a UAE lighting distributor/retailer) to replace part of the 60 generic
placeholder Lighting products on the live site. Covers the technical/
functional half of the Lighting taxonomy - downlights, track, profile, panel,
and wall sconce. The decorative pendant/feature half is sourced separately
from Al Salhiya Lighting - see `../salhiya/`.

- `import-ready.json` - 22 real products across 5 types / 9 subtypes, curated
  to match PTB's existing Lighting taxonomy exactly (case-insensitive label
  match against production): `Recessed Downlights > LED Downlight`, `...  >
  Adjustable / Gimbal`, `Track Lighting > Single Circuit Track`, `... >
  Magnetic Track`, `Linear / Profile Lighting > Surface Mounted Profile`,
  `... > Recessed Profile`, `Panel Lights > Ceiling Panel`, `... > Office /
  Task Panel`, `Decorative / Feature Lighting > Wall Sconce`.
- `import.mjs` - posts `import-ready.json` to
  `POST /api/admin/products/import`, which re-hosts each image via R2
  server-side.
- `../../admin/delete-placeholder-products.mjs` - bulk-deletes existing
  products by category (used to clear the 60 placeholders first - run once
  before both this script and `../salhiya/import.mjs`).

## No downloadable datasheets

Neither elitco.com nor Al Salhiya Lighting publish downloadable PDF
datasheets on their product pages - only rich inline text specs (wattage,
color temperature, IP rating, CRI, beam angle, dimensions, etc.) in the
product description. Those specs are captured as structured `specs` entries
on each product instead (maps to the import API's `specs: {label, value}[]`
field, shown on the product detail page) rather than as a `downloads` PDF
link - there's nothing real to link to.

## Source pages scraped (2026-08-11)

- https://elitco.com/category/office-lights (downlights, gimbal/adjustable, one panel)
- https://elitco.com/category/commercial-lighting (track spotlights)
- https://elitco.com/category/magnetic-track-lights (magnetic track)
- https://elitco.com/category/aluminum-led-profile (surface-mounted + recessed profile)
- https://elitco.com/category/wall-lights (wall sconces)

Prices are elitco.com's listed AED prices, used as-is for our `rate` field
(no install charge concept in this app - see AGENTS.md/architecture notes).
Images are hot-linked from elitco's own CDN (`elitco.com/uploads/product/...`)
in this file only as scrape metadata - the import API downloads and re-hosts
them to our own R2 bucket at import time, so production never depends on
elitco's site staying up.

## How to run

```bash
# 1. Delete the 60 placeholder Lighting products first (only once, before
#    running either supplier's import.mjs)
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/admin/delete-placeholder-products.mjs Lighting

# 2. Import the real elitco.com products
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/elitco/import.mjs

# 3. Import the real Al Salhiya products (pendant/feature lighting)
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/salhiya/import.mjs
```

The API key is production's `PRODUCTS_IMPORT_API_KEY` (Vercel env var,
separate from local `.env`). Never commit the key itself - both scripts read
it from the environment only.
