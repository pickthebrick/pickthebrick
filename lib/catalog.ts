import "server-only";
import { prisma } from "@/lib/prisma";
import type { Unit } from "@/app/generated/prisma/enums";

export type CatalogColorOption = { id: string; name: string; hex: string };
export type CatalogSpec = { id: string; label: string; value: string };
export type CatalogDownload = { id: string; label: string; kind: string; filePath: string };

export type CatalogProduct = {
  id: string;
  name: string;
  rate: number;
  description: string | null;
  /** Effective unit (falls back to the category's unit) - what the Build page uses. */
  unit: Unit;
  /** The product's own DB value before the category fallback - null means "inherits the category unit". Used by the admin editor. */
  rawUnit: Unit | null;
  featured: boolean;
  images: { id: string; path: string }[];
  colorOptions: CatalogColorOption[];
  specs: CatalogSpec[];
  downloads: CatalogDownload[];
};
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

export async function fetchCatalog(): Promise<Catalog> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      types: {
        orderBy: { sortOrder: "asc" },
        include: {
          subtypes: {
            orderBy: { sortOrder: "asc" },
            include: {
              products: {
                orderBy: { sortOrder: "asc" },
                include: {
                  images: { orderBy: { sortOrder: "asc" } },
                  colorOptions: { orderBy: { sortOrder: "asc" } },
                  specs: { orderBy: { sortOrder: "asc" } },
                  downloads: { orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  const categoryMeta: Catalog["categoryMeta"] = {};
  const enabledCategories: string[] = [];
  const catalogTree: Catalog["catalog"] = {};

  for (const c of categories) {
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
    for (const t of c.types) {
      catalogTree[c.key][t.key] = { id: t.id, key: t.key, label: t.label, subtypes: {} };
      for (const s of t.subtypes) {
        const products: CatalogProduct[] = s.products.map((p) => ({
          id: p.id,
          name: p.name,
          rate: p.rate,
          description: p.description,
          unit: p.unit ?? c.unit,
          rawUnit: p.unit,
          featured: p.featured,
          images: p.images.map((img) => ({ id: img.id, path: img.path })),
          colorOptions: p.colorOptions.map((co) => ({ id: co.id, name: co.name, hex: co.hex })),
          specs: p.specs.map((sp) => ({ id: sp.id, label: sp.label, value: sp.value })),
          downloads: p.downloads.map((d) => ({ id: d.id, label: d.label, kind: d.kind, filePath: d.filePath })),
        }));
        // Featured products surface first within their subtype; Array.sort is
        // stable so relative order is otherwise preserved.
        products.sort((a, b) => Number(b.featured) - Number(a.featured));

        catalogTree[c.key][t.key].subtypes[s.key] = {
          id: s.id,
          key: s.key,
          label: s.label,
          products,
        };
      }
    }
  }

  return { categoryMeta, enabledCategories, catalog: catalogTree };
}
