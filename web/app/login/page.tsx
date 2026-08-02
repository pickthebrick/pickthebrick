"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setInfo("Account created - check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FAFAF8] px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-[#E7E5E1] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#25272B]">PickTheBrick</h1>
        <p className="mt-1 mb-6 text-sm text-[#6E6E6E]">
          {mode === "signin" ? "Sign in to build your fitout quote." : "Create an account to get started."}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#25272B] py-2.5 text-sm font-semibold text-[#25272B] hover:bg-[#FAFAF8]"
        >
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs text-[#B4B0A8]">
          <div className="h-px flex-1 bg-[#E7E5E1]" />
          or
          <div className="h-px flex-1 bg-[#E7E5E1]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-lg border border-[#E7E5E1] px-3 py-2.5 text-sm outline-none focus:border-[#EF7F5B]"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[#E7E5E1] px-3 py-2.5 text-sm outline-none focus:border-[#EF7F5B]"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-[#E7E5E1] px-3 py-2.5 text-sm outline-none focus:border-[#EF7F5B]"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-[#2E7D4F]">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-[#25272B] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-[#6E6E6E] hover:text-[#25272B]"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
