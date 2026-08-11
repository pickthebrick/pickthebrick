"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.super_admin) throw new Error("Super admin only");
  return session;
}

export async function createBrainChecklistItem(text: string) {
  await requireSuperAdmin();
  const trimmed = text.trim();
  if (!trimmed) return;
  const count = await prisma.brainChecklistItem.count();
  await prisma.brainChecklistItem.create({ data: { text: trimmed, sortOrder: count } });
  revalidatePath("/admin/brain");
}

export async function toggleBrainChecklistItem(id: string) {
  await requireSuperAdmin();
  const item = await prisma.brainChecklistItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.brainChecklistItem.update({ where: { id }, data: { done: !item.done } });
  revalidatePath("/admin/brain");
}

export async function deleteBrainChecklistItem(id: string) {
  await requireSuperAdmin();
  await prisma.brainChecklistItem.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/brain");
}
