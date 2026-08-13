# Partitions Batch 2 — Image Sourcing Notes

All 19 products below were found and verified. Every URL in `images.json` was fetched directly
(via `curl`, with a browser-like User-Agent where needed) and confirmed to return HTTP 200 with a
real image `Content-Type` (`image/jpeg` or `image/webp`). No `mahmayi.com` URLs were used or
considered. Several images were also downloaded and visually inspected to confirm they show a
plausible/representative photo before being included.

Result: **19 / 19 found**, though several are honest substitutions/generic representative photos
rather than an exact model-specific studio shot — these are flagged explicitly below.

---

## Partitions > Glass Partitions > Single Glazed

**1. Kaprel Alpha 23 Single Glazed Partition System**
Source: Kaprel's own official site, `kaprel.com/systems/single-glazed-partition-systems/alpha-23/`.
The product photo is served from Kaprel's CloudFront CDN. Direct, brand-accurate product photo.
Image: `Alpha23-Single-Glazed-Partition-33dB-1.jpg`

**2. Kaprel Alpha 30 Single Glazed Partition System**
Source: `kaprel.com/systems/single-glazed-partition-systems/alpha-30/`. Direct product photo from
Kaprel's own CDN.
Image: `Alpha-30-Single-glazed-Partition-40dB.jpg`

**3. Kaprel SG Milano Series Single Glazed Partition**
Source: `kaprel.com/systems/single-glazed-partition-systems/sg-milano-series/`. Direct product
photo from Kaprel's own CDN.
Image: `SG-Milano-Series.jpg`

**4. ABCD International Single-Glazed Partition (ID-1), supplied by Opus BM**
Source: Opus BM's own site (`opusbm.com/demountable-glass-partitions-fixtures/`) only exposed a
logo via a plain HTTP fetch (image assets are behind an aggressive JS/CDN optimizer that didn't
resolve real image URLs even with a browser UA). Used the same ABCD International ID-1 product
photo instead, hosted by Venesta (`venesta.ae/product/demountable-partitions-id-1/`), another
authorized UAE reseller of the identical ABCD International ID-1 system — this is the correct,
exact product, just documented/hosted by a sibling UAE distributor rather than Opus BM directly.
Also cross-verified the same product exists on archiexpo.com (`img.archiexpo.com/.../id-1-297376_1m.jpg`,
also fetchable) as a manufacturer-catalog backup if needed.

**5. Riaz Glass Dubai Frameless Glass Partition**
Source: `riazglassdubai.com/office-glass-partition/`. Note: the page's own `alt` text labels didn't
match the actual photo content when inspected visually (e.g. the image alt-tagged "Frameless office
glass partition" actually showed a partition with visible black aluminium framing). Images were
therefore matched to products by visual inspection, not by the site's alt text. The photo selected
here shows a glass box with only thin edge/corner framing — the closest visual match to "frameless"
among Riaz's available photos.

## Partitions > Glass Partitions > Double Glazed

**6. ABCD International Double-Glazed Partition (ID-2), supplied by Opus BM**
Same situation as #4 — Opus BM's own site didn't expose fetchable image URLs. Used the ABCD
International ID-2 product photo from Venesta (`venesta.ae/product/demountable-partitions-id-2/`
gallery), the same exact ABCD ID-2 system. archiexpo.com also has verified backup images
(`img.archiexpo.com/images_ae/photo-m2/1555-2031....jpg`).

**7. Kaprel DG Milano Series Double Glazed Partition**
Source: `kaprel.com/systems/double-glazed-partition-systems/dg-milano-series/`. Direct product
photo from Kaprel's own CDN.
Image: `DG-Milano-Series-Double-Glazed-Partition-EVO-1-Milano-48dB-1.jpg`

**8. Kaprel Akustik 99 EVO 5 Double Glazed Acoustic Partition**
Source: `kaprel.com/systems/double-glazed-partition-systems/akustik-99/`. Direct product photo from
Kaprel's own CDN.
Image: `Akustik99-Double-Glazed-Partition.jpg`

**9. Kaprel Akustik 56 Double Glazed Acoustic Partition**
Source: `kaprel.com/systems/double-glazed-partition-systems/akustik-56/`. Direct product photo from
Kaprel's own CDN (filename is `Akustik56-Solid-Wall-System.jpg` — despite the filename, this is the
image Kaprel itself serves on the Akustik 56 product page; the photo shows a curved glazed section
paired with a solid acoustic panel section, consistent with Akustik 56 being offered in
mullion-free glazed and solid-panel configurations).

**10. Riaz Glass Dubai Soundproof Glass Partition**
Riaz's marketing site has no photo specifically captioned/labeled as "soundproof" or "double
glazed" (all their glass-partition photography is generic office-partition imagery reused across
service pages). Used one of their general office glass partition photos (a folding/pivoting glass
wall system) as a representative stand-in. This is an explicit substitution — it is a real Riaz
Glass Dubai photo, but not verified to depict their double-glazed/soundproof line specifically.

## Partitions > Aluminium Framed Partitions > Full Glass Framed

