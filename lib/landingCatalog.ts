import "server-only";
import { fetchCatalog, type CatalogCategoryMeta, type CatalogType, type CatalogSubtype } from "@/lib/catalog";
import { slugify, resolveSlug } from "@/lib/slug";

// Read-only data helper for the Type/Style ("Subtype") SEO landing pages
// only - deliberately its own file rather than a change to lib/catalog.ts,
// so /build and /design (both of which depend on that file's existing shape)
// are never at risk from this work. Reuses fetchCatalog() as-is (read-only
// call, not an edit) rather than re-querying Prisma separately, so the two
// catalogs can't drift apart in shape.

export type LandingCategory = { meta: CatalogCategoryMeta; types: CatalogType[] };

export async function getCategoryForLanding(categoryKey: string): Promise<LandingCategory | null> {
  const { categoryMeta, catalog } = await fetchCatalog();
  const meta = categoryMeta[categoryKey];
  if (!meta || !meta.enabled) return null;
  return { meta, types: Object.values(catalog[categoryKey] ?? {}) };
}

export type LandingType = { meta: CatalogCategoryMeta; type: CatalogType; siblingTypes: CatalogType[] };

export async function getTypeForLanding(categoryKey: string, typeSlug: string): Promise<LandingType | null> {
  const data = await getCategoryForLanding(categoryKey);
  if (!data) return null;
  const type = resolveSlug(data.types, typeSlug);
  if (!type) return null;
  return { meta: data.meta, type, siblingTypes: data.types };
}

export type LandingSubtype = {
  meta: CatalogCategoryMeta;
  type: CatalogType;
  subtype: CatalogSubtype;
  siblingSubtypes: CatalogSubtype[];
};

export async function getSubtypeForLanding(categoryKey: string, typeSlug: string, subtypeSlug: string): Promise<LandingSubtype | null> {
  const typeData = await getTypeForLanding(categoryKey, typeSlug);
  if (!typeData) return null;
  const siblingSubtypes = Object.values(typeData.type.subtypes);
  const subtype = resolveSlug(siblingSubtypes, subtypeSlug);
  if (!subtype) return null;
  return { meta: typeData.meta, type: typeData.type, subtype, siblingSubtypes };
}

// Every enabled category/type/subtype URL, for app/sitemap.ts - derived from
// the live catalog so new types/subtypes are picked up automatically rather
// than needing a hardcoded list kept in sync by hand.
export async function getAllLandingUrlParts(): Promise<{ category: string; type?: string; subtype?: string }[]> {
  const { catalog, enabledCategories } = await fetchCatalog();
  const parts: { category: string; type?: string; subtype?: string }[] = [];
  for (const categoryKey of enabledCategories) {
    parts.push({ category: categoryKey });
    for (const type of Object.values(catalog[categoryKey] ?? {})) {
      const typeSlug = slugify(type.key);
      parts.push({ category: categoryKey, type: typeSlug });
      for (const subtype of Object.values(type.subtypes)) {
        parts.push({ category: categoryKey, type: typeSlug, subtype: slugify(subtype.key) });
      }
    }
  }
  return parts;
}
