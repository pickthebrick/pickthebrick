"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database, QuoteStatus } from "@/lib/database.types";
import "../dashboard.css";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];
type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"];

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  captain_confirmed: "Confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

export default function ContractorPage() {
  const supabase = useMemo(() => createClient(), []);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, QuoteItem[]>>({});

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("quotes")
        .select("*")
        .eq("contractor_id", user.id)
        .order("confirmed_at", { ascending: false });
      setQuotes(data ?? []);
      setLoading(false);
    })();
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="ptb-dash">
      <header>
        <div className="brand">PickTheBrick &middot; Contractor</div>
        <button className="signout" onClick={handleSignOut}>
          Sign out
        </button>
      </header>
      <main>
        <h1>My assigned jobs</h1>
        <p className="sub">Jobs a Captain has assigned to you (read-only for now).</p>

        {loading ? (
          <p>Loading...</p>
        ) : quotes.length === 0 ? (
          <div className="empty">Nothing assigned to you yet.</div>
        ) : (
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
                      {q.confirmed_at ? new Date(q.confirmed_at).toLocaleString() : "-"}
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
                    <td>
                      <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>AED {Number(q.grand_total).toLocaleString()}</td>
                  </tr>
                  {expanded === q.id && (
                    <tr>
                      <td colSpan={3} style={{ background: "var(--panel)" }}>
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
