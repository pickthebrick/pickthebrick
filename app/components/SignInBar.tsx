"use client";

import Link from "next/link";

// Anonymous-visitor counterpart to AccountBar.tsx (which only renders once
// signed in) - same fixed top-right pill, so a visitor building a quote or
// starting a design without an account still has an obvious, on-theme way
// to sign in rather than hunting for it. Mounted directly in BuildClient.tsx
// and DesignPageClient.tsx (gated on isAnonymous) rather than the root
// layout, since it's only relevant on those two entry flows.
export default function SignInBar() {
  return (
    <div className="account-bar">
      <Link href="/login" className="account-bar-btn" title="Sign in" aria-label="Sign in">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 3H4.5a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 4.5 17H8" strokeLinecap="round" />
          <path d="M12.5 6.5 8.5 10l4 3.5M8.5 10H16.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}
