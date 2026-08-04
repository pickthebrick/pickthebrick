"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/enums";

export type AuthResult = { success: true } | { error: string };

export async function signUp(input: { email: string; password: string; fullName?: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 6) {
    return { error: "Enter a valid email and a password of at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists - try signing in instead." };
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName: input.fullName || null, role: Role.client },
  });
  await createSession(user.id);
  return { success: true as const };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid email or password." };

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  await createSession(user.id);
  return { success: true as const };
}

export async function signOutAction() {
  await destroySession();
}
