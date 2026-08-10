"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage";
import { buttonSlot, baseSlot } from "@/lib/spaceLayers";

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

  // A brand-new layer appends to the end of the stacking order (existing
  // layers keep whatever position they already have) - only meaningful for
  // feature/choice slots, but harmless to compute for button/base too.
  const sortOrder = existing
    ? existing.sortOrder
    : await prisma.spaceLayerImage.count({ where: { spaceKey, slot: { notIn: [buttonSlot(), baseSlot()] } } });

  await prisma.spaceLayerImage.upsert({
    where: { spaceKey_slot: { spaceKey, slot } },
    create: { spaceKey, slot, imageUrl, sortOrder },
    update: { imageUrl },
  });
  if (existing) await deleteFromStorage(existing.imageUrl).catch(() => {});

  revalidateDesignLayers();
}

// Swaps sortOrder with the previous/next layer in the same space - scoped to
// feature/choice slots only (button/base aren't part of the reorderable
// stack: button is a standalone picker icon, base always renders at the
// very bottom regardless of sortOrder - see resolveLayerImages()).
export async function moveSpaceLayerImage(spaceKey: string, slot: string, direction: "up" | "down") {
  await requireAdminOrMarketing();
  const layers = await prisma.spaceLayerImage.findMany({
    where: { spaceKey, slot: { notIn: [buttonSlot(), baseSlot()] } },
    orderBy: { sortOrder: "asc" },
  });
  const idx = layers.findIndex((l) => l.slot === slot);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= layers.length) return;
  const a = layers[idx];
  const b = layers[swapIdx];
  await prisma.$transaction([
    prisma.spaceLayerImage.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.spaceLayerImage.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
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
