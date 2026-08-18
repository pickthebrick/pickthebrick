"use client";

import { useState } from "react";
import {
  type PaymentPlanType,
  computePaymentPlan,
  isWeeklyEligible,
  EARLY_COMPLETION_CLAUSE,
  PAYMENT_TERMS_DISCLAIMER,
} from "@/lib/paymentPlan";

// Gated behind the "Choose payment plan" button (not shown inline) so the
// client isn't handed another on-page choice before they've even finished
// reviewing their quote - see BuildClient.tsx.
export default function PaymentPlanModal({
  grandTotal,
  initialType,
  onConfirm,
  onClose,
}: {
  grandTotal: number;
  // Pre-selects the already-confirmed plan when reopened to change it -
  // null the first time through.
  initialType: PaymentPlanType | null;
  onConfirm: (type: PaymentPlanType) => Promise<void>;
  onClose: () => void;
}) {
  const weeklyEligible = isWeeklyEligible(grandTotal);
  const [type, setType] = useState<PaymentPlanType>(initialType ?? (weeklyEligible ? "weekly" : "monthly"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schedule = computePaymentPlan(grandTotal, type);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your payment plan - try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title" style={{ marginBottom: 0 }}>
            Choose your payment plan
          </div>
          <div className="modal-close" onClick={onClose}>
            &times;
          </div>
        </div>
        <div className="modal-body">
          <div className="payment-plan-options">
            <div
              className={`payment-plan-option${type === "weekly" ? " selected" : ""}${!weeklyEligible ? " disabled" : ""}`}
              onClick={() => weeklyEligible && setType("weekly")}
            >
              <div className="payment-plan-option-head">
                <span>Weekly</span>
                <span className="payment-plan-option-pct">20% advance</span>
              </div>
              {weeklyEligible ? (
                <p>Remainder split into weekly installments over the estimated project duration.</p>
              ) : (
                <p>Available for projects AED 50,000 and above.</p>
              )}
            </div>
            <div
              className={`payment-plan-option${type === "monthly" ? " selected" : ""}`}
              onClick={() => setType("monthly")}
            >
              <div className="payment-plan-option-head">
                <span>Monthly</span>
                <span className="payment-plan-option-pct">50% advance</span>
              </div>
              <p>Remainder split into monthly installments over the estimated project duration.</p>
            </div>
          </div>

          <div className="payment-plan-preview">
            <div className="payment-plan-preview-row">
              <span>Due now ({Math.round(schedule.advancePct * 100)}% advance)</span>
              <b>AED {schedule.advanceAmount.toLocaleString()}</b>
            </div>
            <div className="payment-plan-preview-row">
              <span>
                Then {schedule.installmentCount} {type === "weekly" ? "weekly" : "monthly"} payment
                {schedule.installmentCount === 1 ? "" : "s"} of
              </span>
              <b>
                AED {(schedule.installments[0]?.amount ?? 0).toLocaleString()}
                {schedule.installments.length > 1 &&
                schedule.installments[schedule.installments.length - 1].amount !== schedule.installments[0].amount
                  ? "*"
                  : ""}
              </b>
            </div>
            <div className="payment-plan-preview-row muted">
              <span>Estimated project duration</span>
              <span>{schedule.weeks} week{schedule.weeks === 1 ? "" : "s"}</span>
            </div>
          </div>

          <p className="payment-plan-clause">{EARLY_COMPLETION_CLAUSE}</p>
          <p className="payment-plan-clause">{PAYMENT_TERMS_DISCLAIMER}</p>

          {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}

          <button type="button" className="modal-addbtn" style={{ marginTop: 6 }} disabled={busy} onClick={handleConfirm}>
            {busy ? "Saving..." : "Confirm payment plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
