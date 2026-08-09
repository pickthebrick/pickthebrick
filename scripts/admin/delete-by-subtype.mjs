// One-off admin utility: bulk-delete products by category + subtype (finer-grained
// than delete-placeholder-products.mjs, which only filters by category).
// Run with: PRODUCTS_IMPORT_API_KEY="..." node scripts/admin/delete-by-subtype.mjs <category> <subtype1> [subtype2 ...]
// Example:  PRODUCTS_IMPORT_API_KEY="..." node scripts/admin/delete-by-subtype.mjs Flooring "Standard Laminate" "Waterproof Laminate"
const BASE = process.env.PTB_API_BASE || "https://www.pickthebrick.com";
const KEY = process.env.PRODUCTS_IMPORT_API_KEY;
const [CATEGORY, ...SUBTYPES] = process.argv.slice(2);

if (!KEY) {
  console.error("Set PRODUCTS_IMPORT_API_KEY in the environment before running this script.");
  process.exit(1);
}
if (!CATEGORY || SUBTYPES.length === 0) {
  console.error('Usage: node delete-by-subtype.mjs <category> <subtype1> [subtype2 ...]');
  process.exit(1);
}

const res = await fetch(`${BASE}/api/admin/products`, {
  headers: { Authorization: `Bearer ${KEY}` },
});
if (!res.ok) {
  console.error("GET failed", res.status, await res.text());
  process.exit(1);
}
const { products } = await res.json();
const subtypeSet = new Set(SUBTYPES);
const targets = products.filter((p) => p.category === CATEGORY && subtypeSet.has(p.subtype));
console.log(`Found ${targets.length} products in "${CATEGORY}" > [${SUBTYPES.join(", ")}] out of ${products.length} total.`);
console.log(targets.slice(0, 8).map((p) => `${p.subtype}: ${p.name}`));

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
