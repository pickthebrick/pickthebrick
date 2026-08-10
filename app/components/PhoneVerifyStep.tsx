"use client";

import { useState } from "react";
import { requestPhoneCodeAction, confirmPhoneCodeAction, saveUnverifiedPhoneAction } from "@/app/actions/phoneVerification";

// The once-ever WhatsApp OTP capture step, shown right after signup
// (LoginForm.tsx/AuthGate.tsx/VerifyPhoneClient.tsx) and again before a
// signed-in client's first quote/design-request submission
// (BuildClient.tsx/FeaturesWizard.tsx) if they haven't verified OR skipped
// yet - skipped silently once session.whatsappVerifiedAt or
// whatsappSkippedAt is set, so this is never shown as a mandatory,
// unskippable gate: onSkip is always offered wherever this step can appear
// at all. Mirrors AuthGate's overlay shape/CSS classes (app/globals.css)
// since it's the same kind of one-time blocking step in the same flows.
export default function PhoneVerifyStep({
  onSuccess,
  onCancel,
  onSkip,
  initialPhone,
}: {
  onSuccess: () => void;
  onCancel?: () => void;
  // Present only at the post-signup step (see call sites) - lets the client
  // provide their number (mandatory) without completing the OTP round trip
  // right now. Saves the raw number unverified, so a later verify attempt
  // (Build/Design gate, or Profile) starts pre-filled instead of from
  // scratch. Absent everywhere else - those steps stay verify-or-cancel.
  onSkip?: () => void;
  // Pre-fills the phone field when it's already on file but unverified
  // (e.g. this same client skipped at signup) - cuts a re-typed field out of
  // the "verify later" path.
  initialPhone?: string;
}) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestPhoneCodeAction(phone);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a code - try again");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { verified } = await confirmPhoneCodeAction(phone, code);
      if (!verified) {
        setError("That code isn't right - check WhatsApp and try again");
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
    if (!phone.trim()) {
      setError("Enter your phone number first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveUnverifiedPhoneAction(phone);
      onSkip!();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that number - try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-gate-overlay" onClick={onCancel ? (e) => e.target === e.currentTarget && onCancel() : undefined}>
      <div className="auth-gate">
        <div className="auth-gate-context">
          {step === "phone"
            ? "What's the best number to reach you on?"
            : `Enter the code we sent to ${phone} on WhatsApp.`}
        </div>
        {step === "phone" ? (
          <form className="auth-gate-form" onSubmit={handleRequestCode}>
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
              {onSkip ? (
                <button type="button" className="signup-gate-cancel" disabled={busy} onClick={handleSkip}>
                  {busy ? "Saving..." : "Verify later"}
                </button>
              ) : (
                onCancel && (
                  <button type="button" className="signup-gate-cancel" disabled={busy} onClick={onCancel}>
                    Cancel
                  </button>
                )
              )}
              <button type="submit" className="signup-gate-submit" disabled={busy}>
                {busy ? "Sending..." : "Send code"}
              </button>
            </div>
          </form>
        ) : (
          <form className="auth-gate-form" onSubmit={handleConfirmCode}>
            {error && <p className="form-error">{error}</p>}
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              required
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <div className="auth-gate-actions">
              <button type="button" className="signup-gate-cancel" disabled={busy} onClick={() => setStep("phone")}>
                Back
              </button>
              {/* If the code never arrives (e.g. WhatsApp delivery fails),
                  "Back" alone left the client stuck re-sending into the same
                  void - this gives a direct way out from right here instead
                  of forcing a detour through the phone step first. */}
              {onSkip && (
                <button type="button" className="signup-gate-cancel" disabled={busy} onClick={handleSkip}>
                  {busy ? "Saving..." : "Verify later"}
                </button>
              )}
              <button type="submit" className="signup-gate-submit" disabled={busy}>
                {busy ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
