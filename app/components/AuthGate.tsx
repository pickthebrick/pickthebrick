"use client";

import { useState } from "react";
import { signUp, signIn } from "@/app/actions/auth";

type Mode = "signup" | "signin";

// The single account gate for anonymous Build/Design visitors - used both to
// finish/submit a quote or design request and to unlock downloading/sharing
// it. Deliberately asks for nothing but an account (no separate phone/email
// capture step) - creating or signing into an account here re-parents
// whatever the visitor already built onto it (see reparentAnonymousSession in
// app/actions/auth.ts), so nothing in progress is lost either way.
export default function AuthGate({ context, onSuccess, onCancel }: { context?: string; onSuccess: () => void; onCancel?: () => void }) {
  const [mode, setMode] = useState<Mode>("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = mode === "signup" ? await signUp({ email, password, fullName }) : await signIn({ email, password });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSuccess();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-gate">
      {context && <div className="auth-gate-context">{context}</div>}
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
  );
}
