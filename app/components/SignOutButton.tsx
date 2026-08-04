"use client";

import { signOutAction } from "@/app/actions/auth";

export default function SignOutButton({ className }: { className?: string }) {
  async function handleClick() {
    await signOutAction();
    window.location.href = "/login";
  }

  return (
    <button onClick={handleClick} className={className}>
      Sign out
    </button>
  );
}
