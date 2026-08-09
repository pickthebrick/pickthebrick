# Floor Land flooring import

Real flooring products scraped from Floor Land LLC (floorland.ae) to replace
the placeholder/mismatched-image products in 9 of Flooring's 18 subtypes -
the ones Floor Land actually carries a matching product line for.

## Scope

Floor Land does **not** sell Ceramic/Porcelain/Natural Stone tiles, Epoxy/PU/
Polished Concrete coatings, Raised Access Flooring panels, or a distinct
"Carpet Planks" line - those subtypes already reference other real suppliers
(RAK Ceramics, Floormaster, GreenHawk, EBT Technical Services) or are left as
a known gap. This import only touches:

- `Laminate > Standard Laminate` / `Waterproof Laminate`
- `Vinyl > Vinyl Sheet` / `LVT` / `SPC (Rigid Core)`
- `Carpet > Carpet Tiles` / `Broadloom`
- `Outdoor Decking > WPC Deck Tiles`
- `Rubber > Interlocking Rubber Tiles`

`Carpet > Carpet Planks` was left out on purpose - Floor Land has no distinct
plank-format carpet product, so it still has its old placeholder data.

## Source pages scraped (2026-08-09)

- https://floorland.ae/collection/laminate/ + individual product pages (prices not published on-site; reused the AED 84/sqm rate already on file for this line)
- https://floorland.ae/collection/lvt/ + individual product pages (images lazy-loaded, needed per-product fetch)
- https://floorland.ae/collection/spc/
- https://floorland.ae/collection/vinyl/
- https://floorland.ae/collection/outdoor/
- https://floorland.ae/collection/rubber/ + individual product pages (images lazy-loaded)
- https://floorland.ae/carpet/tiles/
- https://floorland.ae/carpet/wall-to-wall/

Images are hot-linked from floorland.ae in `import-ready.json` only as scrape
metadata - the import API downloads and re-hosts each one to our own R2
bucket, so production never depends on floorland.ae staying up.

## How to run

```bash
# 1. Delete only the 9 subtypes being replaced (leaves the other 9 alone)
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/admin/delete-by-subtype.mjs Flooring "Standard Laminate" "Waterproof Laminate" "Vinyl Sheet" "LVT" "SPC (Rigid Core)" "Carpet Tiles" "Broadloom" "WPC Deck Tiles" "Interlocking Rubber Tiles"

# 2. Import the 45 real Floor Land products
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/floorland/import.mjs
```

Same production `PRODUCTS_IMPORT_API_KEY` as the furniture import (see
`../officebase/README.md`). Never commit the key itself.
