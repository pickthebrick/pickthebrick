"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuoteStatus, DesignRequestStatus, Unit } from "@/app/generated/prisma/enums";
import { deleteQuote, duplicateQuote } from "@/app/actions/quotes";
import { deleteDesignRequest, addDesignRequestRevisionComment } from "@/app/actions/design";
import { PACKAGE_LABELS, groupSpaceEntries } from "@/lib/spaces";
import PdfDownloadButton from "./PdfDownloadButton";
import StyleProfileSummary from "@/app/components/StyleProfileSummary";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Created",
  captain_confirmed: "Captain confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

const DESIGN_STATUS_LABEL: Record<DesignRequestStatus, string> = {
  draft: "Draft",
  submitted: "Created",
  in_progress: "In progress",
  delivered: "Delivered",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  card: "Credit card",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  cash: "Cash",
  pay_later: "Pay later",
};

type QuoteItem = {
  id: string;
  name: string;
  categoryLabel: string;
  rate: number;
  qty: number;
  unit: Unit;
  productId: string | null;
  product: { images: { path: string }[] } | null;
};
type ProjectContractorProgress = { deliveryApproved: number; siteApproved: number };
type Inspection = {
  id: string;
  status: string;
  note: string | null;
  scheduledAt: Date | null;
  captainNote: string | null;
  requestedAt: Date;
};
type PaymentClaim = { id: string; requestedPercent: number; requestedAmount: number; status: string; requestedAt: Date };
type Captain = { fullName: string | null; email: string; phone: string | null };

type Quote = {
  id: string;
  status: QuoteStatus;
  referenceNumber: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  location: string | null;
  officeSize: string | null;
  grandTotal: number;
  captain: Captain | null;
  items: QuoteItem[];
  timelineItems: ProjectContractorProgress[];
  inspections: Inspection[];
  paymentClaims: PaymentClaim[];
};

type RevisionComment = { id: string; authorRole: string; body: string; channel: string; createdAt: Date };

type DesignRequest = {
  id: string;
  status: DesignRequestStatus;
  packageKey: string;
  submittedAt: Date | null;
  packagePrice: number | null;
  siteVisitRequested: boolean;
  siteVisitFee: number;
  paymentMethod: string | null;
  paymentMethodSelectedAt: Date | null;
  files: { id: string; label: string; filePath: string; createdAt: Date }[];
  spaceEntries: Parameters<typeof groupSpaceEntries>[0];
  revisionComments: RevisionComment[];
};

