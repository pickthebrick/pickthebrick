// Imports scripts/imports/salhiya/import-ready.json into production via
// POST /api/admin/products/import. Category/type/subtype labels in that file
// must exactly match the existing Lighting taxonomy (case-insensitive) so
// products attach to it instead of creating duplicates.
// Run with: PRODUCTS_IMPORT_API_KEY="..." node scripts/imports/salhiya/import.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = process.env.PTB_API_BASE || "https://www.pickthebrick.com";
const KEY = process.env.PRODUCTS_IMPORT_API_KEY;
if (!KEY) {
  console.error("Set PRODUCTS_IMPORT_API_KEY in the environment before running this script.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const payload = JSON.parse(readFileSync(join(__dirname, "import-ready.json"), "utf8"));

const res = await fetch(`${BASE}/api/admin/products/import`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const data = await res.json();
console.log("Status:", res.status);
console.log(`Created: ${data.created}, Failed: ${data.failed}`);
if (data.failed > 0) {
  console.log("Errors:");
  for (const r of data.results) {
    if (r.status === "error") console.log(" -", r.path, "->", r.error);
  }
}
