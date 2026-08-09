// Fixes the 10 Carpet Tiles/Broadloom products that were created without
// images because import.mjs's JSON route only accepts jpg/png/webp/gif and
// Floor Land serves these particular products as .avif. The multipart
// /api/admin/products/files route DOES accept image/avif directly, so this
// downloads each avif and attaches it to its already-created product.
// Run with: PRODUCTS_IMPORT_API_KEY="..." node scripts/imports/floorland/attach-avif-images.mjs
const BASE = process.env.PTB_API_BASE || "https://www.pickthebrick.com";
const KEY = process.env.PRODUCTS_IMPORT_API_KEY;
if (!KEY) {
  console.error("Set PRODUCTS_IMPORT_API_KEY in the environment before running this script.");
  process.exit(1);
}

const TARGETS = [
  { productId: "cmsm4erle001e04l201493ihl", name: "ASF – Moon", url: "https://floorland.ae/wp-content/uploads/2025/12/ASF-Moon-Br.avif" },
  { productId: "cmsm4erxo001f04l2hq4ekco9", name: "ASF – Pera", url: "https://floorland.ae/wp-content/uploads/2025/12/ASF-Pera-Beige.avif" },
  { productId: "cmsm4esng001g04l21ufq7pk9", name: "ASF – Romantic", url: "https://floorland.ae/wp-content/uploads/2025/12/ASF-Romantic.avif" },
  { productId: "cmsm4etd0001h04l2jrx7hl07", name: "ASF – Earth", url: "https://floorland.ae/wp-content/uploads/2025/12/ASF-Earth-Gray.avif" },
  { productId: "cmsm4ettu001i04l2ka7k5pcp", name: "ASF – Colormix", url: "https://floorland.ae/wp-content/uploads/2025/12/ASF-Colormix.avif" },
  { productId: "cmsm4eu8q001j04l2h0a4t6c2", name: "Bronze Grand Carpet", url: "https://floorland.ae/wp-content/uploads/2026/02/MS-AW-Atticus-Aragon-80.avif" },
  { productId: "cmsm4euky001k04l2126t1afm", name: "Blue Premium Carpet", url: "https://floorland.ae/wp-content/uploads/2026/02/MS-AW-Sirius-75.avif" },
  { productId: "cmsm4eux2001l04l2isj9kv67", name: "Dune Royal Carpet", url: "https://floorland.ae/wp-content/uploads/2026/02/MS-Creatuft-Titan-Beige-35.avif" },
  { productId: "cmsm4evmy001m04l2yj5se4rf", name: "Pearl Grand Carpet", url: "https://floorland.ae/wp-content/uploads/2026/02/MS-Teksol-Dorothy-Ivory-112.avif" },
  { productId: "cmsm4ewd1001n04l2ns8d6ypx", name: "Silver Elite Flooring", url: "https://floorland.ae/wp-content/uploads/2026/02/MS-Teksol-Antibies-Su_olk-Stone-150305.avif" },
];

for (const t of TARGETS) {
  try {
    const imgRes = await fetch(t.url);
    if (!imgRes.ok) throw new Error(`fetch avif failed: ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const form = new FormData();
    form.set("productId", t.productId);
    form.set("type", "image");
    form.set("file", new Blob([buf], { type: "image/avif" }), "image.avif");

    const res = await fetch(`${BASE}/api/admin/products/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}` },
      body: form,
    });
    const data = await res.json();
    console.log(t.name, "->", res.status, JSON.stringify(data));
  } catch (err) {
    console.log(t.name, "-> ERROR", err.message);
  }
}
