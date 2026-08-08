import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/storage";
import { Unit } from "@/app/generated/prisma/enums";

// Bulk product import for scripted/agent use (e.g. Claude Cowork uploading a
// catalog) - an alternative to clicking through the admin Products UI one
// product at a time. Auth is a static bearer key (PRODUCTS_IMPORT_API_KEY),
// separate from the cookie-session admin auth every other admin action
// uses, since a script has no browser session to carry. See proxy.ts, which
// exempts /api/* from the session-redirect gate so this route can enforce
// its own auth.

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const UNITS = new Set(["sqm", "lm", "count"]);

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
}

async function uniqueKey(base: string, exists: (key: string) => Promise<boolean>): Promise<string> {
  let key = base;
  let n = 2;
  while (await exists(key)) {
    key = `${base}-${n}`;
    n++;
  }
  return key;
}

async function fetchImage(url: string, folder: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch image (${res.status}): ${url}`);
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = IMAGE_CONTENT_TYPES[contentType];
  if (!ext) throw new Error(`Unsupported image type "${contentType}" at ${url} - use JPG, PNG, WEBP, or GIF`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return uploadToStorage(folder, filename, buffer, contentType);
}

async function fetchDownload(url: string, folder: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch file (${res.status}): ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return uploadToStorage(folder, filename, buffer, res.headers.get("content-type") ?? undefined);
}

type ImportProductInput = {
  name: string;
  rate: number;
  unit?: string | null;
  description?: string;
  featured?: boolean;
  images?: string[];
  colors?: { name: string; hex: string; imageUrl?: string }[];
  specs?: { label: string; value: string }[];
  downloads?: { label: string; kind: string; url: string }[];
};
type ImportSubtypeInput = { label: string; products?: ImportProductInput[] };
type ImportTypeInput = { label: string; subtypes?: ImportSubtypeInput[] };
type ImportCategoryInput = { label: string; unit: string; subtitle?: string; types?: ImportTypeInput[] };

type ImportResult = { path: string; status: "created" | "error"; productId?: string; error?: string };

export async function POST(request: NextRequest) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { categories?: ImportCategoryInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(body.categories)) {
    return NextResponse.json({ error: 'Body must be { "categories": [...] }' }, { status: 400 });
  }

  const results: ImportResult[] = [];

  for (const cat of body.categories) {
    try {
      if (!cat.label?.trim()) throw new Error("Category missing label");
      if (!UNITS.has(cat.unit)) {
        throw new Error(`Category "${cat.label}" has invalid unit "${cat.unit}" (must be sqm, lm, or count)`);
      }

      let category = await prisma.category.findFirst({
        where: { label: { equals: cat.label.trim(), mode: "insensitive" } },
      });
      if (!category) {
        const base = slugify(cat.label);
        const key = await uniqueKey(base, async (k) => (await prisma.category.count({ where: { key: k } })) > 0);
        const count = await prisma.category.count();
        category = await prisma.category.create({
          data: {
            key,
            label: cat.label.trim(),
            subtitle: cat.subtitle?.trim() || null,
            unit: cat.unit as Unit,
            sortOrder: count,
          },
        });
      }
      const categoryId = category.id;

      for (const t of cat.types ?? []) {
        if (!t.label?.trim()) throw new Error(`Type missing label under category "${cat.label}"`);
        let type = await prisma.type.findFirst({
          where: { categoryId, label: { equals: t.label.trim(), mode: "insensitive" } },
        });
        if (!type) {
          const base = slugify(t.label);
          const key = await uniqueKey(base, async (k) => (await prisma.type.count({ where: { categoryId, key: k } })) > 0);
          const count = await prisma.type.count({ where: { categoryId } });
          type = await prisma.type.create({ data: { categoryId, key, label: t.label.trim(), sortOrder: count } });
        }
        const typeId = type.id;

        for (const st of t.subtypes ?? []) {
          if (!st.label?.trim()) throw new Error(`Subtype missing label under type "${t.label}"`);
          let subtype = await prisma.subtype.findFirst({
            where: { typeId, label: { equals: st.label.trim(), mode: "insensitive" } },
          });
          if (!subtype) {
            const base = slugify(st.label);
            const key = await uniqueKey(base, async (k) => (await prisma.subtype.count({ where: { typeId, key: k } })) > 0);
            const count = await prisma.subtype.count({ where: { typeId } });
            subtype = await prisma.subtype.create({ data: { typeId, key, label: st.label.trim(), sortOrder: count } });
          }
          const subtypeId = subtype.id;

          for (const p of st.products ?? []) {
            const path = `${cat.label} > ${t.label} > ${st.label} > ${p.name ?? "(unnamed)"}`;
            try {
              if (!p.name?.trim()) throw new Error("Product missing name");
              if (!Number.isFinite(p.rate) || p.rate < 0) throw new Error("Invalid rate");
              const unit = p.unit && UNITS.has(p.unit) ? (p.unit as Unit) : null;

              const count = await prisma.product.count({ where: { subtypeId } });
              const product = await prisma.product.create({
                data: {
                  subtypeId,
                  name: p.name.trim(),
                  rate: p.rate,
                  unit,
                  description: p.description?.trim() || null,
                  featured: !!p.featured,
                  sortOrder: count,
                },
              });

              if (p.images?.length) {
                for (let i = 0; i < p.images.length; i++) {
                  const imagePath = await fetchImage(p.images[i], "product-images");
                  await prisma.productImage.create({ data: { productId: product.id, path: imagePath, sortOrder: i } });
                }
              }
              if (p.colors?.length) {
                for (let i = 0; i < p.colors.length; i++) {
                  const c = p.colors[i];
                  if (!/^#[0-9a-fA-F]{6}$/.test(c.hex)) {
                    throw new Error(`Invalid hex color "${c.hex}" for color "${c.name}"`);
                  }
                  const imagePath = c.imageUrl ? await fetchImage(c.imageUrl, "product-images") : null;
                  await prisma.productColorOption.create({
                    data: { productId: product.id, name: c.name.trim(), hex: c.hex, imagePath, sortOrder: i },
                  });
                }
              }
              if (p.specs?.length) {
                for (let i = 0; i < p.specs.length; i++) {
                  const s = p.specs[i];
                  await prisma.productSpec.create({
                    data: { productId: product.id, label: s.label.trim(), value: s.value.trim(), sortOrder: i },
                  });
                }
              }
              if (p.downloads?.length) {
                for (let i = 0; i < p.downloads.length; i++) {
                  const d = p.downloads[i];
                  const filePath = await fetchDownload(d.url, "product-downloads");
                  await prisma.productDownload.create({
                    data: { productId: product.id, label: d.label.trim(), kind: d.kind, filePath, sortOrder: i },
                  });
                }
              }

              results.push({ path, status: "created", productId: product.id });
            } catch (err) {
              results.push({ path, status: "error", error: err instanceof Error ? err.message : String(err) });
            }
          }
        }
      }
    } catch (err) {
      results.push({
        path: cat.label ?? "(unknown category)",
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/build");

  const created = results.filter((r) => r.status === "created").length;
  const failed = results.filter((r) => r.status === "error").length;
  return NextResponse.json({ created, failed, results });
}
