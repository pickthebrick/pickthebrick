import "server-only";
import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_BYTES = 32;
const EXPIRY_MINUTES = 60;
// Mirrors PhoneVerification's 60s resend cooldown in lib/phoneVerification.ts.
const RESEND_COOLDOWN_MS = 60_000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

// Always resolves the same way whether or not the email is registered, and
// the caller (requestPasswordResetAction) shows the same "check your email"
// message either way - this can't be used to enumerate accounts.
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return;

  const recent = await prisma.passwordReset.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return;

  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  // Only the most recently requested link is ever valid - requesting a new
  // one silently invalidates any still-unused older one.
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
  await prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt } });

  const origin = await siteOrigin();
  await sendPasswordResetEmail(user.email, `${origin}/reset-password?token=${token}`);
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<{ error: string } | { success: true }> {
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired - request a new one." };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
  await prisma.passwordReset.deleteMany({ where: { userId: record.userId } });
  // A password reset is an account-recovery action - sign the account out
  // everywhere else, in case the reset was needed because of a compromise
  // rather than plain forgetfulness.
  await prisma.session.deleteMany({ where: { userId: record.userId } });
  return { success: true };
}