const TABS = [
  { key: "quotes", label: "My quotes" },
  { key: "design", label: "My design" },
  { key: "projects", label: "My projects" },
  { key: "sites", label: "My sites" },
  { key: "payments", label: "My payments" },
  { key: "captain", label: "My captain" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function projectName(officeSize: string | null, location: string | null) {
  if (!officeSize && !location) return "Untitled project";
  return [officeSize, location].filter(Boolean).join(" · ");
}

function overallProgress(pcs: ProjectContractorProgress[]) {
  if (pcs.length === 0) return 0;
  const total = pcs.reduce((s, p) => s + (p.deliveryApproved * 0.4 + p.siteApproved * 0.6), 0);
  return Math.round(total / pcs.length);
}

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button className="action danger" onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>Sure?</span>
      <button className="action" disabled={busy} onClick={() => setConfirming(false)}>
        No
      </button>
      <button
        className="action danger"
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

export default function MyQuotesClient({
  quotes,
  designRequests,
  clientLabel,
  styleFinderResult,
}: {
  quotes: Quote[];
  designRequests: DesignRequest[];
  clientLabel: string | null;
  styleFinderResult: { topStyle: string | null; stats: { styleKey: string; shown: number; liked: number }[] } | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("quotes");
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentBusy, setCommentBusy] = useState<string | null>(null);

  async function handleAddComment(requestId: string) {
    const body = (commentDrafts[requestId] ?? "").trim();
    if (!body) return;
    setCommentBusy(requestId);
    try {
      await addDesignRequestRevisionComment(requestId, body, "text");
      setCommentDrafts((prev) => ({ ...prev, [requestId]: "" }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add comment");
    } finally {
      setCommentBusy(null);
    }
  }

  async function handleDeleteQuote(id: string) {
    try {
      await deleteQuote(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete quote");
    }
  }

  const [duplicating, setDuplicating] = useState<string | null>(null);
  async function handleDuplicateQuote(id: string) {
    setDuplicating(id);
    try {
      await duplicateQuote(id);
      router.push("/build");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not duplicate quote");
      setDuplicating(null);
    }
  }

  async function handleDeleteDesignRequest(id: string) {
    try {
      await deleteDesignRequest(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete design request");
    }
  }

  const submittedQuotes = quotes.filter((q) => q.status !== "draft");
  const submittedDesignRequests = designRequests.filter((r) => r.status !== "draft");
  // Not-yet-submitted requests, most recent first - surfaced with a Continue
  // link so a visitor bounced off the survey mid-way (session hiccup, stray
  // navigation) can always find and resume their answers instead of losing
  // them. startDesignRequest() resumes the same row rather than creating a
  // new one, so there's normally at most one of these per client.
  const draftDesignRequests = designRequests.filter((r) => r.status === "draft");
  const projectQuotes = quotes.filter((q) => q.status === "captain_confirmed" || q.status === "admin_approved" || q.status === "paid");
  const allInspections = quotes.flatMap((q) => q.inspections.map((i) => ({ ...i, quote: q })));
  const allPaymentClaims = quotes.flatMap((q) => q.paymentClaims.map((c) => ({ ...c, quote: q })));
  const paidMethodRequests = submittedDesignRequests.filter((r) => r.paymentMethod);
  const captainQuotes = quotes.filter((q) => q.captain);

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <div className="dash-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`dash-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
        <Link href="/profile" className="dash-tab">
          Profile
        </Link>
      </div>

      {tab === "quotes" && (
        <>
          {submittedQuotes.length === 0 ? (
            <div className="empty">No submitted quotes yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submittedQuotes.map((q) => (
                  <tr key={q.id}>
                    <td>{q.referenceNumber ?? "-"}</td>
                    <td>{q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : "-"}</td>
                    <td>
                      <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>AED {q.grandTotal.toLocaleString()}</td>
                    <td style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <PdfDownloadButton
                        items={q.items}
                        grandTotal={q.grandTotal}
                        location={q.location}
                        officeSize={q.officeSize}
                        referenceNumber={q.referenceNumber}
                        clientName={clientLabel}
                      />
                      <button
                        type="button"
                        className="action"
                        disabled={duplicating === q.id}
                        onClick={() => handleDuplicateQuote(q.id)}
                        title="Duplicate this quote as a new draft so you can add items you forgot"
                      >
                        {duplicating === q.id ? "..." : "Forgot to add something?"}
                      </button>
                      {q.status === "submitted" && <DeleteButton label="Delete" onConfirm={() => handleDeleteQuote(q.id)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "design" && (
        <>
          <div className="contractor-project-card" style={{ marginBottom: 20 }}>
            <div className="modal-section-label" style={{ marginTop: 0 }}>
              Style profile
            </div>
            {styleFinderResult ? (
              <>
                <StyleProfileSummary topStyle={styleFinderResult.topStyle} stats={styleFinderResult.stats} />
                <Link href="/design/style-finder" className="sf-restart" style={{ display: "inline-block" }}>
                  Retake the Style Finder
                </Link>
              </>
            ) : (
              <div className="edit-inline-form">
                <span className="sub" style={{ marginBottom: 0 }}>
                  Help your designer nail your style - a 2-minute swipe quiz.
                </span>
                <Link href="/design/style-finder" className="action" style={{ marginLeft: "auto" }}>
                  Take the Style Finder
                </Link>
              </div>
            )}
          </div>

          {draftDesignRequests.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {draftDesignRequests.map((r) => (
                <div key={r.id} className="contractor-project-card">
                  <div className="contractor-project-head">
                    <div>
                      <span className="status-badge draft">Draft - not submitted</span>
                      <span className="sub" style={{ marginBottom: 0, marginLeft: 10 }}>
                        {PACKAGE_LABELS[r.packageKey] ?? r.packageKey} package
                        {groupSpaceEntries(r.spaceEntries) ? ` · ${groupSpaceEntries(r.spaceEntries)}` : ""}
                      </span>
                    </div>
                    <DeleteButton label="Delete" onConfirm={() => handleDeleteDesignRequest(r.id)} />
                  </div>
                  <Link href={`/design/spaces?id=${r.id}`} className="action">
                    Continue this design →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {submittedDesignRequests.length === 0 ? (
            <div className="empty">No design requests yet.</div>
          ) : (
            submittedDesignRequests.map((r) => (
              <div key={r.id} className="contractor-project-card">
                <div className="contractor-project-head">
                  <div>
                    <span className={`status-badge ${r.status}`}>{DESIGN_STATUS_LABEL[r.status]}</span>
                    <span className="sub" style={{ marginBottom: 0, marginLeft: 10 }}>
                      {PACKAGE_LABELS[r.packageKey] ?? r.packageKey} package
                      {r.submittedAt && ` · Created ${new Date(r.submittedAt).toLocaleDateString()}`}
                    </span>
                  </div>
                  {(r.status === "draft" || r.status === "submitted") && (
                    <DeleteButton label="Delete" onConfirm={() => handleDeleteDesignRequest(r.id)} />
                  )}
                </div>
                <div className="sub">{groupSpaceEntries(r.spaceEntries) || "-"}</div>

                <div className="modal-section-label">Files</div>
                {r.files.length === 0 ? (
                  <div className="empty">No files uploaded yet.</div>
                ) : (
                  <ul className="edit-list">
                    {r.files.map((f) => (
                      <li key={f.id}>
                        <a href={f.filePath} target="_blank" rel="noopener noreferrer">
                          {f.label}
                        </a>
                        <span className="sub" style={{ marginBottom: 0, marginLeft: "auto" }}>
                          {new Date(f.createdAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {(r.status === "in_progress" || r.status === "delivered") && (
                  <>
                    <div className="modal-section-label">Revision feedback</div>
                    {r.revisionComments.length === 0 ? (
                      <div className="empty">
                        No feedback logged yet. Reviewed a submittal and want changes? Leave a note below - or ask for a
                        call, and your designer will log a summary here.
                      </div>
                    ) : (
                      <ul className="revision-comment-list">
                        {r.revisionComments.map((c) => (
                          <li key={c.id} className="revision-comment">
                            <span className={`status-badge ${c.authorRole}`}>{c.authorRole}</span>
                            {c.channel === "call" && (
                              <span className="sub" style={{ marginBottom: 0 }}>
                                (call summary)
                              </span>
                            )}
                            <span className="sub" style={{ marginBottom: 0, marginLeft: "auto" }}>
                              {new Date(c.createdAt).toLocaleString()}
                            </span>
                            <p style={{ margin: "4px 0 0", fontSize: 13 }}>{c.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {r.status === "in_progress" && (
                      <div className="edit-inline-form" style={{ flexWrap: "wrap" }}>
                        <textarea
                          value={commentDrafts[r.id] ?? ""}
                          onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="What would you like changed?"
                          rows={2}
                          style={{ flex: "1 1 100%" }}
                        />
                        <button
                          className="action"
                          disabled={commentBusy === r.id || !(commentDrafts[r.id] ?? "").trim()}
                          onClick={() => handleAddComment(r.id)}
                        >
                          {commentBusy === r.id ? "..." : "Send feedback"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </>
      )}

      {tab === "projects" && (
        <>
          {projectQuotes.length === 0 ? (
            <div className="empty">No confirmed projects yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {projectQuotes.map((q) => (
                  <tr key={q.id}>
                    <td>{q.referenceNumber ?? "-"}</td>
                    <td>{projectName(q.officeSize, q.location)}</td>
                    <td>{q.location ?? "-"}</td>
                    <td>
                      <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>
                    </td>
                    <td>{overallProgress(q.timelineItems)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "sites" && (
        <>
          {allInspections.length === 0 ? (
            <div className="empty">No site inspections requested yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Requested</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {allInspections.map((i) => (
                  <tr key={i.id}>
                    <td>{projectName(i.quote.officeSize, i.quote.location)}</td>
                    <td>{new Date(i.requestedAt).toLocaleDateString()}</td>
                    <td>{i.note ?? "-"}</td>
                    <td>
                      <span className={`status-badge ${i.status}`}>{i.status}</span>
                    </td>
                    <td>{i.scheduledAt ? new Date(i.scheduledAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "payments" && (
        <>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Design package payments</h2>
          {paidMethodRequests.length === 0 ? (
            <div className="empty">No payment method recorded yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Method</th>
                  <th>Selected</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {paidMethodRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{PACKAGE_LABELS[r.packageKey] ?? r.packageKey}</td>
                    <td>{PAYMENT_METHOD_LABEL[r.paymentMethod ?? ""] ?? r.paymentMethod}</td>
                    <td>{r.paymentMethodSelectedAt ? new Date(r.paymentMethodSelectedAt).toLocaleDateString() : "-"}</td>
                    <td style={{ textAlign: "right" }}>AED {((r.packagePrice ?? 0) + r.siteVisitFee).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Payment claims</h2>
          {allPaymentClaims.length === 0 ? (
            <div className="empty">No payment claims yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Requested</th>
                  <th>Percent</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allPaymentClaims.map((c) => (
                  <tr key={c.id}>
                    <td>{projectName(c.quote.officeSize, c.quote.location)}</td>
                    <td>{new Date(c.requestedAt).toLocaleDateString()}</td>
                    <td>{c.requestedPercent}%</td>
                    <td style={{ textAlign: "right" }}>AED {c.requestedAmount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${c.status}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "captain" && (
        <>
          {captainQuotes.length === 0 ? (
            <div className="empty">No captain assigned yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Captain</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {captainQuotes.map((q) => (
                  <tr key={q.id}>
                    <td>{projectName(q.officeSize, q.location)}</td>
                    <td>{q.captain?.fullName ?? "-"}</td>
                    <td>{q.captain?.email}</td>
                    <td>{q.captain?.phone ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}
