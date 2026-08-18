"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteStatus } from "@/app/generated/prisma/enums";
import { ProductThumb } from "@/app/build/ProductThumb";
import { contactLabel } from "@/lib/contactLabel";
import { adminDeleteQuote } from "@/app/actions/quotes";
import AdminPanel from "../AdminPanel";
import AssignCaptainCell from "./AssignCaptainCell";

function DeleteQuoteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button className="signout" style={{ fontSize: 11 }} onClick={() => setConfirming(true)}>
        Delete
      </button>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>Sure?</span>
      <button className="signout" style={{ fontSize: 11 }} disabled={busy} onClick={() => setConfirming(false)}>
        No
      </button>
      <button
        className="signout"
        style={{ fontSize: 11 }}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onConfirm();
        }}
      >
        {busy ? "..." : "Yes, delete"}
      </button>
    </span>
  );
}

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Created",
  captain_confirmed: "Captain confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

const STATUS_OPTIONS: QuoteStatus[] = ["submitted", "captain_confirmed", "admin_approved", "paid"];

type Captain = { id: string; fullName: string | null; email: string };
type QuoteItem = {
  id: string;
  productId: string | null;
  name: string;
  categoryLabel: string;
  typeLabel: string;
  subtypeLabel: string;
  rate: number;
  qty: number;
  unit: string;
  amount: number;
  product: { images: { path: string }[] } | null;
};
type Quote = {
  id: string;
  status: QuoteStatus;
  submittedAt: Date | null;
  location: string | null;
  officeSize: string | null;
  captainId: string | null;
  grandTotal: number;
  client: { fullName: string | null; email: string } | null;
  contactPhone: string | null;
  contactEmail: string | null;
  items: QuoteItem[];
  timelineItems: { contractor: { fullName: string | null; email: string } | null }[];
};

export default function QuotesClient({
  quotes,
  captains,
  isSuperAdmin,
}: {
  quotes: Quote[];
  captains: Captain[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      await adminDeleteQuote(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete quote");
    }
  }

  const filtered = useMemo(
    () =>
      quotes.filter((q) => {
        if (statusFilter !== "all" && q.status !== statusFilter) return false;
        if (search.trim()) {
          const s = search.trim().toLowerCase();
          const haystack = contactLabel(q).toLowerCase();
          if (!haystack.includes(s)) return false;
        }
        return true;
      }),
    [quotes, search, statusFilter],
  );

  return (
    <AdminPanel title="All quotes" count={filtered.length}>
      <div className="edit-inline-form" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search client name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | "all")}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="error">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty">No quotes match these filters.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Client</th>
              <th>Location</th>
              <th>Captain</th>
              <th>Contractor</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th></th>
              {isSuperAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((q) => (
              <Fragment key={q.id}>
                <tr>
                  <td>{q.submittedAt ? new Date(q.submittedAt).toLocaleString() : "-"}</td>
                  <td>
                    {contactLabel(q)}
                    <br />
                    <span className="sub" style={{ marginBottom: 0 }}>
                      {q.client?.email ?? q.contactPhone ?? q.contactEmail ?? "No account"}
                    </span>
                  </td>
                  <td>
                    {q.location ?? "-"}
                    {q.officeSize && <div className="sub" style={{ marginBottom: 0 }}>{q.officeSize}</div>}
                  </td>
                  <td>
                    <AssignCaptainCell quoteId={q.id} currentCaptainId={q.captainId} captains={captains} />
                  </td>
                  <td>
                    {q.timelineItems.length === 0
                      ? "-"
                      : q.timelineItems.map((ti) => ti.contractor?.fullName ?? ti.contractor?.email).join(", ")}
                  </td>
                  <td>
                    <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
                  <td>
                    <button className="signout" style={{ fontSize: 11 }} onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                      {expandedId === q.id ? "Hide items" : "View items"}
                    </button>
                  </td>
                  {isSuperAdmin && (
                    <td>
                      <DeleteQuoteButton onConfirm={() => handleDelete(q.id)} />
                    </td>
                  )}
                </tr>
                {expandedId === q.id && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 9 : 8} style={{ background: "var(--bg)" }}>
                      <table className="preview-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Spec</th>
                            <th style={{ textAlign: "right" }}>Qty</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.items.map((it) => (
                            <tr key={it.id}>
                              <td>
                                <div className="item-cell">
                                  <div className="item-thumb">
                                    <ProductThumb seed={it.productId ?? it.id} images={it.product?.images.map((i) => i.path)} />
                                  </div>
                                  <div>
                                    <b>{it.name}</b>
                                    <br />
                                    <span style={{ color: "var(--muted)", fontSize: 11 }}>{it.categoryLabel}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ color: "var(--muted)" }}>
                                {it.typeLabel} / {it.subtypeLabel}
                              </td>
                              <td className="num">
                                {it.qty} {it.unit === "count" ? "Nos" : it.unit === "lm" ? "lm" : "sqm"}
                              </td>
                              <td className="num">AED {it.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="preview-totals">
                        <div className="trow grand">
                          <span>Total</span>
                          <span className="amt">AED {q.grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </AdminPanel>
  );
}
