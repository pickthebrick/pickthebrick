"use client";

import { useState } from "react";
import { signUp, signIn } from "@/app/actions/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = mode === "signup" ? await signUp({ email, password, fullName }) : await signIn({ email, password });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--bg)] px-4 py-16">
      <div className="w-full max-w-sm border border-[var(--line)] bg-[var(--surface)] p-8" style={{ borderRadius: "var(--radius)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="PickTheBrick" style={{ height: 44, width: "auto", marginBottom: 18 }} />
        <p className="mt-1 mb-6 text-sm text-[var(--muted)]">
          {mode === "signin" ? "Sign in to build your fitout quote." : "Create an account to get started."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderRadius: "var(--radius)" }}
            />
          )}
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
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-4 w-full text-center text-xs font-medium text-[var(--muted)] hover:text-[var(--fg)]"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
