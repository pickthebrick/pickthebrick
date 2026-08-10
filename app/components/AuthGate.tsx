"use client";

import { useEffect, useState } from "react";
import { signUp, signIn } from "@/app/actions/auth";

type Mode = "signup" | "signin";

// The single account gate for anonymous Build/Design visitors - used both to
// finish/submit a quote or design request and to unlock downloading/sharing
// it. Creating an account here re-parents whatever the visitor already built
// onto it (see reparentAnonymousSession in app/actions/auth.ts), so nothing
// in progress is lost either way.
//
// This component does NOT own the post-signup phone-verify step - it used to
// (an internal awaitingPhoneVerify branch nesting PhoneVerifyStep inside
// here), but signUp()/signIn() set the session cookie, and per this repo's
// Next.js version, mutating a cookie in a Server Action auto-refreshes the
// calling route's server-rendered props in the SAME response (see
// node_modules/next/dist/docs/01-app/02-guides/server-actions.md - "Setting
// or deleting a cookie automatically re-renders the current page"). That
// means a parent's `isAnonymous` prop can flip to false the instant signUp()
// resolves - before this component's own JS continuation even runs - so any
// state nested inside THIS component (like a phone step shown only once
// isAnonymous goes false) can get unmounted from the outside mid-step. The
// justSignedUp flag lets callers (BuildClient.tsx/FeaturesWizard.tsx) drive
// their own post-signup phone step from state they own, immune to that prop
// race.
export default function AuthGate({
  context,
  onSuccess,
  onCancel,
}: {
  context?: string;
  onSuccess: (justSignedUp: boolean) => void;
  onCancel?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!onCancel) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel!();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const result = mode === "signup" ? await signUp({ email, password, fullName }) : await signIn({ email, password });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSuccess(mode === "signup");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="auth-gate-overlay"
      onClick={onCancel ? (e) => e.target === e.currentTarget && onCancel() : undefined}
    >
      <div className="auth-gate">
        {context && <div className="auth-gate-context">{context}</div>}
        <a
          href={`/api/auth/google?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")}`}
          className="auth-gate-google"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3c-7.5 0-14 4.2-17.7 10.4z" />
            <path fill="#4CAF50" d="M24 45c5.4 0 10.3-2.1 14-5.5l-6.5-5.4c-2 1.4-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.9 40.7 16.4 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.5 5.4C41.5 36 45 30.6 45 24c0-1.4-.1-2.7-.4-3.5z" />
          </svg>
          Continue with Google
        </a>
        <div className="auth-gate-divider">or</div>
        <div className="auth-gate-toggle">
          <button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>
            Create account
          </button>
          <button type="button" className={mode === "signin" ? "selected" : ""} onClick={() => setMode("signin")}>
            Sign in
          </button>
        </div>
        <form className="auth-gate-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}
          {mode === "signup" && (
            <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          )}
          <input type="email" placeholder="Email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            placeholder={mode === "signup" ? "Password (min. 6 characters)" : "Password"}
            required
            minLength={mode === "signup" ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}
          <div className="auth-gate-actions">
            {onCancel && (
              <button type="button" className="signup-gate-cancel" disabled={busy} onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="signup-gate-submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
