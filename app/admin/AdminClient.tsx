"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveQuote, markQuotePaid } from "@/app/actions/quotes";
import { resolvePaymentClaim } from "@/app/actions/progress";
import AdminPanel from "./AdminPanel";

type Quote = {
  id: string;
  confirmedAt: Date | null;
  approvedAt: Date | null;
  grandTotal: number;
};

type PaymentClaim = {
  id: string;
  quoteId: string;
  requestedPercent: number;
  requestedAmount: number;
  status: string;
  requestedAt: Date;
  quote: { timelineItems: { contractor: { fullName: string | null; email: string } | null }[] };
};

export default function AdminClient({
  toApprove,
  toPay,
  paymentClaims,
}: {
  toApprove: Quote[];
  toPay: Quote[];
  paymentClaims: PaymentClaim[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <AdminPanel title="Awaiting approval" count={toApprove.length}>
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
                  <button className="action" disabled={busy === q.id} onClick={() => run(q.id, () => approveQuote(q.id))}>
                    {busy === q.id ? "Approving..." : "Approve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </AdminPanel>

      <AdminPanel title="Awaiting payment" count={toPay.length}>
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
                  <button className="action" disabled={busy === q.id} onClick={() => run(q.id, () => markQuotePaid(q.id))}>
                    {busy === q.id ? "Marking..." : "Mark paid"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </AdminPanel>

      <AdminPanel title="Payment claims" count={paymentClaims.length}>
      <p className="sub">Contractor payment claims against approved progress.</p>
      {paymentClaims.length === 0 ? (
        <div className="empty">No open payment claims.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Requested</th>
              <th>Contractor</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paymentClaims.map((c) => (
              <tr key={c.id}>
                <td>{new Date(c.requestedAt).toLocaleDateString()}</td>
                <td>
                  {c.quote.timelineItems.length === 0
                    ? "-"
                    : c.quote.timelineItems.map((ti) => ti.contractor?.fullName ?? ti.contractor?.email).join(", ")}
                </td>
                <td style={{ textAlign: "right" }}>
                  AED {c.requestedAmount.toLocaleString()} ({c.requestedPercent}%)
                </td>
                <td>
                  <span className={`status-badge ${c.status}`}>{c.status}</span>
                </td>
                <td>
                  {c.status === "pending" ? (
                    <button
                      className="action"
                      disabled={busy === c.id}
                      onClick={() => run(c.id, () => resolvePaymentClaim(c.id, "approved"))}
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      className="action"
                      disabled={busy === c.id}
                      onClick={() => run(c.id, () => resolvePaymentClaim(c.id, "paid"))}
                    >
                      Mark paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </AdminPanel>
    </>
  );
}
