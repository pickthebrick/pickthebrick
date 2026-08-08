"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { getAnonSessionId, clearAnonSessionId } from "@/lib/anonSession";
import { Role } from "@/app/generated/prisma/enums";

export type AuthResult = { success: true } | { error: string };

// Re-parents every Quote/DesignRequest tagged with this browser's ptb_anon
// cookie onto a just-authenticated client account, so signing up or signing
// in mid-Build/Design never loses what was already built anonymously - see
// lib/actor.ts. A no-op if there's no anon cookie (the common case for a
// normal login unrelated to Build/Design). Only wired for client accounts:
// a contractor/designer applicant signing up has no reason to inherit an
// unrelated anonymous quote.
async function reparentAnonymousSession(clientId: string) {
  const anonId = await getAnonSessionId();
  if (!anonId) return;
  await prisma.quote.updateMany({
    where: { anonymousSessionId: anonId },
    data: { clientId, anonymousSessionId: null },
  });
  await prisma.designRequest.updateMany({
    where: { anonymousSessionId: anonId },
    data: { clientId, anonymousSessionId: null },
  });
  await clearAnonSessionId();
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName?: string;
  // Optional, only ever collected on the plain client-signup form - a
  // contractor/designer gives that on their apply form instead.
  company?: string;
  // Only "contractor"/"designer" are ever honored here (the "Partner with
  // us" signup flows) - any other value, or omitting it, always falls back
  // to client. This is the sole carve-out from self-signup always creating a
  // client; captain/admin/marketing accounts remain admin-provisioned only
  // (see app/actions/team.ts).
  role?: "contractor" | "designer";
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 6) {
    return { error: "Enter a valid email and a password of at least 6 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists - try signing in instead." };
  }

  const role = input.role === "contractor" ? Role.contractor : input.role === "designer" ? Role.designer : Role.client;
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName: input.fullName || null, company: input.company?.trim() || null, role },
  });
  // A brand-new contractor/designer applicant needs to land on their own
  // apply page (under /contractor or /designer) right after signup, so this
  // session can't be client-only - see the isPendingApplicant note in
  // signIn() below for the matching rule on subsequent sign-ins.
  await createSession(user.id, role !== Role.client);
  if (role === Role.client) await reparentAnonymousSession(user.id);
  return { success: true as const };
}

export async function signIn(input: { email: string; password: string; viaStaffLogin?: boolean }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      contractorApplication: { select: { status: true } },
      designerApplication: { select: { status: true } },
    },
  });
  if (!user) return { error: "Invalid email or password." };

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  // A contractor/designer whose application isn't approved yet still needs
  // to reach their own apply/status page through the plain public /login -
  // the client-only-via-/login rule only kicks in once they're an active
  // staff member with a real dashboard to protect behind /staff-login.
  const isPendingApplicant =
    (user.role === Role.contractor && user.contractorApplication?.status !== "approved") ||
    (user.role === Role.designer && user.designerApplication?.status !== "approved");

  await createSession(user.id, input.viaStaffLogin === true || isPendingApplicant);
  if (user.role === Role.client) await reparentAnonymousSession(user.id);
  return { success: true as const };
}

export async function signOutAction() {
  await destroySession();
}
