"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.super_admin) throw new Error("Super admin only");
  return session;
}

const TEAM_ROLES: Role[] = [Role.admin, Role.super_admin, Role.marketing, Role.captain];

export async function createAdmin(data: {
  email: string;
  password: string;
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
  if (data.password.length < 8) throw new Error("Password must be at least 8 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with that email already exists");

  const role = TEAM_ROLES.includes(data.role as Role) ? (data.role as Role) : Role.admin;
  const passwordHash = await hashPassword(data.password);
  await prisma.user.create({ data: { email, fullName, phone, passwordHash, role } });
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
