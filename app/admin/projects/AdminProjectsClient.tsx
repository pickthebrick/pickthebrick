"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteStatus } from "@/app/generated/prisma/enums";
import { respondToSiteInspection } from "@/app/actions/progress";
import GanttChart, { type TimelineItem } from "../../captain/GanttChart";
import AdminPanel from "../AdminPanel";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Created",
  captain_confirmed: "Confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

const STATUS_OPTIONS: QuoteStatus[] = ["captain_confirmed", "admin_approved", "paid"];

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
  client: { fullName: string | null; email: string };
  captain: { fullName: string | null; email: string } | null;
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

export default function AdminProjectsClient({
  projects,
  contractors,
  types,
  categories,
}: {
  projects: Project[];
  contractors: Contractor[];
  types: TypeOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectionDrafts, setInspectionDrafts] = useState<Record<string, { status: string; scheduledAt: string; note: string }>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");

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

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (search.trim()) {
          const s = search.trim().toLowerCase();
          const haystack = `${p.client.fullName ?? ""} ${p.client.email} ${p.referenceNumber ?? ""}`.toLowerCase();
          if (!haystack.includes(s)) return false;
        }
        return true;
      }),
    [projects, search, statusFilter],
  );

  if (projects.length === 0) {
    return <div className="empty">No confirmed projects yet.</div>;
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <div className="edit-inline-form" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search client or reference number"
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

      {filtered.length === 0 ? (
        <div className="empty">No projects match these filters.</div>
      ) : (
        filtered.map((p) => {
          const openInspections = p.inspections.filter((i) => i.status === "requested" || i.status === "scheduled");
          return (
            <AdminPanel
              key={p.id}
              defaultOpen={false}
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className={`status-badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
                  <span className="sub" style={{ marginBottom: 0 }}>
                    {p.referenceNumber ?? "-"} &middot; {projectName(p.officeSize, p.location)} &middot;{" "}
                    {p.client.fullName ?? p.client.email} &middot; Captain: {p.captain?.fullName ?? p.captain?.email ?? "-"}{" "}
                    &middot; AED {p.grandTotal.toLocaleString()} &middot; {overallProgress(p.timelineItems)}% overall
                    {openInspections.length > 0 && ` · ${openInspections.length} inspection(s) pending`}
                  </span>
                </span>
              }
            >
              <div className="modal-section-label" style={{ marginTop: 0 }}>
                Project timeline &amp; contractor assignment
              </div>
              <GanttChart quoteId={p.id} items={p.timelineItems} categories={categories} types={types} contractors={contractors} />

              <div className="modal-section-label">Payment eligibility</div>
              <div className="payment-bar-rail">
                <div className="payment-bar-fill" style={{ width: `${overallProgress(p.timelineItems)}%` }} />
              </div>
              <p className="sub">
                {overallProgress(p.timelineItems)}% of AED {p.grandTotal.toLocaleString()} currently eligible for
                payment (averaged across all assigned timeline items).
              </p>

              {p.inspections.length > 0 && (
                <div className="site-inspection-box">
                  <div className="modal-section-label" style={{ marginTop: 0 }}>
                    Site inspections
                  </div>
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
                        {insp.visitNotes && (
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            <b>Visit notes:</b> {insp.visitNotes}
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
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AdminPanel>
          );
        })
      )}
    </>
  );
}
