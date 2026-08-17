"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requestPhoneCode, confirmPhoneCode, normalizePhone, isValidPhone } from "@/lib/phoneVerification";

// Requires a session even though the OTP itself isn't tied to it yet
// (confirmPhoneCodeAction is what actually persists it) - Twilio bills per
// verification attempt, so this shouldn't be callable by a logged-out
// script hammering arbitrary numbers.
export async function requestPhoneCodeAction(phone: string) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  await requestPhoneCode(phone);
}

// Verifies the code and, on success, saves the number onto the signed-in
// user's own account (whatsappNumber + whatsappVerifiedAt) - used by both
// the checkout-time PhoneVerifyStep and the Profile page's phone section.
export async function confirmPhoneCodeAction(phone: string, code: string): Promise<{ verified: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const ok = await confirmPhoneCode(phone, code);
  if (ok) {
    await prisma.user.update({
      where: { id: session.id },
      data: { whatsappNumber: phone.replace(/[^\d+]/g, ""), whatsappVerifiedAt: new Date() },
    });
  }
  return { verified: ok };
}

// Saves the number a client typed without verifying it - used by the
// "Verify later" option on PhoneVerifyStep (see its onSkip prop).
// whatsappVerifiedAt stays unset, but whatsappSkippedAt is now set, which is
// what stops the Build/Design submit-time gate (BuildClient.tsx/
// FeaturesWizard.tsx) from re-showing this step on every future submission -
// the client already made their choice once, this is a "verify later" not a
// "ask me again every time." The number itself is saved so a later voluntary
// verify attempt (Profile page) starts pre-filled instead of from scratch.
export async function saveUnverifiedPhoneAction(phone: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) throw new Error("Enter a valid phone number");

  await prisma.user.update({
    where: { id: session.id },
    data: { phone: normalized, whatsappNumber: normalized, whatsappSkippedAt: new Date() },
  });
}

// The actual "Verify later" action - skips without requiring any phone
// number to be entered/validated first. This is what makes the skip button
// unconditionally usable: saveUnverifiedPhoneAction above still requires a
// value that passes isValidPhone, which is exactly the trap a user with no
// phone handy (or a number in a format the regex rejects) was stuck behind.
export async function skipPhoneVerificationAction(): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  await prisma.user.update({
    where: { id: session.id },
    data: { whatsappSkippedAt: new Date() },
  });
}
