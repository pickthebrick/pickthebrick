"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import type { DesignRequestStatus } from "@/app/generated/prisma/enums";
import { deleteDesignRequestFile, assignDesigner } from "@/app/actions/design";
import { PACKAGE_LABELS, groupSpaceEntries } from "@/lib/spaces";
import { MAX_REVISIONS, type PackageKey } from "@/lib/designPricing";
import AdminPanel from "../AdminPanel";
import SpaceRequirements, { type SpaceEntry } from "../../designer/SpaceRequirements";

const CLIENT_UPLOAD_PREFIX = "Client layout upload:";

const STATUS_LABEL: Record<DesignRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "In progress",
  delivered: "Delivered",
};

type File = { id: string; label: string; filePath: string; createdAt: Date };
type Designer = { id: string; fullName: string | null; email: string };
type RevisionComment = { id: string; authorRole: string; body: string; channel: string; createdAt: Date };
type Request = {
  id: string;
  packageKey: string;
  sqft: number;
  status: DesignRequestStatus;
  submittedAt: Date | null;
  claimDeadline: Date | null;
  siteVisitRequested: boolean;
  designerId: string | null;
  revisionsUsed: number;
  client: { fullName: string | null; email: string };
  designer: { fullName: string | null; email: string } | null;
  spaceEntries: SpaceEntry[];
  files: File[];
  revisionComments: RevisionComment[];
};

function isOverdue(r: Request) {
  return r.status === "in_progress" && !!r.claimDeadline && new Date(r.claimDeadline).getTime() < Date.now();
}

function clientLayoutFiles(r: Request) {
  return r.files.filter((f) => f.label.startsWith(CLIENT_UPLOAD_PREFIX));
}

export default function AdminDesignerClient({ requests, designers }: { requests: Request[]; designers: Designer[] }) {
  const router = useRouter();
  const [managing, setManaging] = useState<Request | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDesigner, setPendingDesigner] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleAssign(id: string) {
    const designerId = pendingDesigner[id];
    if (!designerId) return;
    setBusy(id);
    setError(null);
    try {
      await assignDesigner(id, designerId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign designer");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(fileId: string) {
    setBusy(fileId);
    setError(null);
    try {
      await deleteDesignRequestFile(fileId);
      router.refresh();
      setManaging((prev) => (prev ? { ...prev, files: prev.files.filter((f) => f.id !== fileId) } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete file");
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) {
    return <div className="empty">No design requests have been submitted yet.</div>;
  }

  return (
    <>
      <AdminPanel title="Design requests" count={requests.length}>
      <table>
        <thead>
          <tr>
            <th>Submitted</th>
            <th>Client</th>
            <th>Package</th>
            <th>Size</th>
            <th>Spaces</th>
            <th>Designer</th>
            <th>Deadline</th>
            <th>Status</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <Fragment key={r.id}>
            <tr>
              <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}</td>
              <td>
                {r.client.fullName ?? r.client.email}
                <br />
                <span className="sub" style={{ marginBottom: 0 }}>
                  {r.client.email}
                </span>
              </td>
              <td>{PACKAGE_LABELS[r.packageKey] ?? r.packageKey}</td>
              <td>{r.sqft.toLocaleString()} sqft</td>
              <td style={{ maxWidth: 220 }}>{groupSpaceEntries(r.spaceEntries) || "-"}</td>
              <td>
                {r.status === "delivered" ? (
                  r.designer?.fullName ?? r.designer?.email ?? "-"
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 150 }}>
                    <select
                      value={pendingDesigner[r.id] ?? r.designerId ?? ""}
                      onChange={(e) => setPendingDesigner((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {designers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName ?? d.email}
                        </option>
                      ))}
                    </select>
                    <button
                      className="action"
                      disabled={
                        busy === r.id ||
                        !pendingDesigner[r.id] ||
                        pendingDesigner[r.id] === r.designerId
                      }
                      onClick={() => handleAssign(r.id)}
                    >
                      {busy === r.id ? "..." : r.designerId ? "Reassign" : "Assign"}
                    </button>
                  </div>
                )}
              </td>
              <td style={isOverdue(r) ? { color: "#b91c1c", fontWeight: 700 } : undefined}>
                {r.claimDeadline ? new Date(r.claimDeadline).toLocaleString() : "-"}
                {isOverdue(r) && <span title="Overdue - not delivered within 48h"> 🚩 Overdue</span>}
              </td>
              <td>
                <span className={`status-badge ${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </td>
              <td>
                <button
                  className="signout"
                  style={{ fontSize: 11, color: "var(--muted)" }}
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  {expanded === r.id ? "Hide details" : "Details"}
                </button>
              </td>
              <td>
                <button className="action" onClick={() => setManaging(r)}>
                  Manage files ({r.files.length})
                </button>
              </td>
            </tr>
            {expanded === r.id && (
              <tr>
                <td colSpan={10} style={{ background: "var(--bg)" }}>
                  <div style={{ padding: "10px 4px" }}>
                    <div className="modal-section-label" style={{ marginTop: 0 }}>
                      Client-uploaded layout
                    </div>
                    {clientLayoutFiles(r).length > 0 ? (
                      clientLayoutFiles(r).map((f) => (
                        <div key={f.id} style={{ fontSize: 12, padding: "4px 0" }}>
                          <a href={f.filePath} target="_blank" rel="noopener noreferrer">
                            {f.label.replace(`${CLIENT_UPLOAD_PREFIX} `, "")}
                          </a>
                        </div>
                      ))
                    ) : r.siteVisitRequested ? (
                      <div style={{ fontSize: 12, padding: "4px 0" }}>
                        No layout uploaded - the client requested a site visit instead.
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, padding: "4px 0" }}>No layout uploaded yet.</div>
                    )}

                    <div className="modal-section-label">Space requirements</div>
                    <SpaceRequirements spaceEntries={r.spaceEntries} />

                    <div className="modal-section-label">
                      Revisions ({r.revisionsUsed}/{MAX_REVISIONS[r.packageKey as PackageKey] ?? "unlimited"})
                    </div>
                    {r.revisionComments.length === 0 ? (
                      <div style={{ fontSize: 12, padding: "4px 0" }}>No feedback logged yet.</div>
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
                  </div>
                </td>
              </tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
      </AdminPanel>

      {managing && (
        <div className="modal-backdrop" onClick={() => setManaging(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title" style={{ marginBottom: 0 }}>
                {managing.client.fullName ?? managing.client.email}
              </div>
              <div className="modal-close" onClick={() => setManaging(null)}>
                &times;
              </div>
            </div>
            <div className="modal-body">
              {error && <p className="form-error">{error}</p>}
              <div className="modal-section-label" style={{ marginTop: 0 }}>
                Submittal files
              </div>
              {managing.files.length === 0 ? (
                <div className="empty">No files uploaded yet.</div>
              ) : (
                <ul className="edit-list">
                  {managing.files.map((f) => (
                    <li key={f.id}>
                      <a href={f.filePath} target="_blank" rel="noopener noreferrer">
                        {f.label}
                      </a>
                      <span className="sub" style={{ marginBottom: 0, marginLeft: "auto" }}>
                        {new Date(f.createdAt).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        className="danger"
                        disabled={busy === f.id}
                        title="Admins can remove a file at any time"
                        onClick={() => handleDelete(f.id)}
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
