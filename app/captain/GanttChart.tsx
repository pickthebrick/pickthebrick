"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
  assignTimelineItemContractor,
} from "@/app/actions/timeline";
import { approveProgress, setContractorProgress } from "@/app/actions/progress";

export type TimelineItem = {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  status: "unassigned" | "assigned";
  category: { id: string; label: string } | null;
  type: { id: string; label: string } | null;
  contractor: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    contractorApplication: { companyName: string | null; contactPhone: string | null } | null;
  } | null;
  deliveryReported: number;
  deliveryApproved: number;
  siteReported: number;
  siteApproved: number;
  applications: { contractorId: string }[];
};

type CategoryOption = { id: string; label: string };
type TypeOption = { id: string; categoryId: string; label: string };
type ContractorOption = { id: string; fullName: string | null; approvedCategoryIds: string[]; approvedTypeIds: string[] };

function toInputDate(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function eligiblePercent(item: TimelineItem) {
  return Math.round(item.deliveryApproved * 0.4 + item.siteApproved * 0.6);
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Candidate tick spacings (in days), smallest-first - the ruler picks the
// smallest one that keeps the total tick count at or under MAX_TICKS.
const TICK_DAY_OPTIONS = [1, 2, 3, 5, 7, 14, 30, 60];
const MAX_TICKS = 10;

type DragMode = "move" | "start" | "end";
type DragState = {
  id: string;
  mode: DragMode;
  originClientX: number;
  origStart: number;
  origEnd: number;
  trackWidth: number;
};

// Gantt with both a typed-date Edit form and drag/resize on the bars
// themselves (see beginDrag below) - used by both the captain's project
// detail panel and admin's Projects page (same component, same actions -
// see app/actions/timeline.ts). Also owns contractor assignment per item
// (category/type/contractor -> Assign) and, once assigned, a collapsible
// progress section - this replaced the old separate "one contractor per
// category" flow.
export default function GanttChart({
  quoteId,
  items,
  categories,
  types,
  contractors,
}: {
  quoteId: string;
  items: TimelineItem[];
  categories: CategoryOption[];
  types: TypeOption[];
  contractors: ContractorOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ label: "", startDate: "", endDate: "" });
  const [newDraft, setNewDraft] = useState({ categoryId: "", startDate: "", endDate: "" });
  const [assignDrafts, setAssignDrafts] = useState<Record<string, { categoryId: string; typeId: string; contractorId: string }>>({});
  // Once an item is assigned, its category/type/contractor selects freeze
  // into plain text - reassigningIds tracks which rows the captain has
  // explicitly reopened via "Reassign" to edit that selection again.
  const [reassigningIds, setReassigningIds] = useState<Record<string, boolean>>({});
  const [revealedContact, setRevealedContact] = useState<Record<string, boolean>>({});
  const [openProgress, setOpenProgress] = useState<Record<string, boolean>>({});
  const [overrideDrafts, setOverrideDrafts] = useState<Record<string, string>>({});
  // Snapshot "now" once per mount rather than calling Date.now() during
  // render (impure) - only used as a fallback axis when there are no items yet.
  const [now] = useState(() => Date.now());
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dragDraft, setDragDraft] = useState<{ id: string; startMs: number; endMs: number } | null>(null);
  const dragDraftRef = useRef<{ id: string; startMs: number; endMs: number } | null>(null);

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

  function startEdit(item: TimelineItem) {
    setEditingId(item.id);
    setEditDraft({ label: item.label, startDate: toInputDate(item.startDate), endDate: toInputDate(item.endDate) });
  }

  function assignDraft(item: TimelineItem) {
    return (
      assignDrafts[item.id] ?? {
        categoryId: item.category?.id ?? "",
        typeId: item.type?.id ?? "",
        contractorId: item.contractor?.id ?? "",
      }
    );
  }

  function setAssignDraft(item: TimelineItem, patch: Partial<{ categoryId: string; typeId: string; contractorId: string }>) {
    setAssignDrafts((prev) => ({ ...prev, [item.id]: { ...assignDraft(item), ...patch } }));
  }

  // Starts a drag on a bar's body (mode "move", shifts both dates by the
  // same delta) or one of its edge handles (mode "start"/"end", changes
  // just that one date) - additive to the typed-date Edit form above, not a
  // replacement. pointermove/pointerup are wired at the document level (see
  // the effect below) so the drag keeps tracking even if the cursor leaves
  // the bar.
  function beginDrag(e: React.PointerEvent<HTMLDivElement>, item: TimelineItem, mode: DragMode) {
    e.preventDefault();
    e.stopPropagation();
    const track = e.currentTarget.closest(".gantt-row-track") as HTMLElement | null;
    if (!track) return;
    const origStart = new Date(item.startDate).getTime();
    const origEnd = new Date(item.endDate).getTime();
    setDragging({ id: item.id, mode, originClientX: e.clientX, origStart, origEnd, trackWidth: track.getBoundingClientRect().width });
    dragDraftRef.current = { id: item.id, startMs: origStart, endMs: origEnd };
    setDragDraft(dragDraftRef.current);
  }

  const sorted = [...items].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  let axisStart: number;
  let axisEnd: number;
  if (sorted.length === 0) {
    axisStart = now;
    axisEnd = now + 14 * DAY_MS;
  } else {
    const minStart = Math.min(...sorted.map((i) => new Date(i.startDate).getTime()));
    const maxEnd = Math.max(...sorted.map((i) => new Date(i.endDate).getTime()));
    axisStart = minStart - 2 * DAY_MS;
    axisEnd = maxEnd + 2 * DAY_MS;
  }
  const axisSpan = Math.max(1, axisEnd - axisStart);

  // Adaptive ruler ticks: the smallest candidate spacing that keeps the
  // total tick count at or under MAX_TICKS, so a 2-week project gets daily
  // ticks and a 6-month one gets monthly ticks.
  const axisSpanDays = axisSpan / DAY_MS;
  const tickIntervalDays = TICK_DAY_OPTIONS.find((d) => axisSpanDays / d <= MAX_TICKS) ?? TICK_DAY_OPTIONS[TICK_DAY_OPTIONS.length - 1];
  const ticks: number[] = [];
  for (let t = axisStart; t <= axisEnd; t += tickIntervalDays * DAY_MS) ticks.push(t);
  if (ticks[ticks.length - 1] !== axisEnd) ticks.push(axisEnd);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: PointerEvent) {
      const active = dragging;
      if (!active) return;
      const deltaPx = e.clientX - active.originClientX;
      const deltaDays = Math.round((deltaPx / active.trackWidth) * axisSpanDays);
      const deltaMs = deltaDays * DAY_MS;
      let newStart = active.origStart;
      let newEnd = active.origEnd;
      if (active.mode === "move") {
        newStart = active.origStart + deltaMs;
        newEnd = active.origEnd + deltaMs;
      } else if (active.mode === "start") {
        newStart = Math.min(active.origStart + deltaMs, active.origEnd - DAY_MS);
      } else {
        newEnd = Math.max(active.origEnd + deltaMs, active.origStart + DAY_MS);
      }
      const draft = { id: active.id, startMs: newStart, endMs: newEnd };
      dragDraftRef.current = draft;
      setDragDraft(draft);
    }
    async function onUp() {
      const active = dragging;
      const draft = dragDraftRef.current;
      setDragging(null);
      if (!active || !draft) return;
      await run(`${active.id}-drag`, () =>
        updateTimelineItem(active.id, {
          startDate: new Date(draft.startMs).toISOString().slice(0, 10),
          endDate: new Date(draft.endMs).toISOString().slice(0, 10),
        }),
      );
      dragDraftRef.current = null;
      setDragDraft(null);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, axisSpanDays]);

  function displayedRange(item: TimelineItem) {
    if (dragDraft && dragDraft.id === item.id) return { start: dragDraft.startMs, end: dragDraft.endMs };
    return { start: new Date(item.startDate).getTime(), end: new Date(item.endDate).getTime() };
  }

  function barStyle(item: TimelineItem) {
    const { start: s, end: e } = displayedRange(item);
    const left = ((s - axisStart) / axisSpan) * 100;
    const width = Math.max(2, ((e - s) / axisSpan) * 100);
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <div className="gantt-chart">
      {error && <p style={{ color: "#b91c1c", marginBottom: 8, fontSize: 12 }}>{error}</p>}

      {sorted.length === 0 ? (
        <div className="empty">No timeline items yet.</div>
      ) : (
        <>
          <div className="gantt-body">
            <div className="gantt-gridlines">
              {ticks.map((t) => (
                <div key={t} className="gantt-gridline" style={{ left: `${((t - axisStart) / axisSpan) * 100}%` }}>
                  <span className="gantt-gridline-label">
                    {new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
            <div className="gantt-rows">
            {sorted.map((item) => {
              const draft = assignDraft(item);
              const typeOptions = types.filter((t) => t.categoryId === draft.categoryId);
              const appliedContractorIds = new Set(item.applications.map((a) => a.contractorId));
              // Applicants for this specific item are surfaced first and
              // starred, so the captain/admin can give them priority - still
              // just a hint, not a restriction on who can be picked.
              const contractorOptions = contractors
                .filter((c) => draft.typeId && c.approvedTypeIds.includes(draft.typeId))
                .sort((a, b) => Number(appliedContractorIds.has(b.id)) - Number(appliedContractorIds.has(a.id)));
              const canAssign = !!(draft.categoryId && draft.typeId && draft.contractorId);
              const isAssigned = item.status === "assigned";
              // Once assigned, the category/type/contractor selection is
              // shown as frozen text rather than live selects - "Reassign"
              // is the only way back into edit mode, so a stray click can't
              // silently change who's on the job.
              const isEditingAssignment = !isAssigned || reassigningIds[item.id];
              const contractorLabel = item.contractor?.contractorApplication?.companyName ?? item.contractor?.fullName ?? null;
              return (
                <div key={item.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 10 }}>
                  <div className="gantt-row">
                    <div className="gantt-row-label">{item.label}</div>
                    <div className="gantt-row-track">
                      <div
                        className="gantt-bar"
                        style={barStyle(item)}
                        title={`${new Date(item.startDate).toLocaleDateString()} – ${new Date(item.endDate).toLocaleDateString()}`}
                        onPointerDown={(e) => beginDrag(e, item, "move")}
                      >
                        <div className="gantt-bar-handle left" onPointerDown={(e) => beginDrag(e, item, "start")} />
                        <div className="gantt-bar-handle right" onPointerDown={(e) => beginDrag(e, item, "end")} />
                      </div>
                    </div>
                    <div className="gantt-row-actions">
                      <span className={`status-badge ${isAssigned ? "approved" : "pending"}`}>
                        {isAssigned ? "Assigned" : "Unassigned"}
                      </span>
                      {isAssigned && !reassigningIds[item.id] && (
                        <button
                          type="button"
                          className="signout"
                          style={{ fontSize: 11 }}
                          title="Reassigning a contractor is a big deal - review the new selection carefully before confirming"
                          onClick={() => {
                            setAssignDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                categoryId: item.category?.id ?? "",
                                typeId: item.type?.id ?? "",
                                contractorId: item.contractor?.id ?? "",
                              },
                            }));
                            setReassigningIds((prev) => ({ ...prev, [item.id]: true }));
                          }}
                        >
                          Reassign
                        </button>
                      )}
                      <button type="button" className="signout" style={{ fontSize: 11 }} onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="signout"
                        style={{ fontSize: 11, color: "#b91c1c" }}
                        disabled={busy === item.id}
                        onClick={() => run(item.id, () => deleteTimelineItem(item.id))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isEditingAssignment ? (
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <select
                        value={draft.categoryId}
                        onChange={(e) => setAssignDraft(item, { categoryId: e.target.value, typeId: "", contractorId: "" })}
                      >
                        <option value="">Item...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={draft.typeId}
                        disabled={!draft.categoryId}
                        onChange={(e) => setAssignDraft(item, { typeId: e.target.value })}
                      >
                        <option value="">Type...</option>
                        {typeOptions.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={draft.contractorId}
                        disabled={!draft.typeId}
                        onChange={(e) => setAssignDraft(item, { contractorId: e.target.value })}
                      >
                        <option value="">Contractor...</option>
                        {contractorOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {appliedContractorIds.has(c.id) ? `★ ${c.fullName ?? c.id} (applied)` : (c.fullName ?? c.id)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="action"
                        disabled={!canAssign || busy === `${item.id}-assign`}
                        onClick={() =>
                          run(`${item.id}-assign`, async () => {
                            await assignTimelineItemContractor(item.id, {
                              categoryId: draft.categoryId,
                              typeId: draft.typeId,
                              contractorId: draft.contractorId,
                            });
                            setReassigningIds((prev) => ({ ...prev, [item.id]: false }));
                          })
                        }
                      >
                        {isAssigned ? "Confirm reassignment" : "Assign"}
                      </button>
                      {isAssigned && (
                        <button
                          type="button"
                          className="signout"
                          style={{ fontSize: 11 }}
                          onClick={() => {
                            setReassigningIds((prev) => ({ ...prev, [item.id]: false }));
                            setAssignDrafts((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="gantt-frozen-assignment">
                      <span>
                        <b>{item.category?.label ?? "-"}</b> / {item.type?.label ?? "-"}
                      </span>
                      <span>
                        Contractor: <b>{item.contractor?.fullName ?? "-"}</b>
                      </span>
                      <button
                        type="button"
                        className="signout"
                        style={{ fontSize: 11 }}
                        onClick={() => setOpenProgress((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      >
                        {openProgress[item.id] ? "Hide progress" : "Show progress"}
                      </button>
                    </div>
                  )}

                  {isAssigned && openProgress[item.id] && (
                    <div style={{ marginTop: 10 }}>
                      {(["delivery", "site"] as const).map((track) => {
                        const reported = track === "delivery" ? item.deliveryReported : item.siteReported;
                        const approved = track === "delivery" ? item.deliveryApproved : item.siteApproved;
                        const key = `${item.id}-${track}`;
                        return (
                          <div key={track} className="progress-track">
                            <div className="progress-track-head">
                              <span className="progress-track-label">{track === "delivery" ? "Material delivery" : "Site work"}</span>
                              <span className="progress-track-values">
                                Approved {approved}% &middot; Reported {reported}%
                              </span>
                            </div>
                            <div className="progress-bar-rail">
                              <div className="progress-bar-fill approved" style={{ width: `${approved}%` }} />
                              <div className="progress-bar-fill reported" style={{ width: `${reported}%` }} />
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <button
                                className="action"
                                disabled={reported <= approved || busy === key}
                                onClick={() =>
                                  run(key, () =>
                                    approveProgress(item.id, track === "delivery" ? { approveDelivery: true } : { approveSite: true }),
                                  )
                                }
                              >
                                Approve latest ({reported}%)
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="Set %"
                                style={{ width: 70 }}
                                value={overrideDrafts[key] ?? ""}
                                onChange={(e) => setOverrideDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                              />
                              <button
                                className="action"
                                disabled={!overrideDrafts[key] || busy === `${key}-override`}
                                title="Directly set both reported and approved progress on the contractor's behalf"
                                onClick={() =>
                                  run(`${key}-override`, async () => {
                                    const value = Math.max(0, Math.min(100, Math.round(parseFloat(overrideDrafts[key]))));
                                    await setContractorProgress(
                                      item.id,
                                      track === "delivery"
                                        ? { deliveryReported: value, deliveryApproved: value }
                                        : { siteReported: value, siteApproved: value },
                                    );
                                    setOverrideDrafts((prev) => ({ ...prev, [key]: "" }));
                                  })
                                }
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="modal-section-label" style={{ marginTop: 4 }}>
                        Payment eligibility (this item)
                      </div>
                      <div className="payment-bar-rail">
                        <div className="payment-bar-fill" style={{ width: `${eligiblePercent(item)}%` }} />
                      </div>
                      <p className="sub" style={{ marginBottom: 0 }}>
                        {eligiblePercent(item)}% eligible for payment on this line item.
                      </p>
                    </div>
                  )}

                  {isAssigned && item.contractor && contractorLabel && (
                    <div className="gantt-contractor-footer">
                      <button
                        type="button"
                        className="gantt-contractor-link"
                        onClick={() => setRevealedContact((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      >
                        {contractorLabel}
                      </button>
                      {revealedContact[item.id] && (
                        <div className="gantt-contractor-details">
                          <div>
                            <b>Company:</b> {item.contractor.contractorApplication?.companyName ?? "-"}
                          </div>
                          <div>
                            <b>Contact:</b> {item.contractor.fullName ?? "-"}
                          </div>
                          <div>
                            <b>Phone:</b> {item.contractor.contractorApplication?.contactPhone ?? item.contractor.phone ?? "-"}
                          </div>
                          <div>
                            <b>Email:</b> {item.contractor.email}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </>
      )}

      {editingId && (
        <div className="edit-inline-form" style={{ marginTop: 10 }}>
          <input
            type="text"
            value={editDraft.label}
            onChange={(e) => setEditDraft((p) => ({ ...p, label: e.target.value }))}
            placeholder="Task label"
          />
          <input
            type="date"
            value={editDraft.startDate}
            onChange={(e) => setEditDraft((p) => ({ ...p, startDate: e.target.value }))}
          />
          <input
            type="date"
            value={editDraft.endDate}
            onChange={(e) => setEditDraft((p) => ({ ...p, endDate: e.target.value }))}
          />
          <button
            className="action"
            disabled={busy === "edit"}
            onClick={() =>
              run("edit", async () => {
                await updateTimelineItem(editingId, editDraft);
                setEditingId(null);
              })
            }
          >
            Save
          </button>
          <button className="action" onClick={() => setEditingId(null)}>
            Cancel
          </button>
        </div>
      )}

      <div className="modal-section-label">Add timeline item</div>
      <div className="edit-inline-form">
        <select value={newDraft.categoryId} onChange={(e) => setNewDraft((p) => ({ ...p, categoryId: e.target.value }))}>
          <option value="">Category...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={newDraft.startDate}
          onChange={(e) => setNewDraft((p) => ({ ...p, startDate: e.target.value }))}
        />
        <input
          type="date"
          value={newDraft.endDate}
          onChange={(e) => setNewDraft((p) => ({ ...p, endDate: e.target.value }))}
        />
        <button
          className="action"
          disabled={busy === "add" || !newDraft.categoryId || !newDraft.startDate || !newDraft.endDate}
          onClick={() =>
            run("add", async () => {
              await addTimelineItem(quoteId, newDraft.categoryId, newDraft.startDate, newDraft.endDate);
              setNewDraft({ categoryId: "", startDate: "", endDate: "" });
            })
          }
        >
          Add
        </button>
      </div>
    </div>
  );
}
