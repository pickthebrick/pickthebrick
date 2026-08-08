"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimAnonymousSession } from "@/app/actions/auth";

// Inline account-creation prompt for features that are intentionally
// account-only for anonymous Build/Design visitors (e.g. downloading or
// sharing the quote PDF) - unlike the phone/email contact capture at submit,
// which stays password-free by design. Creating the account here re-parents
// the visitor's current anonymous quote/design onto it (see
// claimAnonymousSession), so nothing already built is lost.
export default function SignupGate({ prompt }: { prompt: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      const result = await claimAnonymousSession({ email, password, fullName });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="signup-gate-trigger" onClick={() => setOpen(true)}>
        {prompt}
      </button>
    );
  }

  return (
    <form className="signup-gate-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <input
        type="text"
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password (min. 6 characters)"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="signup-gate-actions">
        <button type="button" className="signup-gate-cancel" disabled={busy} onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="signup-gate-submit" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </div>
    </form>
  );
}
