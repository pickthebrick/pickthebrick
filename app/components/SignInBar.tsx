"use client";

import Link from "next/link";

// Anonymous-visitor counterpart to AccountBar.tsx (which only renders once
// signed in) - same fixed top-right position, so a visitor building a quote
// or starting a design without an account still has an obvious, on-theme way
// to sign in rather than hunting for it. Mounted directly in BuildClient.tsx
// and DesignPageClient.tsx (gated on isAnonymous) rather than the root
// layout, since it's only relevant on those two entry flows.
//
// Deliberately a labelled pill, not an icon-only button like AccountBar's -
// an icon-only "sign in" arrow and AccountBar's icon-only "sign out" arrow
// read as the same control at a glance, which is exactly the mix-up clients
// reported ("the login button is too confusing, it looks like logout").
export default function SignInBar() {
  return (
    <div className="signin-bar">
      <Link href="/login" className="signin-bar-btn" title="Sign in to your account" aria-label="Sign in to your account">
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="6.7" r="3.2" />
          <path d="M3.5 17c.9-3.4 3.7-5.2 6.5-5.2s5.6 1.8 6.5 5.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sign in
      </Link>
    </div>
  );
}
