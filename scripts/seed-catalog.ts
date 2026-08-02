/**
 * Seeds the catalog (categories/types/subtypes/products) straight out of the
 * prototype HTML's hardcoded `categoryMeta` / `catalog` / `enabledCategories`
 * JS objects, and creates one captain/contractor/admin test login for local
 * dev (role promotion otherwise has to be a manual Supabase Studio edit).
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the root .env.local
 * (the service role key bypasses RLS, which is what a trusted seed script needs).
 *
 * Usage: npm run seed
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill them in " +
      "(from your linked Supabase project's Settings > API page) before running the seed script."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Product = { name: string; rate: number; install: number };
type Subtype = { label: string; products: Product[] };
type Type = { label: string; subtypes: Record<string, Subtype> };
type CategoryMeta = {
  label: string;
  subtitle: string;
  unit: "sqm" | "lm" | "count";
  highlight: string;
};

function extractCatalogFromHtml(htmlPath: string) {
  const html = readFileSync(htmlPath, "utf-8");
  const start = html.indexOf("const categoryMeta");
  const end = html.indexOf("let state = {");
  if (start === -1 || end === -1) {
    throw new Error(
      "Could not find the catalog data block in the prototype HTML (markers 'const categoryMeta' / 'let state = {' not found)."
    );
  }
  const code = html.slice(start, end);
  const result = vm.runInNewContext(`${code}\n;({ categoryMeta, enabledCategories, catalog });`) as {
    categoryMeta: Record<string, CategoryMeta>;
    enabledCategories: string[];
    catalog: Record<string, Record<string, Type>>;
  };
  return result;
}

async function reseedCatalog(htmlPath: string) {
  const { categoryMeta, enabledCategories, catalog } = extractCatalogFromHtml(htmlPath);

  console.log("Clearing existing catalog rows (cascades to types/subtypes/products)...");
  const { error: delErr } = await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) throw delErr;

  let categorySort = 0;
  for (const [catKey, meta] of Object.entries(categoryMeta)) {
    const { data: category, error: catErr } = await supabase
      .from("categories")
      .insert({
        key: catKey,
        label: meta.label,
        subtitle: meta.subtitle,
        unit: meta.unit,
        highlight: meta.highlight,
        enabled: enabledCategories.includes(catKey),
        sort_order: categorySort++,
      })
      .select()
      .single();
    if (catErr) throw catErr;

    const types = catalog[catKey];
    if (!types) continue;

    let typeSort = 0;
    for (const [typeKey, type] of Object.entries(types)) {
      const { data: typeRow, error: typeErr } = await supabase
        .from("types")
        .insert({ category_id: category.id, key: typeKey, label: type.label, sort_order: typeSort++ })
        .select()
        .single();
      if (typeErr) throw typeErr;

      let subtypeSort = 0;
      for (const [subtypeKey, subtype] of Object.entries(type.subtypes)) {
        const { data: subtypeRow, error: subtypeErr } = await supabase
          .from("subtypes")
          .insert({ type_id: typeRow.id, key: subtypeKey, label: subtype.label, sort_order: subtypeSort++ })
          .select()
          .single();
        if (subtypeErr) throw subtypeErr;

        const productRows = subtype.products.map((p, i) => ({
          subtype_id: subtypeRow.id,
          name: p.name,
          rate: p.rate,
          install_rate: p.install,
          sort_order: i,
        }));
        const { error: productErr } = await supabase.from("products").insert(productRows);
        if (productErr) throw productErr;
      }
    }
    console.log(`  seeded category "${meta.label}"`);
  }
}

async function ensureTestUser(email: string, role: "captain" | "contractor" | "admin", fullName: string) {
  const password = "PickTheBrick123!";
  const { data: existing } = await supabase.auth.admin.listUsers();
  let user = existing?.users.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    user = data.user!;
  }

  const { error: profileErr } = await supabase.from("profiles").update({ role, full_name: fullName }).eq("id", user.id);
  if (profileErr) throw profileErr;

  console.log(`  ${role}: ${email} / ${password}`);
}

async function main() {
  const htmlPath = process.argv[2] ?? path.resolve(__dirname, "../pickthebrick-flooring-prototype.html");
  console.log(`Reading catalog data from ${htmlPath}`);
  await reseedCatalog(htmlPath);

  console.log("Seeding test staff logins (local/dev only)...");
  await ensureTestUser("captain@pickthebrick.test", "captain", "Test Captain");
  await ensureTestUser("contractor@pickthebrick.test", "contractor", "Test Contractor");
  await ensureTestUser("admin@pickthebrick.test", "admin", "Test Admin");

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
