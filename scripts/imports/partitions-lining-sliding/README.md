# Partitions: Wall Lining (Cladding) + Sliding Partitions import

Real products sourced from real UAE/Dubai suppliers (plus their manufacturer
brands where the UAE reseller doesn't own the source photography) for 5
subtypes that were still on generic placeholders: `Wall Lining (Cladding) >
Acoustic Lining`, `... > Wood Lining`, `... > Glass Lining`, `... > Green
Wall`, and `Sliding Partitions > Sliding Panel`. All under the `Partitions`
category (unit: `sqm`).

- `import-ready.json` - 20 real products, 4 per subtype, matching PTB's
  existing taxonomy exactly (case-insensitive label match against
  production).
- `import.mjs` - posts `import-ready.json` to
  `POST /api/admin/products/import`, which re-hosts each image via R2
  server-side. **Not run as part of this task** - this is a research/file
  output pass only.

## Methodology

For each subtype: web search for real Dubai/UAE suppliers -> fetch their
product/collection pages for names, dimensions, materials, and (where
published) AED prices -> cross-check pricing against independent Dubai
market-rate sources where a supplier didn't publish a number. Rejected
anything that read as residential/decorative rather than commercial-grade,
per the same judgment call the Lighting import applied to wall sconces and
chandeliers - this mattered most for Wood Lining (excluded generic
"wallpaper-style" foil-wrap wood-effect panels in favor of genuine wood
veneer on MDF) and Green Wall (excluded villa/garden decor moss art and
picked office-appropriate reception/breakout products instead).

All images are hot-linked from the suppliers' own sites/CDNs in this file
only as scrape metadata - the import API downloads and re-hosts them to our
own R2 bucket at import time, so production never depends on these sites
staying up. Where a product is genuinely real but I could not confirm a
working, supplier-hosted photo of that specific SKU, no `images` field is
included rather than guessing a URL (2 products: Mirodec back-painted glass,
Planters.ae living wall system).

No `colors` field is used anywhere in this file - several products (MUTE
felt panels especially) do come in many real colorways, but I did not have
verified hex codes for them and didn't want to fabricate one, so color
variants are left as a future enhancement rather than guessed.

## Pricing basis - read this before trusting any single number

This category is a mix of two very different markets:

1. **Catalog retail** (Acoustic Lining, most of Wood Lining, most of Green
   Wall): suppliers like MUTE, Trepanel/Tile Mountain, Naturewall/Arborelle,
   ebarza, and Green Art Factory sell fixed-size panels off a price list.
   Where I found a listed AED price, `rate` is that price divided by the
   panel's real sqm coverage - genuinely sourced, not estimated.
2. **Bespoke/quote-based fabrication** (Glass Lining, Sliding Panel, one
   Green Wall system): custom glass processors (Mirodec, Al Intethar,
   Safinat Nooh) and movable-wall installers (GFI UAE/Hufcor, Riaz Glass)
   do not publish per-sqm SKU prices at all - every project is quoted after
   a site visit. This is a genuine, structural feature of those two
   markets, not a gap in my research. For every such product the README
   and the JSON `description` field both state the estimate and its basis:
   either (a) the supplier's own published price *band* for a related
   product line (e.g. Al Intethar publishes a general AED 150-350/sqm
   Fluted Glass range even though the specific tinted SKU has no listed
   price), or (b) a real fully-installed project quote from a comparable
   Dubai supplier, converted to AED/sqm (Riaz Glass Dubai publishes
   AED 8,000-22,000 "per 3x3m room" pricing tiers for sliding glass
   partitions, which I divided by 9 sqm to get a defensible AED/sqm range
   for the Hufcor products, since Hufcor/GFI UAE themselves don't publish
   pricing).

No number in this file is fabricated from nothing - every `rate` either
comes from a real listed price or is explicitly derived from a real
published price/range with the source and math shown in that product's
`description`.

## Per-subtype notes

### Acoustic Lining - strongest subtype, all 4 prices genuinely sourced
MUTE (mute.ae, Dubai) sells PET-felt acoustic wall panels with listed AED
prices per panel; Trepanel (sold via tilemountain.ae's UAE storefront)
sells real oak-veneer acoustic wood slat panels with a felt backing and a
downloadable datasheet PDF. Both cover the "fabric/felt acoustic panel" and
"perforated/slat wood acoustic panel" archetypes called out in the brief.
No estimated prices needed here.

### Wood Lining - avoided the residential/foil-wrap trap
The brief specifically flagged Wood Lining as having obvious residential
lookalikes. I rejected several "wood-effect foil on MDF" interlocking
panels (e.g. dubaiwallcladding.com's "Natural Oak Wall Cladding SW102",
which turned out to be a printed foil wrap, not real veneer, once I read
the material spec closely) in favor of Naturewall's Arborelle range (real
oak/walnut wood veneer on solid MDF, UK-designed, sold into the UAE via
wallpaneldubai.com) and ebarza's walnut-veneer MDF flat panel. 3 of 4 are
directly-sourced UAE prices; the 4th (Walnut Reeded) is a small,
clearly-flagged extrapolation from its Oak sibling's confirmed price.

### Glass Lining - hardest subtype to get clean catalog data from
Custom glass fabrication (back-painted/lacquered glass, fluted/reeded
architectural glass) is a bespoke, quote-only market in Dubai - none of the
several real UAE glass processors I checked (Mirodec, Al Intethar Glass,
Safinat Nooh Glass, Crystal Casa, GlassWorld) publish per-sqm SKU pricing,
even though they publish real products, real specs, and (for 3 of the 4)
real photos. All 4 rates here are estimates, each tied to a specific
published price band from Al Intethar's own site or general Dubai glass
market-rate guides, with the math shown per-product. Treat these as the
least certain numbers in the file.

### Green Wall - thinner than the others, as flagged as a risk up front
This subtype is a genuine mix of "real product, no price" (SkyTech
Engineering's SkyGrow modular fabric-pocket living wall system - a proper
engineered product, not a garden-center item; Planters.ae's live wall
service, a large and credible UAE installer with 65,000+ sqm installed but
project-quoted only) and "real product, listed price, but the price is a
'starting from X' figure of unstated panel size" (Green Art Factory's
artificial and preserved-moss panels, both AED 300-500 "starting" prices
that I've treated as per-sqm rates since that's how this segment of the
Dubai market typically quotes - flagged explicitly in each description).
I could not find a supplier with both a confirmed office-appropriate photo
*and* a confirmed per-sqm price for this subtype - every product here has
one or the other, never both with full certainty. This is the subtype I'd
most want re-verified with a live supplier call before using these prices
for anything customer-facing.

