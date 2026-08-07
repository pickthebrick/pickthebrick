"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

// Small, always-on-top account widget - present on every page once signed
// in (rendered from the root layout), so there's always a way to jump back
// to your dashboard or sign out, regardless of which page/section you're on.
export default function AccountBar({ dashboardHref }: { dashboardHref: string }) {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await signOutAction();
    window.location.href = "/login";
  }

  return (
    <div className="account-bar">
      <Link href={dashboardHref} className="account-bar-btn" title="Go to my dashboard" aria-label="Go to my dashboard">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1" />
          <rect x="11" y="2.5" width="6.5" height="4.5" rx="1" />
          <rect x="11" y="9" width="6.5" height="8.5" rx="1" />
          <rect x="2.5" y="11" width="6.5" height="6.5" rx="1" />
        </svg>
      </Link>
      <button
        type="button"
        className="account-bar-btn"
        onClick={handleSignOut}
        disabled={busy}
        title="Sign out"
        aria-label="Sign out"
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 3H4.5a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 4.5 17H8" strokeLinecap="round" />
          <path d="M12.5 13.5 16.5 10l-4-3.5M16.5 10H7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
