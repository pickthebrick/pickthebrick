// One-off admin utility: bulk-delete products by category from production.
// Run with: PRODUCTS_IMPORT_API_KEY="..." node scripts/admin/delete-placeholder-products.mjs [category]
// Never commit the API key itself - it's read from the environment only.
const BASE = process.env.PTB_API_BASE || "https://www.pickthebrick.com";
const KEY = process.env.PRODUCTS_IMPORT_API_KEY;
const CATEGORY = process.argv[2] || "Furniture";

if (!KEY) {
  console.error("Set PRODUCTS_IMPORT_API_KEY in the environment before running this script.");
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
const targets = products.filter((p) => p.category === CATEGORY);
console.log(`Found ${targets.length} "${CATEGORY}" products out of ${products.length} total.`);
console.log(targets.slice(0, 5).map((p) => p.name));

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
