// Imports IMPORT_READY_PATH into production via POST /api/admin/products/import.
// Idempotent: fetches existing products first and skips any (category, type,
// subtype, name) combination that's already there, so running this script
// twice in a row (e.g. an accidental double paste) never creates duplicates.
// Run with: PRODUCTS_IMPORT_API_KEY="..." node THIS_FILE
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

const existingRes = await fetch(`${BASE}/api/admin/products`, { headers: { Authorization: `Bearer ${KEY}` } });
if (!existingRes.ok) {
  console.error("Could not fetch existing products to check for duplicates:", existingRes.status, await existingRes.text());
  process.exit(1);
}
const { products: existing } = await existingRes.json();
const existingKeys = new Set(existing.map((p) => `${p.category}|${p.type}|${p.subtype}|${p.name}`));

let skipped = 0;
for (const cat of payload.categories) {
  for (const t of cat.types) {
    for (const st of t.subtypes) {
      const before = st.products.length;
      st.products = st.products.filter((p) => !existingKeys.has(`${cat.label}|${t.label}|${st.label}|${p.name}`));
      skipped += before - st.products.length;
    }
  }
}

if (skipped > 0) {
  console.log(`Skipping ${skipped} product(s) that already exist (already imported previously).`);
}

const hasAnything = payload.categories.some((c) => c.types.some((t) => t.subtypes.some((st) => st.products.length > 0)));
if (!hasAnything) {
  console.log("Nothing new to import - every product in this file already exists. Exiting.");
  process.exit(0);
}

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