**11. Riaz Glass Dubai Aluminium-Framed Glass Partition (8mm)**
Source: `riazglassdubai.com/office-glass-partition/`. As noted under #5, matched by visual content
rather than the page's (mismatched) alt text — this photo clearly shows visible black aluminium
framing around glass panels and a sliding door, which is the right visual category even though it
isn't confirmed to be the 8mm-glass variant specifically.

**12. Babar Dawood Aluminium-Framed 12mm Toughened Glass Partition**
Source: `babaraluminum.com/glass-partition-dubai-uae/`. Real installation/project photo hosted
directly on Babar Dawood's own site (an aluminium-framed glass partition with a frosted stripe
band and sliding door) — a genuine Babar Dawood project photo, generic within their glass-partition
line rather than confirmed 12mm-specific.

## Partitions > Gypsum Partitions > Standard Drywall

**13. Dubai Standard Economy Partition (Unbranded Single-Layer Board)**
No specific manufacturer, per the brief. Used a generic gypsum partition wall photo from a UAE
interior-fitout contractor, Naseem Decor (`naseemdecor.com/gypsum-partition-wall/`) — a finished,
painted single-layer gypsum partition wall, representative of a standard economy drywall partition.

## Partitions > Gypsum Partitions > Fire Rated Drywall

**14. Dubai Fire-Rated Partition - Contractor Grade (Single-Layer FR Board)**
Also generic/unbranded per the brief. Used a second photo from the same Naseem Decor page, this
one showing the partition mid-installation (metal stud framework with boards being fixed) — a
representative "gypsum drywall partition under construction" photo. Note: fire-rated and standard
gypsum board are visually indistinguishable in a finished/installation photo, so this is a generic
drywall-construction image, not a photo verified to be of Type-X/FR-rated board specifically.

## Partitions > Wall Lining (Cladding) > Glass Lining

**15. Mirodec Back-Painted (Lacquered) Glass Wall Cladding**
Mirodec's own site (`mirodec.com`) runs the WebP Express plugin, which does strict HTTP content
negotiation: every single image on the domain (including the logo) returns `406 Not Acceptable`
unless the request sends a specific `Accept: image/*` (or `*/*`) header. A plain fetch without that
header — which is how many server-side/import pipelines behave by default — fails. Given the
explicit warning in the brief about `mahmayi.com` behaving exactly this way with this project's
hosting provider, `mirodec.com` was treated as equally unreliable and avoided entirely, even though
a specially-headered curl request could get a 200 from it.
Instead, used a real Mirodec project photo (deep-blue back-painted glass wall cladding panels,
installed with a chandelier) that is mirrored on Mirodec's Bizuum business-directory listing
(`bizuum.com/suppliers-businesses-companies/mirodec-gulf-glass-industries/`), hosted on bizuum.com's
own domain/CDN, which fetches reliably with no special headers.

## Partitions > Wall Lining (Cladding) > Green Wall

**16. Live Green Wall System with Drip Irrigation**
No specific original supplier was named in the source data, so per the brief a generic UAE living
wall supplier was used. Selected Planters (`planters.ae/services/green-wall`), a UAE green-wall
company whose marketing copy explicitly describes a "drip irrigation system that delivers optimal
water quantities to plant roots at regular intervals." Used their green-wall service-page hero
photo — a real installed living/vertical garden wall (visually confirmed: dense live foliage
covering a restaurant accent wall).

## Partitions > Solid Walls > Block Wall

**17. Exeed Litecrete AAC Block Wall - E4 (100mm, 650kg/m3, Higher Strength)**
Source: `exeedlitecrete.ae/projects/aac-block-e4/`, Exeed Litecrete's own site. Direct product
photo (a stack of AAC blocks) hosted on their own domain.

**18. Exeed Litecrete AAC Block Wall - E2 (100mm, 500kg/m3)**
Source: `exeedlitecrete.ae/projects/aac-block-e2/`. Note: Exeed Litecrete's own site reuses the
exact same generic AAC-block product photo across all of its grade pages (E0, E2, E3, E4) — the
different density/strength grades are not visually distinguishable in a product photo, and Exeed's
own site doesn't attempt to differentiate them photographically. Same image URL as #17 is used
here; this is not a mistake, it mirrors how the manufacturer itself presents these SKUs.

## Partitions > Solid Walls > Cement Board

**19. Al Khashab Cement Board Partition - 9mm**
Source: `alkhashabuae.com/all-products/drywall-false-ceiling-products/cement-board-saudi/`, Al
Khashab's own product page for the Saudi Cement Board line they distribute (6mm/9mm/12mm/18mm).
Direct product photo (stack of cement boards) hosted on their own domain.

---

## Summary

- **19 / 19 products**: real, fetch-verified image URL found and included in `images.json`.
- **0 skipped.**
- Explicit substitutions/generic-representative photos (flagged above, not exact SKU-specific
  shots): #4, #6 (correct product, different UAE distributor's hosting), #9 (filename mismatch but
  same source page), #10, #11, #12 (same supplier's general product-line photography, not
  confirmed to be the exact spec variant), #13, #14 (unbranded/generic by design), #15 (same
  product, third-party mirror due to Mirodec's own site blocking header-less fetches), #16
  (generic UAE supplier, not the original/unnamed one), #18 (manufacturer itself reuses one photo
  across AAC grades).
- No `mahmayi.com` URLs were used anywhere.
