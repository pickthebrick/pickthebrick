"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { findSwapIndex } from "@/lib/reorder";
import { Role, type Unit } from "@/app/generated/prisma/enums";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.admin) throw new Error("Admin only");
  return session;
}

function revalidateProducts() {
  revalidatePath("/admin/products");
  revalidatePath("/build");
}

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

// ---------- categories ----------

export async function createCategory(label: string, subtitle: string, unit: Unit) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Please enter a category name");

  const base = slugify(label);
  const key = await uniqueKey(base, async (k) => (await prisma.category.count({ where: { key: k } })) > 0);
  const count = await prisma.category.count();
  await prisma.category.create({
    data: { key, label: label.trim(), subtitle: subtitle.trim() || null, unit, sortOrder: count },
  });
  revalidateProducts();
}

export async function updateCategory(categoryId: string, label: string, subtitle: string, unit: Unit) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Please enter a category name");
  await prisma.category.update({
    where: { id: categoryId },
    data: { label: label.trim(), subtitle: subtitle.trim() || null, unit },
  });
  revalidateProducts();
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id: categoryId } });
  revalidateProducts();
}

export async function moveCategory(categoryId: string, direction: "up" | "down") {
  await requireAdmin();
  const siblings = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = siblings.findIndex((c) => c.id === categoryId);
  const swapIdx = findSwapIndex(siblings, categoryId, direction);
  if (swapIdx === null) return;
  await prisma.$transaction([
    prisma.category.update({ where: { id: siblings[idx].id }, data: { sortOrder: siblings[swapIdx].sortOrder } }),
    prisma.category.update({ where: { id: siblings[swapIdx].id }, data: { sortOrder: siblings[idx].sortOrder } }),
  ]);
  revalidateProducts();
}

// ---------- types ----------

export async function createType(categoryId: string, label: string) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Please enter a type name");

  const base = slugify(label);
  const key = await uniqueKey(
    base,
    async (k) => (await prisma.type.count({ where: { categoryId, key: k } })) > 0,
  );
  const count = await prisma.type.count({ where: { categoryId } });
  await prisma.type.create({ data: { categoryId, key, label: label.trim(), sortOrder: count } });
  revalidateProducts();
}

export async function updateType(typeId: string, label: string) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Please enter a type name");
  await prisma.type.update({ where: { id: typeId }, data: { label: label.trim() } });
  revalidateProducts();
}

export async function deleteType(typeId: string) {
  await requireAdmin();
  await prisma.type.delete({ where: { id: typeId } });
  revalidateProducts();
}

export async function moveType(typeId: string, direction: "up" | "down") {
  await requireAdmin();
  const type = await prisma.type.findUnique({ where: { id: typeId } });
  if (!type) return;
  const siblings = await prisma.type.findMany({ where: { categoryId: type.categoryId }, orderBy: { sortOrder: "asc" } });
  const idx = siblings.findIndex((t) => t.id === typeId);
  const swapIdx = findSwapIndex(siblings, typeId, direction);
  if (swapIdx === null) return;
  await prisma.$transaction([
    prisma.type.update({ where: { id: siblings[idx].id }, data: { sortOrder: siblings[swapIdx].sortOrder } }),
    prisma.type.update({ where: { id: siblings[swapIdx].id }, data: { sortOrder: siblings[idx].sortOrder } }),
  ]);
  revalidateProducts();
}

// ---------- subtypes ----------

export async function createSubtype(typeId: string, label: string) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Please enter a style name");

  const base = slugify(label);
  const key = await uniqueKey(
    base,
    async (k) => (await prisma.subtype.count({ where: { typeId, key: k } })) > 0,
  );
  const count = await prisma.subtype.count({ where: { typeId } });
  await prisma.subtype.create({ data: { typeId, key, label: label.trim(), sortOrder: count } });
  revalidateProducts();
}

export async function updateSubtype(subtypeId: string, label: string) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Please enter a style name");
  await prisma.subtype.update({ where: { id: subtypeId }, data: { label: label.trim() } });
  revalidateProducts();
}

export async function deleteSubtype(subtypeId: string) {
  await requireAdmin();
  await prisma.subtype.delete({ where: { id: subtypeId } });
  revalidateProducts();
}

export async function moveSubtype(subtypeId: string, direction: "up" | "down") {
  await requireAdmin();
  const subtype = await prisma.subtype.findUnique({ where: { id: subtypeId } });
  if (!subtype) return;
  const siblings = await prisma.subtype.findMany({ where: { typeId: subtype.typeId }, orderBy: { sortOrder: "asc" } });
  const idx = siblings.findIndex((s) => s.id === subtypeId);
  const swapIdx = findSwapIndex(siblings, subtypeId, direction);
  if (swapIdx === null) return;
  await prisma.$transaction([
    prisma.subtype.update({ where: { id: siblings[idx].id }, data: { sortOrder: siblings[swapIdx].sortOrder } }),
    prisma.subtype.update({ where: { id: siblings[swapIdx].id }, data: { sortOrder: siblings[idx].sortOrder } }),
  ]);
  revalidateProducts();
}
