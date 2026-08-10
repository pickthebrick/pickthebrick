"use client";

import Link from "next/link";
import PhoneVerifyStep from "@/app/components/PhoneVerifyStep";

export default function VerifyPhoneClient({ dest }: { dest: string }) {
  function handleVerified() {
    window.location.href = dest;
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--bg)]" style={{ minHeight: "100vh" }}>
      <header className="flex items-center px-8 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" style={{ height: 40, width: "auto" }} />
        </Link>
      </header>
      {/* PhoneVerifyStep renders its own full-screen overlay - the phone
          number itself is mandatory to finish a brand-new Google signup,
          but onSkip lets them defer the OTP round trip to later. */}
      <PhoneVerifyStep onSuccess={handleVerified} onSkip={handleVerified} />
    </div>
  );
}
