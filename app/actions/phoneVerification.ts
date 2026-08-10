"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requestPhoneCode, confirmPhoneCode, normalizePhone, isValidPhone } from "@/lib/phoneVerification";

export async function requestPhoneCodeAction(phone: string) {
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

// Saves the number a client typed at signup without verifying it - used by
// the "Skip for now" option on the once-ever post-signup phone step (see
// PhoneVerifyStep's onSkip prop). whatsappVerifiedAt stays unset, so the
// existing Build/Design submit-time gate (BuildClient.tsx/FeaturesWizard.tsx)
// still catches an unverified number before the client's first quote/design
// request goes out - this only saves the number so that later prompt can be
// pre-filled instead of asking from scratch.
export async function saveUnverifiedPhoneAction(phone: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) throw new Error("Enter a valid phone number");

  await prisma.user.update({
    where: { id: session.id },
    data: { phone: normalized, whatsappNumber: normalized },
  });
}
