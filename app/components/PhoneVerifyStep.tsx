"use client";

import { useState } from "react";
import { saveUnverifiedPhoneAction, skipPhoneVerificationAction } from "@/app/actions/phoneVerification";

// The once-ever phone-number capture step, shown right after signup
// (LoginForm.tsx/AuthGate.tsx/VerifyPhoneClient.tsx) and again before a
// signed-in client's first quote/design-request submission
// (BuildClient.tsx/FeaturesWizard.tsx) if they haven't provided one yet -
// skipped silently once session.whatsappVerifiedAt or whatsappSkippedAt is
// set, so this is never shown twice.
//
// This used to also offer a WhatsApp OTP send/verify step (Send code ->
// enter code), but WHATSAPP_ACCESS_TOKEN/PHONE_NUMBER_ID/OTP_TEMPLATE_NAME
// aren't configured anywhere (no Meta WhatsApp Business API + approved
// Authentication template yet - see lib/whatsapp.ts), so sendWhatsAppOtp()
// silently never delivered anything and every real client who clicked "Send
// code" landed on an OTP-entry screen with no way to actually get a code -
// a guaranteed dead end. Until that's set up, this only ever captures and
// saves the number unverified (what "Verify later" already did safely) -
// requestPhoneCodeAction/confirmPhoneCodeAction and lib/phoneVerification.ts
// are untouched, so the OTP step can come back by re-adding the "code" step
// here once WhatsApp delivery is real.
//
// "Verify later" (below) must always be present and must never require a
// valid phone number first - a prior version of this screen only had
// Cancel (shown at just one of five call sites) and a required, regex-
// validated phone field, which left signup dead-ended for anyone without a
// phone handy or whose number didn't match the strict format.
export default function PhoneVerifyStep({
  onSuccess,
  onCancel,
  onSkip,
  initialPhone,
}: {
  onSuccess: () => void;
  onCancel?: () => void;
  // Every call site passes this today; kept optional (falling back to
  // onSuccess) so the type doesn't force a change at every call site.
  onSkip?: () => void;
  // Pre-fills the phone field when it's already on file but unverified
  // (e.g. this same client skipped at signup) - cuts a re-typed field out of
  // a later voluntary attempt from the Profile page.
  initialPhone?: string;
}) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveUnverifiedPhoneAction(phone);
      (onSkip ?? onSuccess)();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that number - try again");
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip() {
    setBusy(true);
    setError(null);
    try {
      await skipPhoneVerificationAction();
      (onSkip ?? onSuccess)();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not skip right now - try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-gate-overlay" onClick={onCancel ? (e) => e.target === e.currentTarget && onCancel() : undefined}>
      <div className="auth-gate">
        <div className="auth-gate-context">What&apos;s the best number to reach you on?</div>
        <form className="auth-gate-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}
          <input
            type="tel"
            placeholder="Phone number (e.g. +971 5X XXX XXXX)"
            required
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="auth-gate-hint">A PickTheBrick Captain will call you on this number to confirm your quote.</p>
          <div className="auth-gate-actions">
            {onCancel && (
              <button type="button" className="signup-gate-cancel" disabled={busy} onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="signup-gate-submit" disabled={busy}>
              {busy ? "Saving..." : "Continue"}
            </button>
          </div>
          <button type="button" className="auth-gate-skip" disabled={busy} onClick={handleSkip}>
            Verify later
          </button>
        </form>
      </div>
    </div>
  );
}
