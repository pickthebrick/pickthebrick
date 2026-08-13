# Glass & aluminium-framed partitions import

Real partition products sourced from UAE glazing/partition suppliers to
populate 4 subtypes under Category "Partitions": `Glass Partitions > Single
Glazed`, `... > Double Glazed`, `Aluminium Framed Partitions > Full Glass
Framed`, `... > Glass-Gypsum Combo Framed`. 18 products total (5 / 5 / 4 / 4).

Matches the structure and rigor of `../elitco/` (real names, real prices or
clearly-flagged estimates, real specs, real images/datasheets where they
exist - nothing fabricated).

## Sources scraped (2026-08-13)

- https://kaprel.com/systems/single-glazed-partition-systems/ - Kaprel
  Partitions LLC, a Dubai-based demountable-partition specialist (Alpha 23,
  Alpha 30, SG Milano product lines, acoustic dB ratings)
- https://kaprel.com/systems/double-glazed-partition-systems/ - same
  supplier (Akustik 56, Akustik 99 EVO 1-5, Akustik 250 EVO S, DG Milano)
- https://www.lovethatdesign.com/brand/kaprel/ search results (via Google) -
  confirmed Alpha 23 glass thickness (12mm / 13.4mm laminated) and Akustik
  leaf thickness (26mm / 41mm) that kaprel.com's own pages don't state;
  direct WebFetch of lovethatdesign.com product pages returned HTTP 403, so
  only search-snippet text was usable, not their images
- https://www.opusbm.com/demountable-glass-partitions-fixtures/ - Opus
  Business Management, UAE distributor for ABCD International (France)
  single- and double-glazed demountable partition systems (ID-1, ID-2)
- https://www.riazglassdubai.com/glass-partition-in-dubai/ - Riaz Glass
  Dubai, a Business Bay/DIFC/Marina glazing contractor with a published
  per-sqm pricing table by glass type
- https://babaraluminum.com/how-much-do-glass-partitions-really-cost-in-uae/
  - Babar Dawood Aluminium & Glass, a Dubai glass/aluminium contractor with
  a published per-sqm pricing table by glass type and thickness
- https://mahmayi.com/interiors/aluminum-glass-partition.html and its
  individual product pages (Mahmayi is a UAE office-supplies/interiors
  retailer selling aluminium-framed glass partitions as priced,
  photographed e-commerce SKUs - the strongest source in this pass)
- Also checked and rejected as too thin/unreachable: khaleejaluminium.com
  (Sharjah fabricator, only "contact us" pricing, no product-level detail),
  glasspartition.ae, glassworldindustries.ae, murtazaglass.com,
  skyfancyglass.ae (all SEO "cost guide" pages with no distinct named
  products or usable images)

## Per-subtype notes

### Single Glazed / Double Glazed (Glass Partitions)

