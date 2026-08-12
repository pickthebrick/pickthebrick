# luxxelighting.com lighting import - PENDING REVIEW

**Not run yet - needs the site owner's sign-off before `import.mjs` touches
production.** This is the third attempt at sourcing the 4 Lighting subtypes
that are still showing generic placeholders: `Pendant Lights > Single
Pendant`, `... > Cluster / Multi-Drop`, `Decorative / Feature Lighting > Wall
Sconce`, `... > Feature Installation`. The first two attempts
(`../elitco/`'s original wall-sconce picks and all of `../salhiya/`) were
rejected 2026-08-11 as too residential/decorative - crystal chandeliers,
ornate multi-arm pendants, vintage crackled-glass sconces. `../elitco/`'s
current import excludes these 4 subtypes for the same reason and is already
live/safe to run on its own; this file is meant to replace `../salhiya/` and
fill the gap `../elitco/README.md` left open.

Real products scraped from luxxelighting.com (Luxxe Lighting, a UAE lighting
retailer with a Shopify storefront and listed AED pricing) - picked
specifically to avoid the failure mode of the first two attempts.

- `import-ready.json` - 20 real products across 2 types / 4 subtypes, curated
  to match PTB's existing Lighting taxonomy exactly (case-insensitive label
  match against production): `Pendant Lights > Single Pendant`, `... >
  Cluster / Multi-Drop`, `Decorative / Feature Lighting > Wall Sconce`, `... >
  Feature Installation`.
- `import.mjs` - posts `import-ready.json` to
  `POST /api/admin/products/import`, which re-hosts each image via R2
  server-side. Identical to `../elitco/import.mjs`, just pointed at this
  folder.
- `../../admin/delete-by-subtype.mjs` - generic delete-by-subtype utility
  that can clear just these 4 placeholder subtypes before running this
  import (see "How to run" below). `../../admin/delete-lighting-subset.mjs`
  intentionally does NOT cover these 4 subtypes - it only deletes the 8
  `../elitco/` already replaced.

## What's covered and why each excluded line was excluded

luxxelighting.com's catalog has a clear split between minimal/architectural
pieces and residential/ornate ones (crystal chandeliers, candelabra-style
fixtures, colored-fabric-shade sconces, rattan/bamboo pendants - the site
even has a dedicated "Rattan/Bamboo Pendants" collection that was skipped
entirely). Every product below was checked on its own product page (not just
the collection-grid thumbnail) for material, dimensions, and bulb
configuration before being included.

