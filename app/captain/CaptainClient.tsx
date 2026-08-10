"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuoteStatus } from "@/app/generated/prisma/enums";
import { respondToSiteInspection, createSiteInspection, recordSiteVisitNotes } from "@/app/actions/progress";
import { contactLabel } from "@/lib/contactLabel";
import GanttChart, { type TimelineItem } from "./GanttChart";
import AdminPanel from "@/app/admin/AdminPanel";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Created",
  captain_confirmed: "Confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

type Client = { fullName: string | null; email: string; phone: string | null; company: string | null };
type Contractor = { id: string; fullName: string | null; approvedCategoryIds: string[]; approvedTypeIds: string[] };
type TypeOption = { id: string; categoryId: string; label: string };
type CategoryOption = { id: string; label: string };

type Inspection = {
  id: string;
  status: string;
  note: string | null;
  preferredDate: Date | null;
  scheduledAt: Date | null;
  captainNote: string | null;
  visitNotes: string | null;
  visitNotesRecordedAt: Date | null;
  requestedAt: Date;
};

type Project = {
  id: string;
  status: QuoteStatus;
  confirmedAt: Date | null;
  grandTotal: number;
  referenceNumber: string | null;
  location: string | null;
  officeSize: string | null;
  client: Client | null;
  contactPhone: string | null;
  contactEmail: string | null;
  inspections: Inspection[];
  timelineItems: TimelineItem[];
};

function projectName(officeSize: string | null, location: string | null) {
  if (!officeSize && !location) return "Untitled project";
  return [officeSize, location].filter(Boolean).join(" · ");
}

function overallProgress(items: TimelineItem[]) {
  const assigned = items.filter((i) => i.status === "assigned");
  if (assigned.length === 0) return 0;
  const total = assigned.reduce((s, i) => s + (i.deliveryApproved * 0.4 + i.siteApproved * 0.6), 0);
  return Math.round(total / assigned.length);
}