Kaprel is the backbone of both subtypes - a real, Dubai-headquartered
partition specialist (kaprel.com, kaprel.ae) whose site names specific
systems (Alpha 23, Alpha 30, SG Milano; Akustik 56, Akustik 99 EVO 1-5, DG
Milano) each with a real acoustic (Rw dB) rating pulled directly from their
own product pages. Kaprel does **not** publish pricing, glass thickness, or
directly-linkable images on kaprel.com - technical sheets are gated behind a
lead-capture form, and product photos are lazy-loaded client-side (the raw
HTML only contains inline SVG placeholders, confirmed by inspecting the
page's img tags directly). A third-party UAE marketplace,
lovethatdesign.com, lists Kaprel SKUs with glass-thickness variants (12mm /
13.4mm laminated for Alpha 23/32, 26mm/41mm leaf for Akustik) which filled in
the missing thickness specs, but its product pages 403'd on direct fetch so
no image URL could be confirmed from that source either.

Opus BM (opusbm.com) adds one product per subtype from ABCD International, a
real French manufacturer it distributes in the UAE - real specs (10/12mm
glass, edge-to-edge glazing, 100mm double-glazed depth, 44dB), no price, no
image (same client-side lazy-loading issue).

Riaz Glass Dubai and Babar Dawood round out both subtypes with their own
**published** AED/sqm price ranges for generic single-glazed / double-glazed
/ soundproof offerings (not individually named SKUs, but real numbers on
real, currently-live pricing-guide pages from real Dubai contractors) - used
as both a standalone low-end product and as the calibration basis for the
Kaprel/Opus BM estimates below.

**Result: no confirmed real image for any of these 10 products.** Rather
than fabricate or guess an image URL (explicitly disallowed), every
Single Glazed and Double Glazed product ships with specs only, no `images`
field. This is the "struggled" half of this pass - the branded partition-
system market in Dubai is heavily lead-gated (quote-on-request, gated PDFs,
JS-only product galleries) and doesn't expose stable public asset URLs the
way an e-commerce retailer does.

**Pricing basis (all flagged as estimates, none fabricated as
supplier-attributed):** Babar Dawood's page states Single Glazed AED
350-500/sqm, 10mm Toughened AED 400-600/sqm, 12mm Toughened AED 500-700/sqm,
Double Glazed AED 800-1,400/sqm, and Acoustic Glass AED 700-1,200/sqm. Riaz
Glass Dubai's page states its own Frameless (AED 300-600/sqm) and Soundproof
(AED 290-660/sqm, plus a flat AED 2,000-3,000/room acoustic upgrade not
converted to a per-sqm figure here) ranges directly - those two Riaz
products use the page's own midpoint, not an estimate. The five Kaprel
products and two Opus BM products are estimated within/above these ranges,
scaled by their stated acoustic performance (higher Rw dB -> priced toward
the top of the Double Glazed / Acoustic Glass bands) since no supplier in
this pass publishes AED pricing for a specific branded system.

### Full Glass Framed / Glass-Gypsum Combo Framed (Aluminium Framed Partitions)

Mahmayi (mahmayi.com) is a real UAE retailer selling these as individually
priced, individually photographed e-commerce SKUs - "AED X.XX per square
meter", real product-cache image URLs, fetched directly off their live
product pages today. This is the strongest-sourced half of the file: 6 of 8
products in this pair of subtypes are real Mahmayi SKUs with a genuine price
and a genuine image; only 2 (one per subtype) are estimates from Babar
Dawood / Riaz Glass Dubai's published ranges, included for supplier
diversity and given no image.

**Honesty note on "Glass-Gypsum Combo Framed":** no UAE supplier found in
this pass sells a discrete, individually-priced product literally described
as "glass + gypsum board" in an aluminium frame - that combination is
normally quoted bespoke per fit-out project (confirmed by every cost-guide
page checked, which treats gypsum-and-glass combinations as a project-level
line item, not a catalog SKU). The closest real, catalog-priced match is
Mahmayi's "with Tile" and "with Fabric" partition lines: an aluminium-framed
system with a solid dado band (ceramic tile-clad, or fabric-wrapped) at the
base for privacy/cable routing and clear or frosted glass above for
daylight - functionally identical to a glass-gypsum combo (solid lower
section + glazed upper section in one framed system), just using tile-clad
or fabric-wrapped panels instead of exposed gypsum board as the solid
infill. This is noted explicitly rather than mislabeled as literal gypsum.

## No downloadable datasheets, anywhere

None of the six suppliers used in this pass (Kaprel, Opus BM/ABCD
International, Riaz Glass Dubai, Babar Dawood, Mahmayi, plus the ones
checked and rejected) publish a directly-linkable PDF datasheet for these
products - Kaprel gates its CAD/BIM/spec downloads behind a contact form
with no stable resulting URL, and the others simply don't have one. No
`downloads` entries are included anywhere in `import-ready.json`, matching
the elitco Lighting pass precedent.

## Files

- `import-ready.json` - 18 real products across 2 types / 4 subtypes,
  matching PTB's existing Partitions taxonomy exactly (case-insensitive
  label match against production).
- `import.mjs` - posts `import-ready.json` to
  `POST /api/admin/products/import`, which re-hosts each image via R2
  server-side. Identical to `../elitco/import.mjs` except the file paths it
  reads are relative to this folder.

## How to run (not run as part of this task)

```bash
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/partitions-glass-aluminium/import.mjs
```

The API key is production's `PRODUCTS_IMPORT_API_KEY` (Vercel env var,
separate from local `.env`). Never commit the key itself - the script reads
it from the environment only. This file set was written for review only;
per the task that produced it, the import was deliberately **not** run and
the database was **not** touched.
