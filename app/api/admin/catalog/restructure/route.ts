import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// One-off catalog-structure editor for scripted/agent use, alongside the
// bearer-key product-import routes. Those only create/delete Products - this
// covers the Type/Subtype rename + reparent operations the admin UI's
// catalog CRUD (app/actions/catalog.ts) requires a signed-in session for,
// which a script has no way to establish. Same bearer-key auth as
// /api/admin/products*; see proxy.ts for why /api/* skips the cookie gate.

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

type Op =
  | { op: "renameType"; category: string; from: string; to: string }
  | { op: "renameSubtype"; category: string; type: string; from: string; to: string }
  | { op: "moveSubtype"; category: string; subtype: string; fromType: string; toType: string; renameTo?: string }
  | { op: "deleteEmptySubtypes"; category: string }
  | { op: "deleteEmptyTypes"; category: string };

type OpResult = { op: string; status: "done" | "error"; detail: string };

async function findCategory(label: string) {
  return prisma.category.findFirst({ where: { label: { equals: label, mode: "insensitive" } } });
}
async function findType(categoryId: string, label: string) {
  return prisma.type.findFirst({ where: { categoryId, label: { equals: label, mode: "insensitive" } } });
}
async function findSubtype(typeId: string, label: string) {
  return prisma.subtype.findFirst({ where: { typeId, label: { equals: label, mode: "insensitive" } } });
}

export async function POST(request: NextRequest) {
  const expectedKey = process.env.PRODUCTS_IMPORT_API_KEY;
  const givenKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedKey || givenKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { operations?: Op[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(body.operations)) {
    return NextResponse.json({ error: 'Body must be { "operations": [...] }' }, { status: 400 });
  }

  const results: OpResult[] = [];

  for (const raw of body.operations) {
    const label = JSON.stringify(raw);
    try {
      const category = await findCategory(raw.category);
      if (!category) throw new Error(`Category "${raw.category}" not found`);

      if (raw.op === "renameType") {
        const type = await findType(category.id, raw.from);
        if (!type) throw new Error(`Type "${raw.from}" not found under "${raw.category}"`);
        const key = await uniqueKey(slugify(raw.to), async (k) => {
          if (k === type.key) return false;
          return (await prisma.type.count({ where: { categoryId: category.id, key: k } })) > 0;
        });
        await prisma.type.update({ where: { id: type.id }, data: { label: raw.to, key } });
        results.push({ op: label, status: "done", detail: `Type "${raw.from}" -> "${raw.to}"` });
      } else if (raw.op === "renameSubtype") {
        const type = await findType(category.id, raw.type);
        if (!type) throw new Error(`Type "${raw.type}" not found under "${raw.category}"`);
        const subtype = await findSubtype(type.id, raw.from);
        if (!subtype) throw new Error(`Subtype "${raw.from}" not found under "${raw.type}"`);
        const key = await uniqueKey(slugify(raw.to), async (k) => {
          if (k === subtype.key) return false;
          return (await prisma.subtype.count({ where: { typeId: type.id, key: k } })) > 0;
        });
        await prisma.subtype.update({ where: { id: subtype.id }, data: { label: raw.to, key } });
        results.push({ op: label, status: "done", detail: `Subtype "${raw.from}" -> "${raw.to}" (under ${raw.type})` });
      } else if (raw.op === "moveSubtype") {
        const fromType = await findType(category.id, raw.fromType);
        if (!fromType) throw new Error(`Type "${raw.fromType}" not found under "${raw.category}"`);
        const subtype = await findSubtype(fromType.id, raw.subtype);
        if (!subtype) throw new Error(`Subtype "${raw.subtype}" not found under "${raw.fromType}"`);

        let toType = await findType(category.id, raw.toType);
        if (!toType) {
          const key = await uniqueKey(slugify(raw.toType), async (k) => (await prisma.type.count({ where: { categoryId: category.id, key: k } })) > 0);
          const count = await prisma.type.count({ where: { categoryId: category.id } });
          toType = await prisma.type.create({ data: { categoryId: category.id, key, label: raw.toType, sortOrder: count } });
        }

        const newLabel = raw.renameTo?.trim() || subtype.label;
        const key = await uniqueKey(slugify(newLabel), async (k) => {
          if (toType!.id === fromType.id && k === subtype.key) return false;
          return (await prisma.subtype.count({ where: { typeId: toType!.id, key: k } })) > 0;
        });
        await prisma.subtype.update({ where: { id: subtype.id }, data: { typeId: toType.id, label: newLabel, key } });
        results.push({ op: label, status: "done", detail: `Subtype "${raw.subtype}" moved ${raw.fromType} -> ${raw.toType}${raw.renameTo ? ` (renamed to "${raw.renameTo}")` : ""}` });
      } else if (raw.op === "deleteEmptySubtypes") {
        const types = await prisma.type.findMany({ where: { categoryId: category.id }, select: { id: true } });
        const empty = await prisma.subtype.findMany({
          where: { typeId: { in: types.map((t) => t.id) }, products: { none: {} } },
          select: { id: true, label: true },
        });
        for (const st of empty) await prisma.subtype.delete({ where: { id: st.id } });
        results.push({ op: label, status: "done", detail: `Deleted ${empty.length} empty subtypes: ${empty.map((s) => s.label).join(", ") || "none"}` });
      } else if (raw.op === "deleteEmptyTypes") {
        const empty = await prisma.type.findMany({
          where: { categoryId: category.id, subtypes: { none: {} } },
          select: { id: true, label: true },
        });
        for (const t of empty) await prisma.type.delete({ where: { id: t.id } });
        results.push({ op: label, status: "done", detail: `Deleted ${empty.length} empty types: ${empty.map((t) => t.label).join(", ") || "none"}` });
      } else {
        throw new Error(`Unknown op`);
      }
    } catch (err) {
      results.push({ op: label, status: "error", detail: err instanceof Error ? err.message : String(err) });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/build");

  const done = results.filter((r) => r.status === "done").length;
  const failed = results.filter((r) => r.status === "error").length;
  return NextResponse.json({ done, failed, results });
}
