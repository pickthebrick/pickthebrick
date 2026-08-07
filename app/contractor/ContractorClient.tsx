"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteStatus } from "@/app/generated/prisma/enums";
import { reportProgress, requestSiteInspection, requestPaymentClaim } from "@/app/actions/progress";
import { applyForOpenJob } from "@/app/actions/timeline";
import { applyContractorReduction, blendedReductionPercent } from "@/lib/contractorPricing";

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  submitted: "Created",
  captain_confirmed: "Confirmed",
  admin_approved: "Approved",
  paid: "Paid",
};

const PRESETS = [0, 10, 25, 50, 75, 90, 100];

type QuoteItem = { id: string; name: string; categoryLabel: string; qty: number; unit: string };
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
type PaymentClaim = { id: string; requestedPercent: number; requestedAmount: number; status: string; requestedAt: Date };
type TimelineItemProgress = { deliveryApproved: number; siteApproved: number };

type Quote = {
  id: string;
  status: QuoteStatus;
  confirmedAt: Date | null;
  grandTotal: number;
  referenceNumber: string | null;
  location: string | null;
  officeSize: string | null;
  items: QuoteItem[];
  timelineItems: TimelineItemProgress[];
  inspections: Inspection[];
  paymentClaims: PaymentClaim[];
};

type Assignment = {
  id: string;
  label: string;
  deliveryReported: number;
  deliveryApproved: number;
  siteReported: number;
  siteApproved: number;
  category: { label: string; contractorReductionPercent: number } | null;
  type: { label: string } | null;
  quote: Quote;
};

type OpenJobItem = { name: string; categoryId: string | null; qty: number; unit: string };
type OpenJob = {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  categoryLabel: string;
  typeLabel: string;
  location: string | null;
  // Already the reduced (post-margin) value for this job's own category -
  // see applyContractorReduction() in app/contractor/page.tsx.
  value: number;
  matchingItems: OpenJobItem[];
  hasApplied: boolean;
};

function projectName(officeSize: string | null, location: string | null) {
  if (!officeSize && !location) return "Untitled project";
  return [officeSize, location].filter(Boolean).join(" · ");
}

function eligiblePercent(rows: TimelineItemProgress[]) {
  if (rows.length === 0) return 0;
  const total = rows.reduce((s, r) => s + (r.deliveryApproved * 0.4 + r.siteApproved * 0.6), 0);
  return Math.round(total / rows.length);
}

function ProgressTrack({
  label,
  reported,
  approved,
  busy,
  onSet,
}: {
  label: string;
  reported: number;
  approved: number;
  busy: boolean;
  onSet: (value: number) => void;
}) {
  return (
    <div className="progress-track">
      <div className="progress-track-head">
        <span className="progress-track-label">{label}</span>
        <span className="progress-track-values">
          Approved {approved}% &middot; Reported {reported}%
        </span>
      </div>
      <div className="progress-bar-rail">
        <div className="progress-bar-fill approved" style={{ width: `${approved}%` }} />
        <div className="progress-bar-fill reported" style={{ width: `${reported}%` }} />
      </div>
      <div className="progress-preset-buttons">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`progress-preset-btn ${reported === p ? "selected" : ""}`}
            disabled={busy}
            onClick={() => onSet(p)}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}

type Selection = { kind: "project"; id: string } | { kind: "open-jobs" };

