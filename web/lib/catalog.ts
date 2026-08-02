import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Unit } from "@/lib/database.types";

export type CatalogProduct = { id: string; name: string; rate: number; install: number };
export type CatalogSubtype = { id: string; key: string; label: string; products: CatalogProduct[] };
export type CatalogType = { id: string; key: string; label: string; subtypes: Record<string, CatalogSubtype> };
export type CatalogCategoryMeta = {
  id: string;
  key: string;
  label: string;
  subtitle: string | null;
  unit: Unit;
  highlight: string | null;
  enabled: boolean;
};

export interface Catalog {
  categoryMeta: Record<string, CatalogCategoryMeta>;
  enabledCategories: string[];
  catalog: Record<string, Record<string, CatalogType>>;
}

// Fetched as 4 flat, sort_order-ordered queries and assembled in JS rather than
// one deeply nested PostgREST embed - simpler to reason about and test without
// depending on nested embedded-resource ordering semantics.
export async function fetchCatalog(supabase: SupabaseClient<Database>): Promise<Catalog> {
  const [
    { data: categories, error: catErr },
    { data: types, error: typeErr },
    { data: subtypes, error: subErr },
    { data: products, error: prodErr },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("types").select("*").order("sort_order"),
    supabase.from("subtypes").select("*").order("sort_order"),
    supabase.from("products").select("*").order("sort_order"),
  ]);

  if (catErr) throw catErr;
  if (typeErr) throw typeErr;
  if (subErr) throw subErr;
  if (prodErr) throw prodErr;

  const categoryMeta: Catalog["categoryMeta"] = {};
  const enabledCategories: string[] = [];
  const catalogTree: Catalog["catalog"] = {};
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  for (const c of categories ?? []) {
    categoryMeta[c.key] = {
      id: c.id,
      key: c.key,
      label: c.label,
      subtitle: c.subtitle,
      unit: c.unit,
      highlight: c.highlight,
      enabled: c.enabled,
    };
    if (c.enabled) enabledCategories.push(c.key);
    catalogTree[c.key] = {};
  }

  const typeById = new Map<string, { key: string; categoryKey: string }>();
  for (const t of types ?? []) {
    const cat = categoryById.get(t.category_id);
    if (!cat) continue;
    catalogTree[cat.key][t.key] = { id: t.id, key: t.key, label: t.label, subtypes: {} };
    typeById.set(t.id, { key: t.key, categoryKey: cat.key });
  }

  const subtypeById = new Map<string, { key: string; typeKey: string; categoryKey: string }>();
  for (const s of subtypes ?? []) {
    const t = typeById.get(s.type_id);
    if (!t) continue;
    catalogTree[t.categoryKey][t.key].subtypes[s.key] = { id: s.id, key: s.key, label: s.label, products: [] };
    subtypeById.set(s.id, { key: s.key, typeKey: t.key, categoryKey: t.categoryKey });
  }

  for (const p of products ?? []) {
    const s = subtypeById.get(p.subtype_id);
    if (!s) continue;
    catalogTree[s.categoryKey][s.typeKey].subtypes[s.key].products.push({
      id: p.id,
      name: p.name,
      rate: Number(p.rate),
      install: Number(p.install_rate),
    });
  }

  return { categoryMeta, enabledCategories, catalog: catalogTree };
}
