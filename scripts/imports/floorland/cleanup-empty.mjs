// Deletes now-empty Subtype/Type shells left behind after products are
// bulk-deleted (the products API only deletes Products, not catalog
// structure). Run this after deleting products from a subtype you want
// fully removed, or after moveSubtype ops leave a source Type empty.
// Run with: PRODUCTS_IMPORT_API_KEY="..." node scripts/imports/floorland/cleanup-empty.mjs
const BASE = process.env.PTB_API_BASE || "https://www.pickthebrick.com";
const KEY = process.env.PRODUCTS_IMPORT_API_KEY;
if (!KEY) {
  console.error("Set PRODUCTS_IMPORT_API_KEY in the environment before running this script.");
  process.exit(1);
}

const operations = [
  { op: "deleteEmptySubtypes", category: "Flooring" },
  { op: "deleteEmptyTypes", category: "Flooring" },
];

const res = await fetch(`${BASE}/api/admin/catalog/restructure`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ operations }),
});
const data = await res.json();
console.log("Status:", res.status);
console.log(JSON.stringify(data, null, 2));
