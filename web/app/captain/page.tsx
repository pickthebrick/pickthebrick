"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import "../dashboard.css";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];
type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function CaptainPage() {
  const supabase = useMemo(() => createClient(), []);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contractors, setContractors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, QuoteItem[]>>({});
  const [chosenContractor, setChosenContractor] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: q }, { data: c }] = await Promise.all([
        supabase.from("quotes").select("*").eq("status", "submitted").order("submitted_at"),
        supabase.from("profiles").select("*").eq("role", "contractor"),
      ]);
      if (cancelled) return;
      setQuotes(q ?? []);
      setContractors(c ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function toggleExpand(quoteId: string) {
    if (expanded === quoteId) {
      setExpanded(null);
      return;
    }
    setExpanded(quoteId);
    if (!items[quoteId]) {
      const { data } = await supabase.from("quote_items").select("*").eq("quote_id", quoteId);
      setItems((prev) => ({ ...prev, [quoteId]: data ?? [] }));
    }
  }

  async function handleConfirm(quoteId: string) {
    const contractorId = chosenContractor[quoteId];
    if (!contractorId) {
      setError("Pick a contractor before confirming.");
      return;
    }
    setBusy(quoteId);
    setError(null);
    const { error } = await supabase.rpc("captain_confirm", { p_quote_id: quoteId, p_contractor_id: contractorId });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="ptb-dash">
      <header>
        <div className="brand">PickTheBrick &middot; Captain</div>
        <button className="signout" onClick={handleSignOut}>
          Sign out
        </button>
      </header>
      <main>
        <h1>Submitted quotes</h1>
        <p className="sub">Confirm a quote and assign a contractor to move it forward.</p>
        {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : quotes.length === 0 ? (
          <div className="empty">Nothing waiting on you right now.</div>
        ) : (
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
                      {q.submitted_at ? new Date(q.submitted_at).toLocaleString() : "-"}
                      <div>
                        <button
                          className="signout"
                          style={{ fontSize: 11, color: "var(--grey)" }}
                          onClick={() => toggleExpand(q.id)}
                        >
                          {expanded === q.id ? "Hide items" : "View items"}
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>AED {Number(q.grand_total).toLocaleString()}</td>
                    <td>
                      <select
                        value={chosenContractor[q.id] ?? ""}
                        onChange={(e) => setChosenContractor((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        {contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name ?? c.id}
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
                      <td colSpan={4} style={{ background: "var(--panel)" }}>
                        {(items[q.id] ?? []).map((it) => (
                          <div key={it.id} style={{ fontSize: 12, padding: "4px 0" }}>
                            {it.name} &middot; {it.category_label} &middot; {it.qty} {it.unit === "count" ? "pcs" : "sqm"}
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
