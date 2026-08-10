"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export type ProfileResult = { success: true } | { error: string };

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

// Self-service name/company edit - every role, scoped to the signed-in
// user's own id. Parallel to (not replacing) updateUserContactInfo in
// app/actions/users.ts, which is the admin-editing-someone-else path.
export async function updateProfile(data: { fullName: string; company?: string }): Promise<ProfileResult> {
  const session = await requireSession();
  await prisma.user.update({
    where: { id: session.id },
    data: { fullName: data.fullName.trim() || null, company: data.company?.trim() || null },
  });
  revalidatePath("/profile");
  return { success: true };
}

export async function changeEmail(newEmail: string): Promise<ProfileResult> {
  const session = await requireSession();
  const email = newEmail.trim().toLowerCase();
  if (!email) return { error: "Enter a valid email address." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.id) {
    return { error: "Another account already uses that email." };
  }

  await prisma.user.update({ where: { id: session.id }, data: { email } });
  revalidatePath("/profile");
  return { success: true };
}

// Handles both cases in one action: an existing password account changing
// its password (currentPassword must match), and a Google-only account
// (passwordHash null) setting one for the first time (no currentPassword to
// check - see signIn()'s null-passwordHash branch in app/actions/auth.ts for
// the other half of this story).
export async function setOrChangePassword(data: { currentPassword?: string; newPassword: string }): Promise<ProfileResult> {
  const session = await requireSession();
  if (data.newPassword.length < 6) return { error: "New password must be at least 6 characters." };

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { passwordHash: true } });
  if (user?.passwordHash) {
    if (!data.currentPassword || !(await verifyPassword(data.currentPassword, user.passwordHash))) {
      return { error: "Current password is incorrect." };
    }
  }

  const passwordHash = await hashPassword(data.newPassword);
  await prisma.user.update({ where: { id: session.id }, data: { passwordHash } });
  revalidatePath("/profile");
  return { success: true };
}
