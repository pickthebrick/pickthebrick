"use client";

import { useState } from "react";
import { buildQuotePdf } from "@/lib/quotePdf";
import { type PaymentPlanType, computePaymentPlan } from "@/lib/paymentPlan";
import type { Unit } from "@/app/generated/prisma/enums";

function baseUnitLabel(unit: Unit) {
  if (unit === "count") return "Nos";
  if (unit === "lm") return "lm";
  return "sqm";
}

export default function PdfDownloadButton({
  items,
  grandTotal,
  location,
  officeSize,
  referenceNumber,
  clientName,
  brandLogoUrl,
  brandCompanyName,
  paymentPlanType,
  progressPercent,
  onDownloaded,
}: {
  items: {
    name: string;
    categoryLabel: string;
    rate: number;
    qty: number;
    unit: Unit;
    productId?: string | null;
    product?: { images: { path: string }[] } | null;
  }[];
  grandTotal: number;
  location: string | null;
  officeSize: string | null;
  referenceNumber: string | null;
  clientName?: string | null;
  // Contractor-only - see buildQuotePdf's matching params in lib/quotePdf.ts.
  brandLogoUrl?: string | null;
  brandCompanyName?: string | null;
  // The client's confirmed plan (see confirmPaymentPlan in
  // app/actions/quotes.ts) - null for a quote with no plan chosen, or a
  // contractor/captain download which never sets one. Recomputed into a full
  // schedule at download time (via lib/paymentPlan.ts) rather than passed
  // pre-computed, so it always reflects live progress.
  paymentPlanType?: PaymentPlanType | null;
  // Current project progress (0-100) - drives the early-completion "balance
  // due now" collapse inside computePaymentPlan. Defaults to 0 (no project
  // yet / not tracked here) for callers that don't pass it.
  progressPercent?: number;
  // Contractor-only - fires after a successful download so the caller can
  // mark the quote completed (see contractorMarkQuoteCompleted in
  // app/actions/quotes.ts). Not used by the plain client my-quotes list.
  onDownloaded?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const doc = await buildQuotePdf({
        items: items.map((i) => ({
          name: i.name,
          categoryLabel: i.categoryLabel,
          rate: i.rate,
          qty: i.qty,
          unitLabel: baseUnitLabel(i.unit),
          imageUrl: i.product?.images[0]?.path,
          productId: i.productId,
        })),
        grandTotal,
        location,
        officeSize,
        referenceNumber,
        clientName,
        brandLogoUrl,
        brandCompanyName,
        paymentPlan: paymentPlanType ? computePaymentPlan(grandTotal, paymentPlanType, progressPercent ?? 0) : null,
      });
      doc.save(
        brandLogoUrl
          ? `Quotation-${referenceNumber?.replace(/\//g, "-") ?? "draft"}.pdf`
          : `PickTheBrick-Quotation-${referenceNumber?.replace(/\//g, "-") ?? "draft"}.pdf`,
      );
      onDownloaded?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="pdf-download-btn" disabled={busy} onClick={handleDownload} title="Download PDF">
      {busy ? "..." : "PDF"}
    </button>
  );
}
