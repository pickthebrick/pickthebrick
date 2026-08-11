# elitco.com lighting import

Real lighting products scraped from elitco.com (Electrical Lighting Co. LLC,
a UAE lighting distributor/retailer) to replace part of the 60 generic
placeholder Lighting products on the live site. Covers the technical/
functional half of the Lighting taxonomy - downlights, track, profile, and
panel.

**Wall Sconce, Pendant Lights, and Feature Installation are deliberately
excluded from this file.** The first pass included Elitco's wall sconces and
Al Salhiya's pendants/chandeliers (see git history), but they were rejected
as too residential/decorative (vintage crackled-glass sconces, crystal
chandeliers) - not office-appropriate. Those 4 subtypes are being
re-researched from scratch (see `../../../scripts/imports/` for whatever
supplier folder replaces `../salhiya/` once found) and are NOT part of this
import. Their placeholder products stay live and untouched until a real
replacement is ready - see `scripts/admin/delete-lighting-subset.mjs`, which
only clears the 8 subtypes this file actually covers.

- `import-ready.json` - 20 real products across 4 types / 8 subtypes, curated
  to match PTB's existing Lighting taxonomy exactly (case-insensitive label
  match against production): `Recessed Downlights > LED Downlight`, `...  >
  Adjustable / Gimbal`, `Track Lighting > Single Circuit Track`, `... >
  Magnetic Track`, `Linear / Profile Lighting > Surface Mounted Profile`,
  `... > Recessed Profile`, `Panel Lights > Ceiling Panel`, `... > Office /
  Task Panel`.
- `import.mjs` - posts `import-ready.json` to
  `POST /api/admin/products/import`, which re-hosts each image via R2
  server-side.
- `../../admin/delete-lighting-subset.mjs` - deletes only the placeholder
  products in the 8 subtypes above (not all 60 Lighting placeholders), so the
  4 deferred subtypes keep their placeholders live in the meantime.

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

Prices are elitco.com's listed AED price **plus a flat AED 160 per-item
markup** to cover the installing contractor's labor (this app has no
separate install-charge field - see AGENTS.md/architecture notes - so the
markup is baked directly into `rate`). Images are hot-linked from elitco's
own CDN (`elitco.com/uploads/product/...`) in this file only as scrape
metadata - the import API downloads and re-hosts them to our own R2 bucket at
import time, so production never depends on elitco's site staying up.

## How to run

```bash
# 1. Delete only the 8 placeholder subtypes this file covers (leaves the 4
#    deferred subtypes - Pendant Lights, Wall Sconce, Feature Installation -
#    untouched on production)
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/admin/delete-lighting-subset.mjs

# 2. Import the real elitco.com products
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/elitco/import.mjs
```

The API key is production's `PRODUCTS_IMPORT_API_KEY` (Vercel env var,
separate from local `.env`). Never commit the key itself - both scripts read
it from the environment only.
