"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp, signIn } from "@/app/actions/auth";
import PhoneVerifyStep from "@/app/components/PhoneVerifyStep";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  // Read reactively via useSearchParams (not window.location in a useState
  // initializer) - a Next.js <Link> soft navigation to this same route with
  // different search params doesn't remount this component, so a one-time
  // window.location read misses the new ?role= and silently falls back to
  // the plain sign-in form (see app/components/SiteFooter.tsx's "Become a
  // contractor"/"Become a designer" links, which are exactly this case).
  const partnerRole = roleParam === "contractor" || roleParam === "designer" ? roleParam : null;
  const [mode, setMode] = useState<"signin" | "signup">(partnerRole ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // A brand-new account isn't done signing up until its WhatsApp number is
  // verified - shown right after signUp() succeeds, before redirecting
  // anywhere. Signing into an existing account skips this (existing accounts
  // without a verified number still get asked once at first quote/design
  // submission - see BuildClient.tsx/FeaturesWizard.tsx).
  const [awaitingPhoneVerify, setAwaitingPhoneVerify] = useState(false);
  // Google is the headline option; the email/password form collapses behind
  // this toggle so the default view asks for nothing but one click. Opens
  // pre-expanded for a partner-role signup, since Google can't carry the
  // contractor/designer role param through the OAuth round trip.
  const [showEmailForm, setShowEmailForm] = useState(!!partnerRole);
  const googleError = searchParams.get("error") === "google_auth_failed";
  const nextParam = searchParams.get("next");
  const googleHref = `/api/auth/google${nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? `?next=${encodeURIComponent(nextParam)}` : ""}`;

  function redirectAfterAuth() {
    const next = searchParams.get("next");
    // Falls back to /my-quotes (not "/") when there's no explicit next -
    // that's where a resumable draft design/quote now shows up (see
    // draftDesignRequests in MyQuotesClient.tsx), and it already bounces
    // non-client roles to their own dashboard, so it's a safe default
    // regardless of who just signed in.
    window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/my-quotes";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUp({
          email,
          password,
          fullName,
          company: partnerRole ? undefined : company,
          role: partnerRole ?? undefined,
        });
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setAwaitingPhoneVerify(true);
        return;
      }
      // Signing in through the public form - see signIn()'s
      // isPendingApplicant handling for why a not-yet-approved
      // contractor/designer still lands on their own apply page.
      const result = await signIn({ email, password, viaStaffLogin: false });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      redirectAfterAuth();
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
        {awaitingPhoneVerify ? (
          <PhoneVerifyStep onSuccess={redirectAfterAuth} onSkip={redirectAfterAuth} />
        ) : (
        <>
        <p className="mt-1 mb-6 text-sm text-[var(--muted)]">
          {mode === "signin"
            ? "Sign in to build your fitout quote."
            : partnerRole === "contractor"
              ? "Create a contractor account to apply to partner with us."
              : partnerRole === "designer"
                ? "Create a designer account to apply to partner with us."
                : "Create an account to get started."}
        </p>

        {googleError && <p className="mb-3 text-sm text-red-600">Google sign-in failed - please try again, or use email below.</p>}

        <a
          href={googleHref}
          className="flex items-center justify-center gap-2 border border-[var(--line)] py-2.5 text-sm font-semibold hover:bg-[var(--bg)]"
          style={{ borderRadius: "var(--radius)" }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3c-7.5 0-14 4.2-17.7 10.4z" />
            <path fill="#4CAF50" d="M24 45c5.4 0 10.3-2.1 14-5.5l-6.5-5.4c-2 1.4-4.6 2.4-7.5 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.9 40.7 16.4 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.5 5.4C41.5 36 45 30.6 45 24c0-1.4-.1-2.7-.4-3.5z" />
          </svg>
          Continue with Google
        </a>

        {!partnerRole && (
          <button
            type="button"
            onClick={() => setShowEmailForm((s) => !s)}
            className="mt-3 w-full text-center text-xs font-medium text-[var(--muted)] hover:text-[var(--fg)]"
          >
            {showEmailForm ? "Hide email options" : "or continue with email"}
          </button>
        )}

        {showEmailForm && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
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
          {mode === "signup" && !partnerRole && (
            <input
              type="text"
              placeholder="Company name (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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
            placeholder={mode === "signup" ? "Password (min. 6 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderRadius: "var(--radius)" }}
          />
          {mode === "signup" && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderRadius: "var(--radius)" }}
            />
          )}

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
        )}

        {showEmailForm && (
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
        )}
        </>
        )}
        </div>
      </div>
    </div>
  );
}
