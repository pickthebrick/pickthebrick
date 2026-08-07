"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (!isAdminRole(session.role)) throw new Error("Admin only");
  return session;
}

// Admin-only contact info edit from the Database tab - phone/whatsappNumber
// aren't collected anywhere else for most roles yet, so this is the one
// place they can be filled in until each role's own flow captures them.
export async function updateUserContactInfo(userId: string, data: { phone?: string; whatsappNumber?: string }) {
  await requireAdmin();
  const update: { phone?: string | null; whatsappNumber?: string | null } = {};
  if ("phone" in data) update.phone = data.phone?.trim() || null;
  if ("whatsappNumber" in data) update.whatsappNumber = data.whatsappNumber?.trim() || null;
  await prisma.user.update({ where: { id: userId }, data: update });
  revalidatePath("/admin/database");
}