// Left-nav shell (same .admin-shell/.admin-sidebar markup the captain
// dashboard uses) with two sections: "My projects" - one entry per assigned
// project, mirroring the captain's project list - and "Open jobs", a single
// nav item for browsing/applying to unassigned work matching this
// contractor's approved types. Mobile-first: this dashboard is the one most
// likely used one-handed on a phone on-site, so touch targets stay large
// and everything stacks in a single column (see the @media rules in
// dashboard.css).
export default function ContractorClient({ assignments, openJobs }: { assignments: Assignment[]; openJobs: OpenJob[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectionNotes, setInspectionNotes] = useState<Record<string, string>>({});
  const [inspectionDates, setInspectionDates] = useState<Record<string, string>>({});
  const [claimNotes, setClaimNotes] = useState<Record<string, string>>({});

  const projects = useMemo(() => {
    const byQuote = new Map<string, { quote: Quote; assignments: Assignment[] }>();
    for (const a of assignments) {
      const existing = byQuote.get(a.quote.id);
      if (existing) existing.assignments.push(a);
      else byQuote.set(a.quote.id, { quote: a.quote, assignments: [a] });
    }
    return Array.from(byQuote.values());
  }, [assignments]);

  const [selection, setSelection] = useState<Selection>(
    projects[0] ? { kind: "project", id: projects[0].quote.id } : { kind: "open-jobs" },
  );

  async function run(key: string, fn: () => Promise<void>) {
    setBusyKey(key);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyKey(null);
    }
  }

  const selectedProject = selection.kind === "project" ? projects.find((p) => p.quote.id === selection.id) ?? null : null;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <nav>
          {projects.length === 0 && (
            <div className="sub" style={{ padding: "10px 24px" }}>
              No projects assigned yet.
            </div>
          )}
          {projects.map(({ quote: q }) => (
            <button
              key={q.id}
              className={selection.kind === "project" && selection.id === q.id ? "active" : ""}
              onClick={() => setSelection({ kind: "project", id: q.id })}
            >
              {projectName(q.officeSize, q.location)}
              <span style={{ display: "block", fontSize: 10.5, color: "var(--muted)", fontWeight: 400 }}>
                {q.referenceNumber ?? "-"}
              </span>
            </button>
          ))}
          <button
            className={selection.kind === "open-jobs" ? "active" : ""}
            onClick={() => setSelection({ kind: "open-jobs" })}
          >
            Open jobs
            {openJobs.filter((j) => !j.hasApplied).length > 0 && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "1px 7px",
                }}
              >
                {openJobs.filter((j) => !j.hasApplied).length}
              </span>
            )}
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

        {selection.kind === "open-jobs" ? (
          <>
            <h1>Open jobs</h1>
            <p className="sub">Unassigned work matching the categories and types you&apos;re approved for. Apply to let the captain know you&apos;re interested.</p>
            {openJobs.length === 0 ? (
              <div className="empty">No open jobs matching your approved types right now.</div>
            ) : (
              openJobs.map((job) => (
                <div key={job.id} className="contractor-project-card">
                  <div className="contractor-project-head">
                    <div>
                      <span className="status-badge pending">{job.categoryLabel}</span>
                      <span className="sub" style={{ marginBottom: 0, marginLeft: 10 }}>
                        {job.typeLabel} &middot; {job.label}
                      </span>
                    </div>
                    <button
                      className={`action ${job.hasApplied ? "" : ""}`}
                      disabled={job.hasApplied || busyKey === `${job.id}-apply`}
                      onClick={() => run(`${job.id}-apply`, () => applyForOpenJob(job.id))}
                    >
                      {job.hasApplied ? "Applied ✓" : busyKey === `${job.id}-apply` ? "Applying..." : "Apply"}
                    </button>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>
                    📍 {job.location ?? "Location not set"} &middot; Job value AED {Math.round(job.value).toLocaleString()} &middot;{" "}
                    {new Date(job.startDate).toLocaleDateString()} – {new Date(job.endDate).toLocaleDateString()}
                  </div>
                  {job.matchingItems.length > 0 && (
                    <div style={{ fontSize: 12.5 }}>
                      {job.matchingItems.map((it, i) => (
                        <div key={i}>
                          {it.name} &middot; {it.qty} {it.unit === "count" ? "Nos" : it.unit === "lm" ? "lm" : "sqm"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        ) : !selectedProject ? (
          <div className="empty">Select a project from the list to see its details.</div>
        ) : (
          (() => {
            const q = selectedProject.quote;
            const myAssignments = selectedProject.assignments;
            // What this contractor actually gets paid on this project - the
            // client sell price reduced by the blend of their own
            // categories' rates (see lib/contractorPricing.ts).
            const myReduction = blendedReductionPercent(
              myAssignments.map((a) => a.category?.contractorReductionPercent ?? 15),
            );
            const eligiblePct = eligiblePercent(q.timelineItems);
            const eligibleAmount = applyContractorReduction((eligiblePct / 100) * q.grandTotal, myReduction);
            const alreadyClaimed = q.paymentClaims.reduce((sum, c) => sum + (c.status !== "pending" ? c.requestedPercent : 0), 0);
            const canClaim = eligiblePct > alreadyClaimed;

            return (
              <>
                <h1>{projectName(q.officeSize, q.location)}</h1>
                <p className="sub">
                  <span className={`status-badge ${q.status}`}>{STATUS_LABEL[q.status]}</span>{" "}
                  {q.referenceNumber ?? "-"} &middot; AED {Math.round(applyContractorReduction(q.grandTotal, myReduction)).toLocaleString()}
                </p>

                <div className="contractor-project-head" style={{ marginTop: 0 }}>
                  <div />
                  <button
                    className="signout"
                    style={{ fontSize: 11, color: "var(--muted)" }}
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                  >
                    {expanded === q.id ? "Hide items" : "View items"}
                  </button>
                </div>
                {expanded === q.id && (
                  <div style={{ padding: "8px 0" }}>
                    {q.items.map((it) => (
                      <div key={it.id} style={{ fontSize: 12, padding: "4px 0" }}>
                        {it.name} &middot; {it.categoryLabel} &middot; {it.qty} {it.unit === "count" ? "Nos" : it.unit === "lm" ? "lm" : "sqm"}
                      </div>
                    ))}
                  </div>
                )}

                {myAssignments.map((a) => (
                  <Fragment key={a.id}>
                    <div className="modal-section-label">
                      Your progress &middot; {a.category?.label ?? "General"}
                      {a.type ? ` · ${a.type.label}` : ""} &middot; {a.label}
                    </div>
                    <ProgressTrack
                      label="Material delivery"
                      reported={a.deliveryReported}
                      approved={a.deliveryApproved}
                      busy={busyKey === `${a.id}-delivery`}
                      onSet={(value) => run(`${a.id}-delivery`, () => reportProgress(a.id, { deliveryReported: value }))}
                    />
                    <ProgressTrack
                      label="Site work"
                      reported={a.siteReported}
                      approved={a.siteApproved}
                      busy={busyKey === `${a.id}-site`}
                      onSet={(value) => run(`${a.id}-site`, () => reportProgress(a.id, { siteReported: value }))}
                    />
                  </Fragment>
                ))}

                <div className="modal-section-label">Payment eligibility (whole project)</div>
                <div className="contractor-eligibility-row">
                  <span>
                    Eligible to claim: <b>AED {Math.round(eligibleAmount).toLocaleString()}</b> ({eligiblePct}% of total, averaged across
                    every contractor on this project)
                  </span>
                </div>
                <div className="edit-inline-form">
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={claimNotes[q.id] ?? ""}
                    onChange={(e) => setClaimNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  />
                  <button
                    className="action"
                    disabled={!canClaim || busyKey === `${q.id}-claim`}
                    title={!canClaim ? "No newly-approved progress to claim against yet" : undefined}
                    onClick={() =>
                      run(`${q.id}-claim`, async () => {
                        await requestPaymentClaim(q.id, claimNotes[q.id]);
                        setClaimNotes((prev) => ({ ...prev, [q.id]: "" }));
                      })
                    }
                  >
                    Request payment
                  </button>
                </div>
                {q.paymentClaims.length > 0 && (
                  <ul className="edit-list">
                    {q.paymentClaims.map((c) => (
                      <li key={c.id}>
                        {c.requestedPercent}% &middot; AED {c.requestedAmount.toLocaleString()}
                        <span className={`status-badge ${c.status}`} style={{ marginLeft: "auto" }}>
                          {c.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="site-inspection-box">
                  <div className="modal-section-label" style={{ marginTop: 0 }}>
                    Site inspection
                  </div>
                  <div className="edit-inline-form">
                    <input
                      type="date"
                      value={inspectionDates[q.id] ?? ""}
                      onChange={(e) => setInspectionDates((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                    <input
                      type="text"
                      placeholder="Optional note"
                      value={inspectionNotes[q.id] ?? ""}
                      onChange={(e) => setInspectionNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                    <button
                      className="action"
                      disabled={busyKey === `${q.id}-inspection`}
                      onClick={() =>
                        run(`${q.id}-inspection`, async () => {
                          await requestSiteInspection(q.id, inspectionDates[q.id], inspectionNotes[q.id]);
                          setInspectionNotes((prev) => ({ ...prev, [q.id]: "" }));
                          setInspectionDates((prev) => ({ ...prev, [q.id]: "" }));
                        })
                      }
                    >
                      Apply for site inspection
                    </button>
                  </div>
                  {q.inspections.length > 0 && (
                    <ul className="edit-list">
                      {q.inspections.map((insp) => (
                        <Fragment key={insp.id}>
                          <li>
                            {new Date(insp.requestedAt).toLocaleDateString()}
                            {insp.preferredDate && ` · Preferred ${new Date(insp.preferredDate).toLocaleDateString()}`}
                            {insp.note && ` · "${insp.note}"`}
                            <span className={`status-badge ${insp.status}`} style={{ marginLeft: "auto" }}>
                              {insp.status}
                            </span>
                          </li>
                          {insp.scheduledAt && (
                            <li style={{ fontSize: 12, color: "var(--muted)" }}>
                              Scheduled for {new Date(insp.scheduledAt).toLocaleDateString()}
                            </li>
                          )}
                          {insp.captainNote && (
                            <li style={{ fontSize: 12, fontStyle: "italic", color: "var(--muted)" }}>{insp.captainNote}</li>
                          )}
                          {insp.visitNotes && (
                            <li style={{ fontSize: 12, color: "var(--fg)" }}>
                              <b>Captain&apos;s visit notes:</b> {insp.visitNotes}
                            </li>
                          )}
                        </Fragment>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            );
          })()
        )}
      </main>
    </div>
  );
}
