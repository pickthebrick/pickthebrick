// Payment plan math for the Build checkout flow (app/build/BuildClient.tsx,
// app/build/PaymentPlanModal.tsx) - kept pure and total-in/schedule-out so
// it can be shared verbatim by a second, slider-driven tool elsewhere on the
// site later (Husain's request - same calculation, just a typed-in value
// instead of a real quote's grandTotal).

export type PaymentPlanType = "weekly" | "monthly";

export const WEEKLY_ADVANCE_PCT = 0.2;
export const MONTHLY_ADVANCE_PCT = 0.5;
export const WEEKLY_MIN_TOTAL = 50_000;

// AED grand-total tiers -> estimated project duration in weeks. Weeks (not
// calendar days) drive both the client-facing timeline estimate and the
// installment count directly - an earlier days-based approach caused
// inconsistent week/month math and was scrapped.
const DURATION_TIERS: { upTo: number; weeks: number }[] = [
  { upTo: 10_000, weeks: 1 },
  { upTo: 20_000, weeks: 2 },
  { upTo: 50_000, weeks: 4 },
  { upTo: 100_000, weeks: 7 },
  { upTo: 200_000, weeks: 9 },
  { upTo: 500_000, weeks: 11 },
  { upTo: 1_000_000, weeks: 15 },
];
// Above AED 1,000,000: confirmed with Husain to hold at 15 weeks rather than
// extrapolate a new formula - same duration as the 500k-1M tier.
const MAX_TIER_WEEKS = 15;

export function durationWeeks(grandTotal: number): number {
  for (const tier of DURATION_TIERS) if (grandTotal <= tier.upTo) return tier.weeks;
  return MAX_TIER_WEEKS;
}

export function isWeeklyEligible(grandTotal: number): boolean {
  return grandTotal >= WEEKLY_MIN_TOTAL;
}

export type PaymentInstallment = { number: number; amount: number };

export type PaymentPlanSchedule = {
  type: PaymentPlanType;
  weeks: number;
  advancePct: number;
  advanceAmount: number;
  // What's left after the advance - the same number whether or not progress
  // has reached 100%. `balanceDueNow` only changes how it's presented (owed
  // in full, immediately, vs. spread across `installments`) - there's no
  // persisted per-installment payment status to track partial collection
  // against, so this is a display concern, not a different total.
  remainingAmount: number;
  installmentCount: number;
  // Empty once balanceDueNow is true - nothing left to spread out.
  installments: PaymentInstallment[];
  balanceDueNow: boolean;
};

// Pure - grandTotal is whatever the caller passes (a real quote's total on
// the Review Quote page, or a manually typed value on the future standalone
// tool). progressPercent defaults to 0 (no early-completion override) for
// callers that don't track project progress at all.
export function computePaymentPlan(grandTotal: number, type: PaymentPlanType, progressPercent = 0): PaymentPlanSchedule {
  const weeks = durationWeeks(grandTotal);
  const advancePct = type === "weekly" ? WEEKLY_ADVANCE_PCT : MONTHLY_ADVANCE_PCT;
  const advanceAmount = Math.round(grandTotal * advancePct);
  const remainingAmount = grandTotal - advanceAmount;
  // Monthly installment count is always ceil(weeks / 4) - never round() and
  // never an independent days-based calculation. Rounding down independently
  // could make a 6-week project show as "1 month," implying the monthly plan
  // finishes faster than weekly for the identical job; rounding up from the
  // same shared `weeks` figure keeps the two plans consistent (monthly must
  // never imply a shorter timeline than weekly for the same job).
  const installmentCount = type === "weekly" ? weeks : Math.ceil(weeks / 4);
  const balanceDueNow = progressPercent >= 100;

  const installments: PaymentInstallment[] = [];
  if (!balanceDueNow) {
    // Even split with the last installment absorbing the rounding remainder,
    // so the installments always sum to exactly remainingAmount.
    const base = Math.floor(remainingAmount / installmentCount);
    let allocated = 0;
    for (let i = 1; i <= installmentCount; i++) {
      const amount = i === installmentCount ? remainingAmount - allocated : base;
      installments.push({ number: i, amount });
      allocated += amount;
    }
  }

  return { type, weeks, advancePct, advanceAmount, remainingAmount, installmentCount, installments, balanceDueNow };
}

export const EARLY_COMPLETION_CLAUSE =
  "If your project finishes ahead of schedule, any remaining balance becomes due in full at completion - the plan shortens with the project, it doesn't stretch it out.";

export const PAYMENT_TERMS_DISCLAIMER =
  "These payment terms are indicative and will be finalized once confirmed with your PickTheBrick Captain.";
