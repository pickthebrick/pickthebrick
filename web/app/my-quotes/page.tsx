"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database, QuoteStatus } from "@/lib/database.types";
import "../dashboard.css";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  captain_confirmed: "Captain confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

export default function MyQuotesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quotes")
        .select("*")
        .neq("status", "draft")
        .order("created_at", { ascending: false });
      setQuotes(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="ptb-dash">
      <header>
        <div className="brand">PickTheBrick</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/build" style={{ fontSize: 13, fontWeight: 600 }}>
            Build a quote
          </a>
          <button className="signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main>
        <h1>My quotes</h1>
        <p className="sub">Quotes you&apos;ve submitted and their current status.</p>

        {loading ? (
          <p>Loading...</p>
        ) : quotes.length === 0 ? (
          <div className="empty">No submitted quotes yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>{q.submitted_at ? new Date(q.submitted_at).toLocaleDateString() : "-"}</td>
                  <td>
                    <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>AED {Number(q.grand_total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
