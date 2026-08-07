"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setDesignerApplicationStatus } from "@/app/actions/designers";

type Status = "pending" | "approved" | "rejected" | "blocked";

type Application = {
  id: string;
  knowsRevit: boolean;
  location: string | null;
  country: string | null;
  whatsappNumber: string | null;
  portfolioUrl: string | null;
  cvFilePath: string | null;
  status: Status;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  designer: { fullName: string | null; email: string };
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
};

const STATUS_OPTIONS: Status[] = ["pending", "approved", "rejected", "blocked"];

export default function DesignerApplicationsClient({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdateStatus(id: string) {
    const status = pendingStatus[id];
    if (!status) return;
    setBusy(id);
    setError(null);
    try {
      await setDesignerApplicationStatus(id, status, notes[id]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(null);
    }
  }

  if (applications.length === 0) {
    return <div className="empty">No designer applications yet.</div>;
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Details</th>
            <th>Portfolio / CV</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Change status</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>
                {app.designer.fullName ?? app.designer.email}
                <div className="sub" style={{ marginBottom: 0 }}>{app.designer.email}</div>
                {app.whatsappNumber && <div className="sub" style={{ marginBottom: 0 }}>{app.whatsappNumber}</div>}
              </td>
              <td>
                {[app.location, app.country].filter(Boolean).join(", ") || "-"}
                <div className="sub" style={{ marginBottom: 0 }}>{app.knowsRevit ? "Knows Revit" : "No Revit"}</div>
              </td>
              <td>
                {app.portfolioUrl && (
                  <div>
                    <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      Portfolio
                    </a>
                  </div>
                )}
                {app.cvFilePath && (
                  <div>
                    <a href={app.cvFilePath} target="_blank" rel="noopener noreferrer">
                      CV
                    </a>
                  </div>
                )}
              </td>
              <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge ${app.status}`}>{STATUS_LABEL[app.status]}</span>
                {app.reviewNote && <div className="sub" style={{ marginBottom: 0 }}>{app.reviewNote}</div>}
              </td>
              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 170 }}>
                  <select
                    value={pendingStatus[app.id] ?? app.status}
                    onChange={(e) => setPendingStatus((prev) => ({ ...prev, [app.id]: e.target.value as Status }))}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={notes[app.id] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                  />
                  <button
                    className="action"
                    disabled={busy === app.id || (pendingStatus[app.id] ?? app.status) === app.status}
                    onClick={() => handleUpdateStatus(app.id)}
                  >
                    {busy === app.id ? "Updating..." : "Update"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
