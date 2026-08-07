"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/app/actions/auth";

// Not linked from any client-facing page - staff (admin/captain/designer/
// contractor/marketing) accounts are provisioned by an admin, not self-
// registered, so this is sign-in only, no signup toggle.
export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn({ email, password, viaStaffLogin: true });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.href = "/";
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
        <p className="mt-1 mb-6 text-sm text-[var(--muted)]">Staff sign in.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderRadius: "var(--radius)" }}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Please wait..." : "Sign in"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
