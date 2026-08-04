"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmQuote } from "@/app/actions/quotes";

type QuoteItem = {
  id: string;
  name: string;
  categoryLabel: string;
  qty: number;
  unit: string;
};

type Quote = {
  id: string;
  submittedAt: Date | null;
  grandTotal: number;
  items: QuoteItem[];
};

type Contractor = { id: string; fullName: string | null };

export default function CaptainClient({ quotes, contractors }: { quotes: Quote[]; contractors: Contractor[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chosenContractor, setChosenContractor] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(quoteId: string) {
    const contractorId = chosenContractor[quoteId];
    if (!contractorId) {
      setError("Pick a contractor before confirming.");
      return;
    }
    setBusy(quoteId);
    setError(null);
    try {
      await confirmQuote(quoteId, contractorId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not confirm quote");
    } finally {
      setBusy(null);
    }
  }

  if (quotes.length === 0) {
    return <div className="empty">Nothing waiting on you right now.</div>;
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Submitted</th>
            <th style={{ textAlign: "right" }}>Total</th>
            <th>Assign contractor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <Fragment key={q.id}>
              <tr>
                <td>
                  {q.submittedAt ? new Date(q.submittedAt).toLocaleString() : "-"}
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
                <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
                <td>
                  <select
                    value={chosenContractor[q.id] ?? ""}
                    onChange={(e) => setChosenContractor((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName ?? c.id}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="action" disabled={busy === q.id} onClick={() => handleConfirm(q.id)}>
                    {busy === q.id ? "Confirming..." : "Confirm"}
                  </button>
                </td>
              </tr>
              {expanded === q.id && (
                <tr>
                  <td colSpan={4} style={{ background: "var(--bg)" }}>
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
    </>
  );
}
