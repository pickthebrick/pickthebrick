# Gypsum & solid-wall partitions import

Real products sourced for 4 subtypes under the `Partitions` category: `Gypsum
Partitions > Standard Drywall`, `... > Fire Rated Drywall`, `Solid Walls >
Block Wall`, `... > Cement Board`. 16 products total (4 per subtype), drawn
from a mix of real manufacturer board data (Knauf UAE) and real UAE
distributor/supplier product pages (Exeed Litecrete, Zarei Group, Thermal
Building Products, FEPY, Al Khashab Building Materials).

- `import-ready.json` - the 16 products, shaped for
  `POST /api/admin/products/import`. Labels match the existing DB taxonomy
  exactly: `Partitions` (unit `sqm`) > `Gypsum Partitions` > `Standard
  Drywall` / `Fire Rated Drywall`, and `Solid Walls` > `Block Wall` / `Cement
  Board`.
- `import.mjs` - posts `import-ready.json` to the import API (copy of
  `../elitco/import.mjs`, repointed at this folder).

## Why Knauf dominates the two Gypsum subtypes

Knauf is the one manufacturer in this category with a UAE-market website
(`knauf.com/en-AE`) that both (a) survives automated/scripted access and (b)
publishes a real per-board datasheet PDF and product photo for every SKU.
Saint-Gobain Gyproc's UAE site (`gyproc.ae`) and USG Middle East
(`usgme.com`) were both checked repeatedly (2026-08-13) but sit behind a
Cloudflare "Just a moment..." interstitial that blocked every fetch attempt
(both the plain HTTP fetch tool and a real headless browser tab were tried
and both got stuck on the challenge page) - so, to keep the "real, working,
verifiable" bar the elitco pass set, **no Gyproc or USG products are
included here**, even though both brands genuinely sell into this market.
That's a gap worth revisiting with a manual browser session that can clear
the Cloudflare check by hand.

Because only one manufacturer's board catalogue was accessible, the 4
products in each Gypsum subtype are Knauf board SKUs assembled into
different system configurations (single vs. double layer, standard vs.
high-density vs. fire vs. fire+moisture board) rather than 4 different
manufacturers' branded systems - this mirrors how Knauf's own literature
names systems (W111 = single frame/single layer, W112 = single frame/double
layer, etc.), so it's a legitimate real system distinction, just narrower on
brand diversity than ideal. Each subtype also includes one generic/unbranded
"Dubai contractor grade" product priced at the market rate quoted by local
gypsum partition contractors, to represent the non-branded segment of the
market that most Dubai fit-outs also buy from.

## Per-product sourcing

### Gypsum Partitions > Standard Drywall
| Product | Basis |
|---|---|
| Knauf W111 (single layer RG board) | Knauf RG 12.5mm board product page (real datasheet + photo). Rate AED 110/sqm sourced directly from Dubai contractor pricing pages (see below) for "normal gypsum board" partitions. |
| Knauf W112 (double layer RG board) | Same Knauf RG board, doubled. Rate AED 140/sqm is an **estimate**: base AED 110/sqm + ~AED 30/sqm for the second board layer's material and fixing labor (no published double-layer-specific Dubai price was found). |
| Knauf Pro HD (high-density board) | Knauf Pro HD 12.5mm board product page (real datasheet + photo; board is 36-45kg vs ~21-27kg for regular board). Rate AED 160/sqm is an **estimate**: ~45% premium over the AED 110/sqm base, reasoned from Pro HD's much higher board weight/density (a rough proxy for material cost) - no published Pro-HD-specific Dubai price exists. |
| Dubai Standard Economy Partition | No manufacturer - generic unbranded board as offered by Dubai gypsum contractors. Rate AED 100/sqm, the low end of the published "starts from AED 110/sqm" range. No image/datasheet included since there's no brand to source them from. |

