"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveQuote, markQuotePaid } from "@/app/actions/quotes";

type Quote = {
  id: string;
  confirmedAt: Date | null;
  approvedAt: Date | null;
  grandTotal: number;
};

export default function AdminClient({ toApprove, toPay }: { toApprove: Quote[]; toPay: Quote[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(quoteId: string) {
    setBusy(quoteId);
    setError(null);
    try {
      await approveQuote(quoteId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not approve quote");
    } finally {
      setBusy(null);
    }
  }

  async function handleMarkPaid(quoteId: string) {
    setBusy(quoteId);
    setError(null);
    try {
      await markQuotePaid(quoteId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark quote as paid");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <h1>Awaiting approval</h1>
      <p className="sub">Captain-confirmed quotes, ready for final approval.</p>
      {toApprove.length === 0 ? (
        <div className="empty">Nothing waiting on approval.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Confirmed</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {toApprove.map((q) => (
              <tr key={q.id}>
                <td>{q.confirmedAt ? new Date(q.confirmedAt).toLocaleString() : "-"}</td>
                <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
                <td>
                  <button className="action" disabled={busy === q.id} onClick={() => handleApprove(q.id)}>
                    {busy === q.id ? "Approving..." : "Approve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h1>Awaiting payment</h1>
      <p className="sub">Approved quotes - mark paid once payment is handled offline.</p>
      {toPay.length === 0 ? (
        <div className="empty">Nothing waiting on payment.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Approved</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {toPay.map((q) => (
              <tr key={q.id}>
                <td>{q.approvedAt ? new Date(q.approvedAt).toLocaleString() : "-"}</td>
                <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
                <td>
                  <button className="action" disabled={busy === q.id} onClick={() => handleMarkPaid(q.id)}>
                    {busy === q.id ? "Marking..." : "Mark paid"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
