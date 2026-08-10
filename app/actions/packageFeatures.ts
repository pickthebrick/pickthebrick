"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role, PackageTier } from "@/app/generated/prisma/enums";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function requireAdminOrMarketing() {
  const session = await getSession();
  if (!session || (!isAdminRole(session.role) && session.role !== Role.marketing)) throw new Error("Admin only");
  return session;
}

function revalidatePackageFeatures() {
  revalidatePath("/admin/marketing");
  revalidatePath("/design");
}

export async function createPackageFeatureItem(input: { label: string; minTier: PackageTier }) {
  await requireAdminOrMarketing();
  const label = input.label.trim();
  if (!label) throw new Error("Please enter a label");
  // Scoped to this tier alone, not the whole table - each tier's tab
  // manages its own append-to-end ordering independently.
  const count = await prisma.packageFeatureItem.count({ where: { minTier: input.minTier } });
  await prisma.packageFeatureItem.create({ data: { label, minTier: input.minTier, sortOrder: count } });
  revalidatePackageFeatures();
}

export async function updatePackageFeatureItem(
  id: string,
  input: { label: string; description: string; minTier: PackageTier },
) {
  await requireAdminOrMarketing();
  const label = input.label.trim();
  if (!label) throw new Error("Please enter a label");
  await prisma.packageFeatureItem.update({
    where: { id },
    data: { label, description: input.description.trim() || null, minTier: input.minTier },
  });
  revalidatePackageFeatures();
}

export async function deletePackageFeatureItem(id: string) {
  await requireAdminOrMarketing();
  const item = await prisma.packageFeatureItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.packageFeatureItem.delete({ where: { id } });
  if (item.sampleImageUrl) await deleteFromStorage(item.sampleImageUrl).catch(() => {});
  revalidatePackageFeatures();
}

// Swaps sortOrder with the previous/next item so the admin panel can offer
// simple move-up/move-down controls without a full drag-reorder UI. Scoped
// to the item's own tier - each tab's ordering is independent of the others.
export async function movePackageFeatureItem(id: string, direction: "up" | "down") {
  await requireAdminOrMarketing();
  const current = await prisma.packageFeatureItem.findUnique({ where: { id } });
  if (!current) return;
  const items = await prisma.packageFeatureItem.findMany({
    where: { minTier: current.minTier },
    orderBy: { sortOrder: "asc" },
  });
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return;
  const a = items[idx];
  const b = items[swapIdx];
  await prisma.$transaction([
    prisma.packageFeatureItem.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.packageFeatureItem.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePackageFeatures();
}

// Marketer-uploaded reference photo for one feature line - gates the
// client-facing "Sample" button (see lib/packageFeatures.ts / DesignPageClient.tsx),
// only shown once this is set.
export async function setPackageFeatureSampleImage(id: string, formData: FormData) {
  await requireAdminOrMarketing();
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose an image");
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");

  const item = await prisma.packageFeatureItem.findUnique({ where: { id } });
  if (!item) throw new Error("Item not found");

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadToStorage("package-features", filename, buffer, file.type);

  await prisma.packageFeatureItem.update({ where: { id }, data: { sampleImageUrl: imageUrl } });
  if (item.sampleImageUrl) await deleteFromStorage(item.sampleImageUrl).catch(() => {});
  revalidatePackageFeatures();
}

export async function removePackageFeatureSampleImage(id: string) {
  await requireAdminOrMarketing();
  const item = await prisma.packageFeatureItem.findUnique({ where: { id } });
  if (!item || !item.sampleImageUrl) return;
  await prisma.packageFeatureItem.update({ where: { id }, data: { sampleImageUrl: null } });
  await deleteFromStorage(item.sampleImageUrl).catch(() => {});
  revalidatePackageFeatures();
}