### Sliding Panel - branded on Hufcor as suggested, one directly-priced product
Hufcor (movable/operable walls and glass walls) is distributed in the UAE
by GFI UAE (Gibca) - real brand, real UAE distributor, real product photos
and specs (STC acoustic ratings, track/seal engineering) pulled from
gfiuae.com, but Hufcor doesn't publish pricing (large, project-specific
systems). To ground the estimates in something real, I used Riaz Glass
Dubai's published fully-installed pricing tiers for a standard 3x3m meeting
room (framed/frameless/acoustic sliding glass) and converted to AED/sqm;
the 4th product is Riaz Glass's own aluminium-framed system, priced
directly from that same real quote (no extrapolation needed).

## Source pages fetched (2026-08-13)

- https://mute.ae/collections/mute-felt, /products/felt-plain-panel,
  /products/tiles-panel
- https://www.tilemountain.ae/wall-panels/acoustic,
  /trepanel-oak-acoustic-wood-panels
- https://www.naturewall.com/products/arborelle-natural-oak-fluted-wall-panel,
  /arborelle-natural-oak-reeded-wall-panel, /arborelle-walnut-reeded-wall-panel
- https://wallpaneldubai.com/wall-panel/wood/ (UAE AED pricing for the
  Arborelle Fluted/Reeded panels above)
- https://www.ebarza.com/collections/wall-panels/wood,
  /products/flat-decoration-panel-28x1-2x1-8-natural
- https://dubaiwallcladding.com/product/natural-oak-wall-cladding/ (checked
  and rejected - foil wrap, not real veneer)
- https://mirodec.com/backpainting/
- https://alintetharglass.com/fluted-glass-2/, /blog/glass-price-in-uae-2026-update/
- https://intetharglass.com/fluted-glass-dubai-uae/bronze-fluted-glass-panel/
- https://safinatglass.com/fluted-glass.html
- https://www.skytechen.com/product-category/wall-mounted/
- https://www.greenartfactory.com/products/artificial-green-wall-gaf1,
  /products/moss-wall-for-showroom
- https://www.planters.ae/services/green-wall
- https://floweryduae.com/green-wall-installation-cost-dubai/ (Dubai
  green-wall market-rate bands used for estimates)
- https://www.gfiuae.com/our-products/hufcor/operable-walls/600-series-operable-walls,
  /our-products/hufcor/movable-glass-walls/frameless-glass-walls/,
  /our-products/hufcor/movable-glass-walls/acoustic-glass-walls
- https://www.riazglassdubai.com/sliding-glass-partition-dubai/ (real
  project pricing tiers used both directly and as the Hufcor estimate basis)

## How to run (not done as part of this task)

```bash
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/partitions-lining-sliding/import.mjs
```

The API key is production's `PRODUCTS_IMPORT_API_KEY` (Vercel env var,
separate from local `.env`). Never commit the key itself - this script
reads it from the environment only. No import was run, and the database was
not touched, while producing this file set.