export default function CaptainClient({
  activeProjects,
  contractors,
  types,
  categories,
}: {
  activeProjects: Project[];
  contractors: Contractor[];
  types: TypeOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(activeProjects[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectionDrafts, setInspectionDrafts] = useState<Record<string, { status: string; scheduledAt: string; note: string }>>({});
  const [newVisitDrafts, setNewVisitDrafts] = useState<Record<string, { scheduledAt: string; note: string }>>({});
  const [visitNotesDrafts, setVisitNotesDrafts] = useState<Record<string, string>>({});

  const selected = activeProjects.find((p) => p.id === selectedId) ?? null;

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

  function inspectionDraft(id: string) {
    return inspectionDrafts[id] ?? { status: "scheduled", scheduledAt: "", note: "" };
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <nav>
          {activeProjects.length === 0 && (
            <div className="sub" style={{ padding: "10px 24px" }}>
              No projects assigned yet.
            </div>
          )}
          {activeProjects.map((p) => (
            <button
              key={p.id}
              className={selectedId === p.id ? "active" : ""}
              onClick={() => setSelectedId(p.id)}
            >
              {contactLabel(p)}
              {p.client?.company && (
                <span style={{ display: "block", fontSize: 10.5, color: "var(--muted)", fontWeight: 400 }}>
                  {p.client.company}
                </span>
              )}
              <span style={{ display: "block", fontSize: 10.5, color: "var(--muted)", fontWeight: 400 }}>
                {projectName(p.officeSize, p.location)}
              </span>
            </button>
          ))}
          <Link href="/profile">Profile</Link>
        </nav>
      </aside>

      <main className="admin-main">
        {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

        {!selected ? (
          <div className="empty">Select a project from the list to see its details.</div>
        ) : (
          (() => {
            const p = selected;
            const paymentPercent = overallProgress(p.timelineItems);
            // "requested" and "scheduled" can still be acted on (accept/reschedule,
            // or move on to completed/cancelled); "completed"/"cancelled" are terminal.
            const openInspections = p.inspections.filter((i) => i.status === "requested" || i.status === "scheduled");
            return (
              <>
                <h1>{projectName(p.officeSize, p.location)}</h1>
                <p className="sub">
                  <span className={`status-badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>{" "}
                  {p.referenceNumber ?? "-"} &middot; {contactLabel(p)} &middot;{" "}
                  {p.client?.email ?? p.contactPhone ?? p.contactEmail ?? "No account"}
                  {p.client?.company ? ` · ${p.client.company}` : ""}
                  {p.client?.phone ? ` · ${p.client.phone}` : ""} &middot; Started{" "}
                  {p.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString() : "-"} &middot; AED{" "}
                  {p.grandTotal.toLocaleString()}
                  {p.status === "captain_confirmed" && (
                    <>
                      {" "}
                      &middot;{" "}
                      <a href={`/build?editQuote=${p.id}`} target="_blank" rel="noreferrer">
                        Edit client&apos;s quote
                      </a>
                    </>
                  )}
                </p>

                <AdminPanel title="Project timeline & contractor assignment">
                  <GanttChart quoteId={p.id} items={p.timelineItems} categories={categories} types={types} contractors={contractors} />
                </AdminPanel>

                <AdminPanel title="Payment eligibility">
                  <div className="payment-bar-rail">
                    <div className="payment-bar-fill" style={{ width: `${paymentPercent}%` }} />
                  </div>
                  <p className="sub">
                    {paymentPercent}% of AED {p.grandTotal.toLocaleString()} currently eligible for payment (averaged
                    across all assigned timeline items).
                  </p>
                </AdminPanel>

                <AdminPanel title="Site inspections">
                  <div className="edit-inline-form">
                    <input
                      type="date"
                      value={newVisitDrafts[p.id]?.scheduledAt ?? ""}
                      onChange={(e) =>
                        setNewVisitDrafts((prev) => ({
                          ...prev,
                          [p.id]: { scheduledAt: e.target.value, note: prev[p.id]?.note ?? "" },
                        }))
                      }
                    />
                    <input
                      type="text"
                      placeholder="Optional note"
                      value={newVisitDrafts[p.id]?.note ?? ""}
                      onChange={(e) =>
                        setNewVisitDrafts((prev) => ({
                          ...prev,
                          [p.id]: { scheduledAt: prev[p.id]?.scheduledAt ?? "", note: e.target.value },
                        }))
                      }
                    />
                    <button
                      className="action"
                      disabled={busy === `${p.id}-new-visit` || !newVisitDrafts[p.id]?.scheduledAt}
                      onClick={() =>
                        run(`${p.id}-new-visit`, async () => {
                          const draft = newVisitDrafts[p.id];
                          await createSiteInspection(p.id, draft.scheduledAt, draft.note);
                          setNewVisitDrafts((prev) => ({ ...prev, [p.id]: { scheduledAt: "", note: "" } }));
                        })
                      }
                    >
                      Schedule a site visit
                    </button>
                  </div>

                  {p.inspections.length > 0 && (
                    <ul className="edit-list">
                      {p.inspections.map((insp) => (
                        <li key={insp.id} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", width: "100%", gap: 8 }}>
                            {new Date(insp.requestedAt).toLocaleDateString()}
                            {insp.preferredDate && ` · Contractor requested ${new Date(insp.preferredDate).toLocaleDateString()}`}
                            {insp.note && ` · "${insp.note}"`}
                            <span className={`status-badge ${insp.status}`} style={{ marginLeft: "auto" }}>
                              {insp.status}
                            </span>
                          </div>
                          {insp.scheduledAt && insp.status !== "requested" && (
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>
                              Scheduled for {new Date(insp.scheduledAt).toLocaleDateString()}
                            </div>
                          )}
                          {openInspections.some((o) => o.id === insp.id) && (
                            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                              <select
                                value={inspectionDraft(insp.id).status}
                                onChange={(e) =>
                                  setInspectionDrafts((prev) => ({
                                    ...prev,
                                    [insp.id]: { ...inspectionDraft(insp.id), status: e.target.value },
                                  }))
                                }
                              >
                                <option value="scheduled">Schedule</option>
                                <option value="completed">Mark completed</option>
                                <option value="cancelled">Cancel</option>
                              </select>
                              <input
                                type="date"
                                title={insp.preferredDate ? "Feel free to pick a different date than requested" : undefined}
                                value={inspectionDraft(insp.id).scheduledAt}
                                onChange={(e) =>
                                  setInspectionDrafts((prev) => ({
                                    ...prev,
                                    [insp.id]: { ...inspectionDraft(insp.id), scheduledAt: e.target.value },
                                  }))
                                }
                              />
                              <input
                                type="text"
                                placeholder="Note"
                                value={inspectionDraft(insp.id).note}
                                onChange={(e) =>
                                  setInspectionDrafts((prev) => ({
                                    ...prev,
                                    [insp.id]: { ...inspectionDraft(insp.id), note: e.target.value },
                                  }))
                                }
                              />
                              <button
                                className="action"
                                disabled={busy === insp.id}
                                onClick={() =>
                                  run(insp.id, () =>
                                    respondToSiteInspection(insp.id, {
                                      status: inspectionDraft(insp.id).status as "scheduled" | "completed" | "cancelled",
                                      scheduledAt: inspectionDraft(insp.id).scheduledAt || undefined,
                                      captainNote: inspectionDraft(insp.id).note,
                                    }),
                                  )
                                }
                              >
                                Respond
                              </button>
                            </div>
                          )}
                          {insp.status === "completed" && !insp.visitNotesRecordedAt && (
                            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", width: "100%" }}>
                              <input
                                type="text"
                                placeholder="What did you find on site? (frozen once saved)"
                                style={{ flex: 1 }}
                                value={visitNotesDrafts[insp.id] ?? ""}
                                onChange={(e) => setVisitNotesDrafts((prev) => ({ ...prev, [insp.id]: e.target.value }))}
                              />
                              <button
                                className="action"
                                disabled={busy === `${insp.id}-visit-notes` || !(visitNotesDrafts[insp.id] ?? "").trim()}
                                onClick={() =>
                                  run(`${insp.id}-visit-notes`, async () => {
                                    await recordSiteVisitNotes(insp.id, visitNotesDrafts[insp.id]);
                                    setVisitNotesDrafts((prev) => ({ ...prev, [insp.id]: "" }));
                                  })
                                }
                              >
                                Log visit notes
                              </button>
                            </div>
                          )}
                          {insp.visitNotes && (
                            <div style={{ fontSize: 12, marginTop: 6 }}>
                              <b>Visit notes:</b> {insp.visitNotes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </AdminPanel>
              </>
            );
          })()
        )}
      </main>
    </div>
  );
}