### Gypsum Partitions > Fire Rated Drywall
| Product | Basis |
|---|---|
| Knauf FR single layer, ~1hr | Knauf FR 12.5mm board product page (real datasheet + photo). Rate AED 130/sqm is an **estimate** within the AED 120-200/sqm range published for fire-rated gypsum board supply+install in Dubai (geminiuae.com), placed near the low end for the single-layer/lower-duration configuration. |
| Knauf FR double layer, ~2hr | Same Knauf FR board, doubled. Rate AED 185/sqm is an **estimate** near the high end of that same AED 120-200/sqm range, for the higher fire-duration double-layer build-up. |
| Knauf FM (fire & moisture resistant) | Knauf FM 12.5mm board product page (real datasheet + photo). Rate AED 145/sqm is **sourced directly** - novotechme.com states "MR & FR board wall partition... starts from AED 145 per square meter", which matches this combined fire+moisture board product. |
| Dubai Fire-Rated Partition, contractor grade | No manufacturer - generic FR board as commonly quoted by Dubai fit-out contractors. Rate AED 165/sqm is an **estimate**, the mid-point of the published AED 120-200/sqm range. |

### Solid Walls > Block Wall
| Product | Basis |
|---|---|
| Exeed Litecrete AAC Block Wall - E2 | Real UAE manufacturer (Exeed Litecrete, Industrial City of Abu Dhabi/ICAD 2) - `exeedlitecrete.ae`. Density, compressive strength and thermal conductivity are real published specs. Rate AED 150/sqm is an **estimate**: no AAC supply+install AED/sqm price is published anywhere found for the UAE; estimated from Dubai's published hollow-block material costs (AED 4-6/block, ~12.5 blocks/sqm) plus the Dubai Municipality's approved block-wall labor rate (AED 25/sqm for hollow/thermal block, up to 3m height - albasimllc.com) plus a plaster-finish allowance, with AAC's larger block format assumed to roughly offset its higher per-m3 material cost against standard block. |
| Exeed Litecrete AAC Block Wall - E4 | Same manufacturer, higher-density E4 grade (650kg/m3 vs E2's 500kg/m3). Rate AED 168/sqm is an **estimate**, a ~12% premium over the E2 estimate for the denser/higher-strength grade. |
| Zarei Group 100mm hollow block wall | Real Dubai supplier (`zarei-group.com`) - real photo, real specs (ASTM C90/BS 6073-1, >=7.5 MPa). Rate AED 120/sqm is an **estimate** built the same way as the AAC estimates above (published block cost + Dubai Municipality approved labor rate + plaster finish). |
| Zarei Group 150mm hollow block wall | Same supplier, thicker block. Rate AED 142/sqm is an **estimate**, scaled up for the extra block material. |

**Note on images for this subtype:** Exeed Litecrete's website only serves
lazy-loaded SVG placeholders for every product image (confirmed by
inspecting the rendered DOM, not just the raw HTML) - no real photo URL
could be recovered even after the page fully loaded, so **no `images` field
is included on either Exeed Litecrete product**, per the instruction not to
guess/fabricate an image URL. Zarei Group's images are real and included.

### Solid Walls > Cement Board
| Product | Basis |
|---|---|
| Everest Fiber Cement Board - 12mm | Real product, real UAE distributor (Thermal Building Products, `thermal.ae`) - real photo, real specs (850kg/m3 density, >30 MPa compressive strength). Datasheet is Everest Industries' own SuperHD technical brochure, hosted on Everest's manufacturer domain (`everestind.com`). Rate AED 165/sqm is an **estimate** (see methodology below). |
| Everest Fiber Cement Board - 9mm | Same product line, thinner board. Rate AED 142/sqm is an **estimate**, scaled down for less board material. |
| FEPY 12mm Cement Board (generic brand) | Real UAE building-materials e-commerce supplier (`fepy.com`) with a **directly sourced** board price: AED 84/sheet (incl. VAT), 1220x2440mm sheet (2.98 sqm), real product photo. Rate AED 150/sqm is an **estimate** built from that sourced board price (~AED 28/sqm per board face) plus a metal-stud-frame-and-labor allowance benchmarked against the Dubai gypsum-partition market rate. |
| Al Khashab Cement Board - 9mm | Real UAE supplier (Al Khashab Building Materials/AKBMC, Abu Dhabi, `alkhashabuae.com`) with a published price range of AED 29-94/sheet across thicknesses (varies by order quantity). Rate AED 122/sqm is an **estimate** for the thinner 9mm option using the same board-price-plus-frame methodology. No real image URL could be recovered from the page (only an SVG placeholder), so no `images` field is included. |

**Cement board pricing methodology:** none of the suppliers found publish a
full partition-system (board + metal-stud frame + install) AED/sqm price for
cement board the way Dubai gypsum contractors do for gypsum partitions -
only raw board sheet prices. Each cement-board rate above is therefore: (raw
board sheet price / sheet area, x2 for both faces) + a frame-and-labor
allowance benchmarked against the ~AED 85-90/sqm of frame+install cost
implied by subtracting board material cost from the sourced AED 110/sqm
all-in gypsum partition rate. This is a reasoned estimate, not a
supplier-quoted number - flagged here rather than presented as sourced.

## Source pages (checked 2026-08-13)

- https://knauf.com/en-AE/p/product/regular-rg-12.5mm-gypsum-board-enbs-10003_0606 (RG board)
- https://knauf.com/en-AE/p/product/fire-resistant-fr-12.5mm-gypsum-board-18608_0606 (FR board)
- https://knauf.com/en-AE/p/product/fire-moisture-resistant-fm-12.5mm-gypsum-board---enbs-15245_0606 (FM board)
- https://knauf.com/en-AE/p/product/pro-hd-12.5mm-gypsum-board-22682_0606 (Pro HD board)
- https://exeedlitecrete.ae/our-products/ and https://exeedlitecrete.ae/projects/aac-block-e2/ (AAC block specs)
- https://zarei-group.com/products/hollow-blocks/ (hollow block specs + photo)
- https://thermal.ae/product/everest-fiber-cement-board/ (Everest board specs + photo)
- https://www.fepy.com/cement-board-12-mm (FEPY board price + photo)
- https://alkhashabuae.com/all-products/drywall-false-ceiling-products/cement-board-saudi/ (Al Khashab board price)
- https://albasimllc.com/price-of-concrete-blocks-in-dubai/ (Dubai block pricing benchmark)
- https://novotechme.com/gypsum-partition-cost-in-dubai-2026-pricing-and-installation-guide/ and https://europeantechnical.ae/blog/gypsum-partition-dubai (Dubai gypsum partition market pricing)
- https://geminiuae.com/blog/fire-rated-gypsum-board-uae-civil-defense-compliance-type-specs (fire-rated gypsum board pricing range)

## What I struggled with (be honest)

- **Gyproc and USG were unreachable.** Both `gyproc.ae` and `usgme.com` are
  behind a Cloudflare bot-check that neither the automated fetch tool nor a
  real browser tab could clear in this session. That's a real gap - both
  brands have genuine UAE presence and would strengthen brand diversity in
  the Gypsum subtypes. Worth a follow-up pass with a human-assisted browser
  session.
- **No AAC- or block-wall-specific AED/sqm pricing exists publicly.** Every
  source found quotes either raw block unit prices (AED per block) or a
  narrow municipal labor-rate benchmark, never a full supply+install rate
  the way gypsum contractors publish. Both Block Wall rates above are
  therefore build-up estimates, not sourced numbers - flagged as such in the
  table.
- **Cement board is the weakest-covered subtype for full-system pricing**,
  for the same reason - suppliers sell board by the sheet, not by the
  finished partition sqm. See the methodology note above.
- **Two products (Al Khashab board, both Exeed Litecrete AAC blocks) have no
  real image** - their supplier sites only serve placeholder/lazy-load
  images that never resolved to a real URL, even after full page load, so
  those `images` fields were left out rather than guessed.
- Datasheet coverage is good for the Gypsum subtypes (every Knauf product has
  a real manufacturer PDF) but thin for Solid Walls - only the Everest
  cement board has a real manufacturer datasheet; the AAC and generic block
  products have none, and Al Khashab's cement board also has none.

## How to run (not run in this pass)

```bash
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/partitions-gypsum-solid/import.mjs
```

The API key is production's `PRODUCTS_IMPORT_API_KEY` (Vercel env var,
separate from local `.env`). Never commit the key itself.
