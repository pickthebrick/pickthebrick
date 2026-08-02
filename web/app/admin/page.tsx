"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import "../dashboard.css";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [toApprove, setToApprove] = useState<Quote[]>([]);
  const [toPay, setToPay] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: confirmed }, { data: approved }] = await Promise.all([
        supabase.from("quotes").select("*").eq("status", "captain_confirmed").order("confirmed_at"),
        supabase.from("quotes").select("*").eq("status", "admin_approved").order("approved_at"),
      ]);
      if (cancelled) return;
      setToApprove(confirmed ?? []);
      setToPay(approved ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleApprove(quoteId: string) {
    setBusy(quoteId);
    setError(null);
    const { error } = await supabase.rpc("admin_approve", { p_quote_id: quoteId });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setToApprove((prev) => {
      const moved = prev.find((q) => q.id === quoteId);
      if (moved) {
        setToPay((pay) => [...pay, { ...moved, status: "admin_approved", approved_at: new Date().toISOString() }]);
      }
      return prev.filter((q) => q.id !== quoteId);
    });
  }

  async function handleMarkPaid(quoteId: string) {
    setBusy(quoteId);
    setError(null);
    const { error } = await supabase.rpc("mark_paid", { p_quote_id: quoteId });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setToPay((prev) => prev.filter((q) => q.id !== quoteId));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="ptb-dash">
      <header>
        <div className="brand">PickTheBrick &middot; Admin</div>
        <button className="signout" onClick={handleSignOut}>
          Sign out
        </button>
      </header>
      <main>
        {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

        <h1>Awaiting approval</h1>
        <p className="sub">Captain-confirmed quotes, ready for final approval.</p>
        {loading ? (
          <p>Loading...</p>
        ) : toApprove.length === 0 ? (
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
                  <td>{q.confirmed_at ? new Date(q.confirmed_at).toLocaleString() : "-"}</td>
                  <td style={{ textAlign: "right" }}>AED {Number(q.grand_total).toLocaleString()}</td>
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
        {loading ? null : toPay.length === 0 ? (
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
                  <td>{q.approved_at ? new Date(q.approved_at).toLocaleString() : "-"}</td>
                  <td style={{ textAlign: "right" }}>AED {Number(q.grand_total).toLocaleString()}</td>
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
      </main>
    </div>
  );
}
