import "server-only";
import twilio from "twilio";

// Twilio Verify holds all OTP state itself (the pending code, its expiry,
// attempt counts, resend cooldowns) - this file just calls the Verify
// Service, it doesn't generate or store codes anymore (see the removed
// PhoneVerification table this replaced).
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

function verifyService() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) return null;
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function isValidPhone(phone: string) {
  return /^\+?\d{7,15}$/.test(phone);
}

// Twilio Verify requires E.164 (a leading "+") - a client typing a local
// Dubai number as "05X XXX XXXX" or "5X XXX XXXX" without a country code is
// the common case, so default a bare-digits number to +971 rather than
// rejecting it. A number that already starts with "+" is trusted as-is.
function toE164(normalized: string): string {
  if (normalized.startsWith("+")) return normalized;
  const local = normalized.replace(/^0+/, "");
  return `+971${local}`;
}

// Sends a fresh OTP for `phone` via WhatsApp, falling back to plain SMS if
// the WhatsApp send fails (e.g. the number has no WhatsApp account) - this
// is what "WhatsApp + SMS" means end to end, with no channel picker for the
// client to deal with. Falls back to a console-log stub when Twilio isn't
// configured, matching lib/email.ts/lib/whatsapp.ts's own dev fallback -
// the code just isn't real, but the rest of the flow still exercises fine.
export async function requestPhoneCode(phone: string): Promise<void> {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) throw new Error("Enter a valid phone number");
  const to = toE164(normalized);

  const service = verifyService();
  if (!service) {
    console.log(`[phone-verify] Twilio not configured - would send an OTP to ${to} now.`);
    return;
  }

  try {
    await service.verifications.create({ to, channel: "whatsapp" });
  } catch (err) {
    console.warn(`[phone-verify] WhatsApp send failed for ${to}, falling back to SMS:`, err);
    await service.verifications.create({ to, channel: "sms" });
  }
}

// Checks `code` against the pending Verify attempt for `phone`. Returns
// false (not thrown) for a wrong code so the caller can show "incorrect
// code, try again" inline - only genuinely exceptional cases (no pending
// verification at all, expired) throw.
export async function confirmPhoneCode(phone: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const to = toE164(normalized);

  const service = verifyService();
  if (!service) {
    console.log(`[phone-verify] Twilio not configured - accepting any code for ${to} in dev.`);
    return true;
  }

  try {
    const check = await service.verificationChecks.create({ to, code: code.trim() });
    return check.status === "approved";
  } catch (err) {
    // Twilio throws (rather than returning a "pending" status) once the
    // underlying verification is gone - expired, already used, or too many
    // wrong attempts already made against it.
    const twilioErr = err as { code?: number };
    if (twilioErr.code === 20404) throw new Error("That code expired or was already used - request a new one");
    throw new Error("Could not verify that code - try again");
  }
}
