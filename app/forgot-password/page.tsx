"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/passwordReset";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordResetAction(email);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--bg)]">
      <header className="flex items-center px-8 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" style={{ height: 40, width: "auto" }} />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm border border-[var(--line)] bg-[var(--surface)] p-8" style={{ borderRadius: "var(--radius)" }}>
          {sent ? (
            <>
              <p className="text-sm text-[var(--fg)]">
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. It expires in 1 hour.
              </p>
              <Link href="/login" className="mt-4 inline-block text-xs font-medium text-[var(--muted)] hover:text-[var(--fg)]">
                &larr; Back to sign in
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Enter your email and we&apos;ll send you a link to reset your password.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                  style={{ borderRadius: "var(--radius)" }}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-offset) var(--shadow-offset) 0 var(--fg)" }}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <Link href="/login" className="mt-4 inline-block text-xs font-medium text-[var(--muted)] hover:text-[var(--fg)]">
                &larr; Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
