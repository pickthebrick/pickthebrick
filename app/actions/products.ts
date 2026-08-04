"use server";

import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { findSwapIndex } from "@/lib/reorder";
import { Role, type Unit } from "@/app/generated/prisma/enums";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const DOWNLOAD_EXTENSIONS = new Set(["pdf", "doc", "docx", "glb", "gltf", "zip", "jpg", "jpeg", "png"]);

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.admin) throw new Error("Admin only");
  return session;
}

function revalidateProducts() {
  revalidatePath("/admin/products");
  revalidatePath("/build");
}

export async function toggleCategoryEnabled(categoryId: string) {
  await requireAdmin();
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return;
  await prisma.category.update({ where: { id: categoryId }, data: { enabled: !category.enabled } });
  revalidateProducts();
}

function validateProductInput(name: string, rate: number) {
  if (!name.trim()) throw new Error("Please enter a product name");
  if (!Number.isFinite(rate) || rate < 0) throw new Error("Please enter a valid rate");
}

export async function createProduct(subtypeId: string, name: string, rate: number, unit: Unit | null, featured: boolean) {
  await requireAdmin();
  validateProductInput(name, rate);

  const count = await prisma.product.count({ where: { subtypeId } });
  await prisma.product.create({
    data: { subtypeId, name: name.trim(), rate, unit, featured, sortOrder: count },
  });
  revalidateProducts();
}

export async function updateProduct(productId: string, name: string, rate: number, unit: Unit | null, featured: boolean) {
  await requireAdmin();
  validateProductInput(name, rate);

  await prisma.product.update({
    where: { id: productId },
    data: { name: name.trim(), rate, unit, featured },
  });
  revalidateProducts();
}

export async function updateProductDescription(productId: string, description: string) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data: { description: description.trim() || null },
  });
  revalidateProducts();
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidateProducts();
}

export async function moveProduct(productId: string, direction: "up" | "down") {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  const siblings = await prisma.product.findMany({
    where: { subtypeId: product.subtypeId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = siblings.findIndex((p) => p.id === productId);
  const swapIdx = findSwapIndex(siblings, productId, direction);
  if (swapIdx === null) return;
  await prisma.$transaction([
    prisma.product.update({ where: { id: siblings[idx].id }, data: { sortOrder: siblings[swapIdx].sortOrder } }),
    prisma.product.update({ where: { id: siblings[swapIdx].id }, data: { sortOrder: siblings[idx].sortOrder } }),
  ]);
  revalidateProducts();
}

// ---------- images ----------

export async function addProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose an image");
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), "public", "product-images", filename), buffer);

  const asThumbnail = formData.get("thumbnail") === "on";
  if (asThumbnail) {
    const existing = await prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
    await prisma.$transaction([
      ...existing.map((img, i) => prisma.productImage.update({ where: { id: img.id }, data: { sortOrder: i + 1 } })),
      prisma.productImage.create({ data: { productId, path: `/product-images/${filename}`, sortOrder: 0 } }),
    ]);
  } else {
    const count = await prisma.productImage.count({ where: { productId } });
    await prisma.productImage.create({
      data: { productId, path: `/product-images/${filename}`, sortOrder: count },
    });
  }
  revalidateProducts();
}

export async function deleteProductImage(imageId: string) {
  await requireAdmin();
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return;
  await prisma.productImage.delete({ where: { id: imageId } });
  await unlink(path.join(process.cwd(), "public", image.path.replace(/^\//, ""))).catch(() => {});
  revalidateProducts();
}

export async function reorderProductImage(imageId: string, direction: "up" | "down") {
  await requireAdmin();
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return;
  const siblings = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = siblings.findIndex((i) => i.id === imageId);
  const swapIdx = findSwapIndex(siblings, imageId, direction);
  if (swapIdx === null) return;
  await prisma.$transaction([
    prisma.productImage.update({ where: { id: siblings[idx].id }, data: { sortOrder: siblings[swapIdx].sortOrder } }),
    prisma.productImage.update({ where: { id: siblings[swapIdx].id }, data: { sortOrder: siblings[idx].sortOrder } }),
  ]);
  revalidateProducts();
}

// ---------- color options ----------

export async function addColorOption(productId: string, name: string, hex: string) {
  await requireAdmin();
  if (!name.trim()) throw new Error("Please enter a color name");
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error("Please enter a valid hex color, e.g. #9a9187");

  const count = await prisma.productColorOption.count({ where: { productId } });
  await prisma.productColorOption.create({ data: { productId, name: name.trim(), hex, sortOrder: count } });
  revalidateProducts();
}

export async function deleteColorOption(colorId: string) {
  await requireAdmin();
  await prisma.productColorOption.delete({ where: { id: colorId } });
  revalidateProducts();
}

// ---------- specs ----------

export async function addSpec(productId: string, label: string, value: string) {
  await requireAdmin();
  if (!label.trim() || !value.trim()) throw new Error("Please enter both a label and a value");

  const count = await prisma.productSpec.count({ where: { productId } });
  await prisma.productSpec.create({ data: { productId, label: label.trim(), value: value.trim(), sortOrder: count } });
  revalidateProducts();
}

export async function deleteSpec(specId: string) {
  await requireAdmin();
  await prisma.productSpec.delete({ where: { id: specId } });
  revalidateProducts();
}

// ---------- downloads ----------

export async function addProductDownload(productId: string, label: string, kind: string, formData: FormData) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Please enter a label");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose a file");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!DOWNLOAD_EXTENSIONS.has(ext)) {
    throw new Error("Please upload a PDF, Word doc, GLB/GLTF, ZIP, JPG, or PNG file");
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), "public", "product-downloads", filename), buffer);

  const count = await prisma.productDownload.count({ where: { productId } });
  await prisma.productDownload.create({
    data: { productId, label: label.trim(), kind, filePath: `/product-downloads/${filename}`, sortOrder: count },
  });
  revalidateProducts();
}

export async function deleteProductDownload(downloadId: string) {
  await requireAdmin();
  const download = await prisma.productDownload.findUnique({ where: { id: downloadId } });
  if (!download) return;
  await prisma.productDownload.delete({ where: { id: downloadId } });
  await unlink(path.join(process.cwd(), "public", download.filePath.replace(/^\//, ""))).catch(() => {});
  revalidateProducts();
}
