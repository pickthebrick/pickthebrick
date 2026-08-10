import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppOtp } from "@/lib/whatsapp";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function isValidPhone(phone: string) {
  return /^\+?\d{7,15}$/.test(phone);
}

// Sends a fresh 6-digit WhatsApp OTP for `phone`, replacing any still-pending
// code for the same number. Delivery depends on the Meta WhatsApp Cloud API
// being configured (WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID) and an
// approved "Authentication" template - see lib/whatsapp.ts's own fallback.
// Until then this still works end-to-end for development: the code lands in
// the server console instead of an actual WhatsApp message.
export async function requestPhoneCode(phone: string) {
  const normalized = normalizePhone(phone);
  if (!/^\+?\d{7,15}$/.test(normalized)) throw new Error("Enter a valid phone number");

  const recent = await prisma.phoneVerification.findFirst({
    where: { phone: normalized, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) throw new Error("Please wait a moment before requesting another code");

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.phoneVerification.create({
    data: { phone: normalized, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  await sendWhatsAppOtp(normalized, code);
}

// Verifies `code` against the latest pending OTP for `phone`. Returns true
// once, consuming the row (deleted on success) - callers persist whatever
// they need (User.whatsappNumber/whatsappVerifiedAt, etc.) themselves.
export async function confirmPhoneCode(phone: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const record = await prisma.phoneVerification.findFirst({
    where: { phone: normalized },
    orderBy: { createdAt: "desc" },
  });
  if (!record) throw new Error("No pending code for this number - request a new one");
  if (record.expiresAt < new Date()) {
    await prisma.phoneVerification.delete({ where: { id: record.id } });
    throw new Error("That code expired - request a new one");
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.phoneVerification.delete({ where: { id: record.id } });
    throw new Error("Too many incorrect attempts - request a new code");
  }

  const valid = await bcrypt.compare(code.trim(), record.codeHash);
  if (!valid) {
    await prisma.phoneVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return false;
  }

  await prisma.phoneVerification.delete({ where: { id: record.id } });
  return true;
}
