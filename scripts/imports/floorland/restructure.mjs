// Executes the Flooring taxonomy restructure agreed with the client:
// Tiles/Carpet stay mostly as-is; Vinyl -> Parquet; Raised Access Flooring ->
// Raised floor; Laminate folds into Parquet; Rubber folds into Coatings;
// Polished Concrete moves into a new Concrete type.
// Run with: PRODUCTS_IMPORT_API_KEY="..." node scripts/imports/floorland/restructure.mjs
const BASE = process.env.PTB_API_BASE || "https://www.pickthebrick.com";
const KEY = process.env.PRODUCTS_IMPORT_API_KEY;
if (!KEY) {
  console.error("Set PRODUCTS_IMPORT_API_KEY in the environment before running this script.");
  process.exit(1);
}

const operations = [
  { op: "renameType", category: "Flooring", from: "Vinyl", to: "Parquet" },
  { op: "renameType", category: "Flooring", from: "Raised Access Flooring", to: "Raised floor" },
  { op: "renameSubtype", category: "Flooring", type: "Coatings", from: "PU Coating", to: "PU" },
  { op: "renameSubtype", category: "Flooring", type: "Parquet", from: "SPC (Rigid Core)", to: "SPC" },
  { op: "renameSubtype", category: "Flooring", type: "Raised floor", from: "Calcium Sulphate Panel", to: "Calcium sulphate" },
  { op: "moveSubtype", category: "Flooring", subtype: "Standard Laminate", fromType: "Laminate", toType: "Parquet" },
  { op: "moveSubtype", category: "Flooring", subtype: "Waterproof Laminate", fromType: "Laminate", toType: "Parquet" },
  { op: "moveSubtype", category: "Flooring", subtype: "Polished Concrete", fromType: "Coatings", toType: "Concrete" },
  { op: "moveSubtype", category: "Flooring", subtype: "Interlocking Rubber Tiles", fromType: "Rubber", toType: "Coatings", renameTo: "Rubber" },
];

const res = await fetch(`${BASE}/api/admin/catalog/restructure`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ operations }),
});
const data = await res.json();
console.log("Status:", res.status);
console.log(JSON.stringify(data, null, 2));
