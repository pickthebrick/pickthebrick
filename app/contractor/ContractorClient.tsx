"use client";

import { Fragment, useState } from "react";
import type { QuoteStatus } from "@/app/generated/prisma/enums";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  captain_confirmed: "Confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

type QuoteItem = { id: string; name: string; categoryLabel: string; qty: number; unit: string };
type Quote = {
  id: string;
  status: QuoteStatus;
  confirmedAt: Date | null;
  grandTotal: number;
  items: QuoteItem[];
};

export default function ContractorClient({ quotes }: { quotes: Quote[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (quotes.length === 0) {
    return <div className="empty">Nothing assigned to you yet.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Assigned</th>
          <th>Status</th>
          <th style={{ textAlign: "right" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {quotes.map((q) => (
          <Fragment key={q.id}>
            <tr>
              <td>
                {q.confirmedAt ? new Date(q.confirmedAt).toLocaleString() : "-"}
                <div>
                  <button
                    className="signout"
                    style={{ fontSize: 11, color: "var(--muted)" }}
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                  >
                    {expanded === q.id ? "Hide items" : "View items"}
                  </button>
                </div>
              </td>
              <td>
                <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
              </td>
              <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
            </tr>
            {expanded === q.id && (
              <tr>
                <td colSpan={3} style={{ background: "var(--bg)" }}>
                  {q.items.map((it) => (
                    <div key={it.id} style={{ fontSize: 12, padding: "4px 0" }}>
                      {it.name} &middot; {it.categoryLabel} &middot; {it.qty}{" "}
                      {it.unit === "count" ? "Nos" : it.unit === "lm" ? "lm" : "sqm"}
                    </div>
                  ))}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
