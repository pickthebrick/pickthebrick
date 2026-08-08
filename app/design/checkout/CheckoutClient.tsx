"use client";

import { useState } from "react";
import Link from "next/link";
import { recordDesignPaymentMethod } from "@/app/actions/design";
import "../../marketing.css";

type Method = "card" | "apple_pay" | "google_pay" | "cash" | "pay_later";

const METHODS: { key: Exclude<Method, "pay_later">; label: string; icon: string }[] = [
  { key: "card", label: "Credit / Debit Card", icon: "💳" },
  { key: "apple_pay", label: "Apple Pay", icon: "" },
  { key: "google_pay", label: "Google Pay", icon: "G" },
  { key: "cash", label: "Cash", icon: "💵" },
];

export default function CheckoutClient({
  designRequestId,
  packageLabel,
  packagePrice,
  siteVisitRequested,
  siteVisitFee,
  initialMethod,
  isAnonymous = false,
}: {
  designRequestId: string;
  packageLabel: string;
  packagePrice: number;
  siteVisitRequested: boolean;
  siteVisitFee: number;
  initialMethod: string | null;
  isAnonymous?: boolean;
}) {
  const [busy, setBusy] = useState<Method | null>(null);
  const [confirmedMethod, setConfirmedMethod] = useState<string | null>(initialMethod);
  const [error, setError] = useState<string | null>(null);

  const total = packagePrice + siteVisitFee;

  async function choose(method: Method) {
    setBusy(method);
    setError(null);
    try {
      await recordDesignPaymentMethod(designRequestId, method);
      setConfirmedMethod(method);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record payment method");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
      </header>
      <main>
        <div className="hero">
          <span className="hero-eyebrow">Payment</span>
          <h1>Complete your order</h1>
          <p>Choose how you&apos;d like to pay - we won&apos;t charge anything until it&apos;s confirmed.</p>
        </div>

        <div className="sqft-input-card" style={{ maxWidth: 440 }}>
          <div className="checkout-summary-row">
            <span>{packageLabel} package</span>
            <span>AED {packagePrice.toLocaleString()}</span>
          </div>
          {siteVisitRequested && (
            <div className="checkout-summary-row">
              <span>Site visit</span>
              <span>AED {siteVisitFee.toLocaleString()}</span>
            </div>
          )}
          <div className="checkout-summary-row total">
            <span>Total</span>
            <span>AED {total.toLocaleString()}</span>
          </div>

          {confirmedMethod ? (
            <div className="checkout-confirmed">
              <p style={{ marginBottom: 4 }}>
                <b>Payment method recorded:</b>{" "}
                {confirmedMethod === "pay_later"
                  ? "Pay later"
                  : (METHODS.find((m) => m.key === confirmedMethod)?.label ?? confirmedMethod)}
              </p>
              <p className="sub" style={{ marginBottom: 16 }}>
                {confirmedMethod === "cash" || confirmedMethod === "pay_later"
                  ? "Our team will follow up to collect payment."
                  : "This is a prototype - no real charge has been made."}
              </p>
              <Link
                href={isAnonymous ? "/" : "/my-quotes"}
                className="design-start-btn"
                style={{ display: "block", width: "100%", textAlign: "center", textDecoration: "none" }}
              >
                {isAnonymous ? "Back to home →" : "Go to my dashboard →"}
              </Link>
            </div>
          ) : (
            <>
              <div className="checkout-method-grid">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className="checkout-method-btn"
                    disabled={busy !== null}
                    onClick={() => choose(m.key)}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
              <button type="button" className="checkout-pay-later" disabled={busy !== null} onClick={() => choose("pay_later")}>
                {busy === "pay_later" ? "Saving…" : "Pay later"}
              </button>
              {error && <p className="sqft-hint">{error}</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
