"use client";

import { useState } from "react";
import { buildQuotePdf } from "@/lib/quotePdf";
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
}: {
  items: { name: string; categoryLabel: string; rate: number; qty: number; unit: Unit }[];
  grandTotal: number;
  location: string | null;
  officeSize: string | null;
  referenceNumber: string | null;
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
        })),
        grandTotal,
        location,
        officeSize,
        referenceNumber,
      });
      doc.save(`PickTheBrick-Quotation-${referenceNumber?.replace(/\//g, "-") ?? "draft"}.pdf`);
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
