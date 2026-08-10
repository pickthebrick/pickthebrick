"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { confirmPasswordResetAction } from "@/app/actions/passwordReset";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) {
      setError("This reset link is missing its token - request a new one.");
      return;
    }
    setLoading(true);
    try {
      const result = await confirmPasswordResetAction(token, password);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
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
          {!token ? (
            <p className="text-sm text-red-600">
              This reset link is invalid.{" "}
              <Link href="/forgot-password" className="underline">
                Request a new one
              </Link>
              .
            </p>
          ) : done ? (
            <>
              <p className="text-sm text-[var(--fg)]">Your password has been updated. You&apos;ve been signed out everywhere else for safety.</p>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Sign in &rarr;
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Choose a new password.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="password"
                  required
                  autoFocus
                  minLength={6}
                  placeholder="New password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                  style={{ borderRadius: "var(--radius)" }}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
