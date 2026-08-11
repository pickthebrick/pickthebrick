// One-off admin utility: deletes only the placeholder Lighting products in
// the 8 subtypes scripts/imports/elitco/import-ready.json is about to
// replace, leaving the 4 deferred subtypes (Pendant Lights > Single Pendant,
// ... > Cluster / Multi-Drop, Decorative / Feature Lighting > Wall Sconce,
// ... > Feature Installation) untouched until a real replacement is ready.
// Run with: PRODUCTS_IMPORT_API_KEY="..." node scripts/admin/delete-lighting-subset.mjs
const BASE = process.env.PTB_API_BASE || "https://www.pickthebrick.com";
const KEY = process.env.PRODUCTS_IMPORT_API_KEY;
if (!KEY) {
  console.error("Set PRODUCTS_IMPORT_API_KEY in the environment before running this script.");
  process.exit(1);
}

const SUBTYPES = [
  "LED Downlight",
  "Adjustable / Gimbal",
  "Single Circuit Track",
  "Magnetic Track",
  "Surface Mounted Profile",
  "Recessed Profile",
  "Ceiling Panel",
  "Office / Task Panel",
];

const res = await fetch(`${BASE}/api/admin/products`, {
  headers: { Authorization: `Bearer ${KEY}` },
});
if (!res.ok) {
  console.error("GET failed", res.status, await res.text());
  process.exit(1);
}
const { products } = await res.json();
const targets = products.filter((p) => p.category === "Lighting" && SUBTYPES.includes(p.subtype));
console.log(`Found ${targets.length} placeholder products across ${SUBTYPES.length} subtypes out of ${products.length} total products.`);
console.log(targets.slice(0, 5).map((p) => `${p.subtype} - ${p.name}`));

const ids = targets.map((p) => p.productId);
if (ids.length === 0) {
  console.log("Nothing to delete.");
  process.exit(0);
}

const delRes = await fetch(`${BASE}/api/admin/products`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ productIds: ids }),
});
console.log("DELETE status:", delRes.status);
console.log(await delRes.json());
