# officebase.ae furniture import

Real furniture products scraped from officebase.ae (an authorized reseller
relationship confirmed by the PTB team) to replace the 70 generic placeholder
Furniture products on the live site.

- `import-ready.json` - 60 real products (5 per subtype), curated from the
  scrape below to match PTB's existing 12 Furniture subtypes exactly
  (`Workstations > Single Desk`, `... > Cluster / Bench Desk`,
  `Office Chairs > Task Chair`, `... > Visitor / Meeting Chair`,
  `Meeting Tables > Small Meeting (4-6 person)`, `... > Boardroom (8+ person)`,
  `Storage / Cabinets > Pedestals & Lockers`, `... > Cabinets & Shelving`,
  `Reception Desks > Standard Reception`, `... > Custom Feature Reception`,
  `Soft Seating / Lounge > Sofas & Armchairs`, `... > Breakout / Pod Seating`).
  Category/type/subtype labels match production exactly (case-insensitive) so
  the import attaches to the existing taxonomy instead of creating duplicates.
- `import.mjs` - posts `import-ready.json` to
  `POST /api/admin/products/import`, which re-hosts each image via R2 server-side.
- `../../admin/delete-placeholder-products.mjs` - bulk-deletes existing
  products by category (used to clear the 70 placeholders first).

## Source pages scraped (2026-08-09)

- https://www.officebase.ae/desks/workstation-desks/ (single + cluster desks)
- https://www.officebase.ae/chairs/workstation-chairs/ (task chairs)
- https://www.officebase.ae/chairs/visitor-chairs/ (visitor/meeting chairs)
- https://www.officebase.ae/meeting-and-shared-spaces/meeting-tables/ (meeting tables)
- https://www.officebase.ae/storage/pedestals/ , /storage/lockers/ (pedestals & lockers)
- https://www.officebase.ae/storage/cabinets/ , /storage/bookcase/ (cabinets & shelving)
- https://www.officebase.ae/lounge-and-reception-areas/reception-desks/ (standard reception)
- https://www.officebase.ae/lounge-and-reception-areas/designer-reception-desks/ (custom feature reception)
- https://www.officebase.ae/lounge-and-reception-areas/sofas/ (sofas & armchairs)
- https://www.officebase.ae/chairs/break-out-room/ , /acoustic-solutions/ (breakout/pod seating)

Prices are officebase.ae's listed AED prices, used as-is for our `rate` field
(no install charge concept in this app - see AGENTS.md/architecture notes).
Images are hot-linked from officebase's CDN (`officebaseuae.b-cdn.net`) in this
file only as scrape metadata - the import API downloads and re-hosts them to
our own R2 bucket at import time, so production never depends on
officebase's CDN staying up.

## How to run

```bash
# 1. Delete the 70 placeholder Furniture products first
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/admin/delete-placeholder-products.mjs Furniture

# 2. Import the real officebase.ae products
PRODUCTS_IMPORT_API_KEY="<key>" node scripts/imports/officebase/import.mjs
```

The API key is production's `PRODUCTS_IMPORT_API_KEY` (Vercel env var,
separate from local `.env`). Never commit the key itself - both scripts read
it from the environment only.
