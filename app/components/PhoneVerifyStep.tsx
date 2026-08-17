"use client";

import { useState } from "react";
import {
  requestPhoneCodeAction,
  confirmPhoneCodeAction,
  skipPhoneVerificationAction,
} from "@/app/actions/phoneVerification";

// The once-ever phone-number capture/verify step, shown right after signup
// (LoginForm.tsx/VerifyPhoneClient.tsx) and again before a signed-in
// client's first quote/design-request submission (BuildClient.tsx/
// FeaturesWizard.tsx) if they haven't provided one yet - skipped silently
// once session.whatsappVerifiedAt or whatsappSkippedAt is set, so this is
// never shown twice.
//
// Two steps: enter a number and send a code (lib/phoneVerification.ts, via
// Twilio Verify - WhatsApp first, falling back to SMS if that send fails),
// then enter the code that arrived. "Verify later" is always present at
// both steps and never requires a valid phone number or a real code first -
// a prior version of this screen only had Cancel (shown at just one of five
// call sites) and a required, regex-validated phone field with no way out,
// which left signup dead-ended for anyone without a phone handy.
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
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      await requestPhoneCodeAction(phone);
      setCode("");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a code - try again");
    } finally {
      setBusy(false);
    }
  }

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    void sendCode();
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { verified } = await confirmPhoneCodeAction(phone, code);
      if (!verified) {
        setError("That code isn't right - try again");
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify that code - try again");
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
        {step === "phone" ? (
          <>
            <div className="auth-gate-context">What&apos;s the best number to reach you on?</div>
            <form className="auth-gate-form" onSubmit={handleSendCode}>
              {error && <p className="form-error">{error}</p>}
              <input
                type="tel"
                placeholder="Phone number (e.g. +971 5X XXX XXXX)"
                required
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="auth-gate-hint">We&apos;ll send a one-time code to this number over WhatsApp or SMS.</p>
              <div className="auth-gate-actions">
                {onCancel && (
                  <button type="button" className="signup-gate-cancel" disabled={busy} onClick={onCancel}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="signup-gate-submit" disabled={busy}>
                  {busy ? "Sending..." : "Send code"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="auth-gate-context">Enter the code sent to {phone}</div>
            <form className="auth-gate-form" onSubmit={handleVerifyCode}>
              {error && <p className="form-error">{error}</p>}
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="auth-gate-actions">
                <button
                  type="button"
                  className="signup-gate-cancel"
                  disabled={busy}
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                >
                  Change number
                </button>
                <button type="submit" className="signup-gate-submit" disabled={busy}>
                  {busy ? "Verifying..." : "Verify"}
                </button>
              </div>
              <button type="button" className="auth-gate-skip" disabled={busy} onClick={() => void sendCode()}>
                Resend code
              </button>
            </form>
          </>
        )}
        <button type="button" className="auth-gate-skip" disabled={busy} onClick={handleSkip}>
          Verify later
        </button>
      </div>
    </div>
  );
}
