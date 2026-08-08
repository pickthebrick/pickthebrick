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

function revalidateDesignLayers() {
  revalidatePath("/admin/marketing");
  revalidatePath("/design/spaces");
  revalidatePath("/design/features");
}

// Manually-uploaded artwork for one (space, slot) - see lib/spaceLayers.ts
// for what `slot` strings mean.
export async function setSpaceLayerImage(spaceKey: string, slot: string, formData: FormData) {
  await requireAdminOrMarketing();

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose an image");
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Please upload a JPG, PNG, WEBP, or GIF image");

  const existing = await prisma.spaceLayerImage.findUnique({ where: { spaceKey_slot: { spaceKey, slot } } });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadToStorage("space-layers", filename, buffer, file.type);

  await prisma.spaceLayerImage.upsert({
    where: { spaceKey_slot: { spaceKey, slot } },
    create: { spaceKey, slot, imageUrl },
    update: { imageUrl },
  });
  if (existing) await deleteFromStorage(existing.imageUrl).catch(() => {});

  revalidateDesignLayers();
}

export async function removeSpaceLayerImage(spaceKey: string, slot: string) {
  await requireAdminOrMarketing();
  const existing = await prisma.spaceLayerImage.findUnique({ where: { spaceKey_slot: { spaceKey, slot } } });
  if (!existing) return;
  await prisma.spaceLayerImage.delete({ where: { spaceKey_slot: { spaceKey, slot } } });
  await deleteFromStorage(existing.imageUrl).catch(() => {});
  revalidateDesignLayers();
}
