"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendTeamMemberWelcomeEmail } from "@/lib/email";
import { issueTeamWelcomeToken, siteOrigin } from "@/lib/passwordReset";
import { Role } from "@/app/generated/prisma/enums";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.super_admin) throw new Error("Super admin only");
  return session;
}

const TEAM_ROLES: Role[] = [Role.admin, Role.super_admin, Role.marketing, Role.captain];

// Issues a fresh set-password link (invalidating any older unused one - see
// issueTeamWelcomeToken) and emails it - used both right after creating an
// account and whenever a superadmin wants to resend/renew it.
async function sendWelcomeLink(userId: string, email: string, fullName: string) {
  const token = await issueTeamWelcomeToken(userId);
  const origin = await siteOrigin();
  await sendTeamMemberWelcomeEmail(email, {
    fullName,
    setPasswordUrl: `${origin}/reset-password?token=${token}`,
  });
}

export async function createAdmin(data: {
  email: string;
  fullName: string;
  phone: string;
  role: "admin" | "super_admin" | "marketing" | "captain";
}) {
  await requireSuperAdmin();
  const email = data.email.trim().toLowerCase();
  const fullName = data.fullName.trim();
  const phone = data.phone.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email");
  if (!fullName) throw new Error("Please enter a name");
  if (!phone) throw new Error("Please enter a mobile number");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with that email already exists");

  const role = TEAM_ROLES.includes(data.role as Role) ? (data.role as Role) : Role.admin;
  // No passwordHash yet - the account can't sign in at all until the new
  // team member follows the emailed link to choose their own password (same
  // /reset-password page and confirmPasswordReset flow as a self-service
  // reset). See lib/auth.ts's signIn() for the "no password set yet" message.
  const user = await prisma.user.create({ data: { email, fullName, phone, role } });
  await sendWelcomeLink(user.id, email, fullName);

  revalidatePath("/admin/team");
}

// Lets a superadmin resend (or send for the first time) the set-password
// welcome link on demand - e.g. the original email was lost, expired (7
// days), or went to spam.
export async function resendTeamWelcomeEmail(userId: string) {
  await requireSuperAdmin();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Account not found");
  if (!TEAM_ROLES.includes(target.role)) throw new Error("That account can't be managed from this page");

  await sendWelcomeLink(target.id, target.email, target.fullName ?? "there");
}

export async function updateAdminEmail(userId: string, newEmail: string) {
  await requireSuperAdmin();
  const email = newEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Account not found");
  if (!TEAM_ROLES.includes(target.role)) throw new Error("That account can't be managed from this page");
  if (email === target.email) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with that email already exists");

  await prisma.user.update({ where: { id: userId }, data: { email } });
  revalidatePath("/admin/team");
}

export async function deleteAdmin(userId: string) {
  const session = await requireSuperAdmin();
  if (userId === session.id) throw new Error("You can't delete your own account");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (!TEAM_ROLES.includes(target.role)) throw new Error("That account can't be managed from this page");

  if (target.role === Role.super_admin) {
    const remaining = await prisma.user.count({ where: { role: Role.super_admin } });
    if (remaining <= 1) throw new Error("Can't delete the last super admin account");
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    throw new Error("This account has activity on record and can't be deleted");
  }
  revalidatePath("/admin/team");
}