**Wall Sconce** (`collections/wall-sconces`): Kennedy (Silver + Black,
aluminium, cylindrical, Dhs 295) and Rowan (metal/aluminium, streamlined,
Dhs 235) were the obvious picks from the first-page scan. Added Silas and
Tatum (marble/stone + metal, slim vertical profile, Dhs 595/480) as two more
- mixed stone-and-metal wall lights read as modern corporate-lobby
accents, not villa decor, and neither uses crystal, fabric, or ornate
metalwork.
- Excluded (avoid list, matches the brief's initial read): Stella, Ayla,
  Micah, Gael, Tatum's siblings Autumn/Iris/Sadie-style colored fabric or
  multi-arm sconces, and specifically **Brooks Wall Light** (Dhs 525,
  100cm tall with 7 exposed G4 bulbs) - the product page gives no detail on
  bulb arrangement or shading, and a 7-bulb exposed-filament vertical strip
  is exactly the kind of vanity/glam-style fixture that got the first Elitco
  pass rejected, so it was dropped rather than risk it. Also excluded Jasper
  (product page 404'd) and Oberon (insufficient detail to confirm style).

**Single Pendant** (`collections/pendant-lighting`): Rhodes (Gold + Black,
metal/glass, 27cm single shade, Dhs 350), Val (ceramic, Dhs 325), June
(glass/wood, Dhs 265), and Toby (brass/alabaster, single-head, Dhs 695) -
all confirmed on their product pages as single-shade, single-socket
fixtures in neutral materials (metal, ceramic, glass, wood, brass,
alabaster - no crystal).
- Excluded (avoid list): Georgia, Kaia, Maya, Willow, Payton, Ambrose - these
  read as chandelier-adjacent/ornate from the collection grid, consistent
  with the brief's initial pass.

**Cluster / Multi-Drop**: this subtype needed genuinely multi-head fixtures,
not just large single shades, so each candidate's bulb spec was checked for
head count. Harper (iron/glass, 3x E27 on one canopy, Dhs 515) and the
Sebastian family (stainless steel/glass, dual-head linear bar, 3 lengths -
77/110/130cm, Dhs 655/755/805) are genuine 2-3-head fixtures suited to
breakout tables or smaller meeting rooms. Everett Chandelier - Small (metal,
70cm ring, 3x E27, Dhs 655) rounds this out - despite the "chandelier" name
on Luxxe's site, it's a plain geometric metal ring with three exposed-socket
points, not a tiered/crystal piece, and reads the same as a "3-light cluster
pendant" from any commercial lighting catalog.
- Note: Corrin Pendant (142cm, listed as a "Metal & Acrylic Chandelier") was
  considered but dropped - its product page doesn't specify bulb/head count,
  and the word "chandelier" plus lack of detail made it too risky to include
  without visual confirmation, which this research pass had no reliable way
  to do (product photos aren't machine-readable through the tools used here).

**Feature Installation** (larger statement pieces for reception/lobby
ceilings): Cain and Jensen Linear Pendants (aluminium/glass and
metal/glass/acrylic, 110-120cm integrated-LED bars, Dhs 990 each) and
Estelle Linear Pendant (metal/glass, 153cm, Dhs 1,285) are architectural
linear bar fixtures - the kind used over a reception desk or long meeting
table, not a decorative pendant. Everett Chandelier - Large (metal, 86cm
ring, 5x E27, Dhs 950) and Noah Chandelier - Black (iron/glass, 80cm ring x
70cm drop, 7x G9, Dhs 1,385) are large geometric ring fixtures - visually
the opposite of the crystal/candelabra chandeliers that got Al Salhiya's
picks rejected; both are plain metal rings with exposed light points, sized
to anchor a lobby ceiling.
- Excluded: everything else in `collections/chandeliers` explicitly flagged
  traditional/ornate on the collection-grid pass (Lucia, Lula, Reya, Raymond,
  Henrick 2-Tier, Paris, Benny) - all read as crystal or candelabra-arm
  designs and were never opened for individual review.

**Struggled most with:** Cluster / Multi-Drop. Luxxe doesn't sell a
dedicated "3-globe cluster pendant" product type the way a residential
lighting catalog would - the closest fits were a genuine 3-socket pendant
(Harper), a dual-head linear pendant sold in three lengths (Sebastian), and
a 3-light geometric ring marketed as a "chandelier" (Everett Small). All
three are legitimately multi-head/multi-drop fixtures once you check the
bulb spec, but none of them look like the obvious "cluster pendant" product
photo you'd expect - it took the most individual product-page verification
of the four subtypes to be confident none of them were secretly ornate.

## No downloadable datasheets

Like elitco.com and salhiyalighting.com, luxxelighting.com doesn't publish
downloadable PDF datasheets - only inline product specs (material, finish,
dimensions, bulb type/count, voltage) in the page description. Those are
captured as structured `specs` entries (`{label, value}[]`) on each product,
same as both prior imports.

## Source pages scraped (2026-08-12)

- https://luxxelighting.com/collections/wall-sconces (+ page 2)
- https://luxxelighting.com/collections/pendant-lighting (+ page 2)
- https://luxxelighting.com/collections/chandeliers (+ page 2)
- Individual product pages for every item included or seriously considered
  (linked implicitly by each product's SKU/URL slug in `import-ready.json`
  image filenames, e.g. `I-PL-W127-SL` -> `.../products/kennedy-wall-light-
  silver-i-pl-w127-sl`)

## Pricing / markup decision

Used **elitco's convention, not salhiya's**: a flat **AED 160 per-item
markup** on top of Luxxe's listed Dhs price, to cover the installing
contractor's labor (this app has no separate install-charge field - see
AGENTS.md/architecture notes, so the markup is baked directly into `rate`).
Salhiya's README used supplier prices as-is with no markup, but that folder
was rejected/on-hold and never went live - `../elitco/`'s 8 already-live
subtypes are the actual precedent for what "real Lighting pricing" looks
like in production today, and using the same flat markup keeps the markup
logic consistent across all 12 Lighting subtypes that will eventually be
live (8 from elitco + these 4), rather than having half the category priced
with an install markup and half without for no visible reason to a site
visitor. Example: Kennedy Wall Light lists at Dhs 295 on luxxelighting.com;
`rate` here is 455 (295 + 160).

Images are hot-linked from Luxxe's Shopify CDN
(`luxxelighting.com/cdn/shop/files/...`) in this file only as scrape
metadata - the import API downloads and re-hosts them to our own R2 bucket at
import time, so production never depends on Luxxe's site staying up.

## How to run

**Do not run this yet - PENDING REVIEW.** Once the site owner signs off on
these 20 products:

```bash
# 1. Delete the 4 placeholder subtypes this file covers (leaves the 8
#    subtypes ../elitco/ already replaced untouched)
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/admin/delete-by-subtype.mjs Lighting "Single Pendant" "Cluster / Multi-Drop" "Wall Sconce" "Feature Installation"

# 2. Import the real luxxelighting.com products
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/luxxe/import.mjs
```

The API key is production's `PRODUCTS_IMPORT_API_KEY` (Vercel env var,
separate from local `.env`). Never commit the key itself - both scripts read
it from the environment only.
