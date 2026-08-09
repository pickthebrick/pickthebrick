"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
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

function revalidateStyleFinder() {
  revalidatePath("/admin/marketing");
  revalidatePath("/design/style-finder");
}

// Manually-uploaded photography for one (style, slot) in the Style Finder
// swipe deck - see lib/styleFinder.ts's IMAGES_PER_STYLE/resolveStyleImages.
export async function setStyleFinderImage(styleKey: string, slot: number, formData: FormData) {
  await requireAdminOrMarketing();

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose an image");
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");

  const existing = await prisma.styleFinderImage.findUnique({ where: { styleKey_slot: { styleKey, slot } } });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadToStorage("style-finder", filename, buffer, file.type);

  await prisma.styleFinderImage.upsert({
    where: { styleKey_slot: { styleKey, slot } },
    create: { styleKey, slot, imageUrl },
    update: { imageUrl },
  });
  if (existing) await deleteFromStorage(existing.imageUrl).catch(() => {});

  revalidateStyleFinder();
}

export async function removeStyleFinderImage(styleKey: string, slot: number) {
  await requireAdminOrMarketing();
  const existing = await prisma.styleFinderImage.findUnique({ where: { styleKey_slot: { styleKey, slot } } });
  if (!existing) return;
  await prisma.styleFinderImage.delete({ where: { styleKey_slot: { styleKey, slot } } });
  await deleteFromStorage(existing.imageUrl).catch(() => {});
  revalidateStyleFinder();
}
