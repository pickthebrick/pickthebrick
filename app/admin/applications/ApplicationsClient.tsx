"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setContractorApplicationStatus } from "@/app/actions/contractors";
import { setDesignerApplicationStatus } from "@/app/actions/designers";

type Status = "pending" | "approved" | "rejected" | "blocked";
type AppType = "contractor" | "designer";

type ContractorApp = {
  type: "contractor";
  id: string;
  applicantName: string | null;
  applicantEmail: string;
  applicantPhone: string | null;
  status: Status;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  categories: { label: string; types: string[] }[];
  companyName: string | null;
  officeLocation: string | null;
  licenseFilePath: string;
};

type DesignerApp = {
  type: "designer";
  id: string;
  applicantName: string | null;
  applicantEmail: string;
  applicantPhone: string | null;
  status: Status;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  knowsRevit: boolean;
  location: string | null;
  country: string | null;
  portfolioUrl: string | null;
  cvFilePath: string | null;
};

type Application = ContractorApp | DesignerApp;

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
};

const STATUS_OPTIONS: Status[] = ["pending", "approved", "rejected", "blocked"];

const TYPE_LABEL: Record<AppType, string> = {
  contractor: "Contractor",
  designer: "Designer",
};

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export default function ApplicationsClient({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<AppType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = applications.filter((app) => {
    if (typeFilter !== "all" && app.type !== typeFilter) return false;
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${app.applicantName ?? ""} ${app.applicantEmail}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const counts = useMemo(
    () => ({
      contractor: applications.filter((a) => a.type === "contractor").length,
      designer: applications.filter((a) => a.type === "designer").length,
    }),
    [applications],
  );

  async function handleUpdateStatus(app: Application) {
    const status = pendingStatus[app.id];
    if (!status) return;
    setBusy(app.id);
    setError(null);
    try {
      if (app.type === "contractor") {
        await setContractorApplicationStatus(app.id, status, notes[app.id]);
      } else {
        await setDesignerApplicationStatus(app.id, status, notes[app.id]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(null);
    }
  }

  function downloadCsv() {
    const header = ["Type", "Name", "Email", "Phone", "Details", "Status", "Submitted", "Approval date"];
    const rows = filtered.map((app) => [
      TYPE_LABEL[app.type],
      app.applicantName ?? "",
      app.applicantEmail,
      app.applicantPhone ?? "",
      app.type === "contractor"
        ? app.categories.map((c) => (c.types.length ? `${c.label} (${c.types.join(", ")})` : c.label)).join("; ")
        : [app.location, app.country].filter(Boolean).join(", "),
      STATUS_LABEL[app.status],
      new Date(app.submittedAt).toLocaleDateString(),
      app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (applications.length === 0) {
    return <div className="empty">No applications yet.</div>;
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <div className="edit-inline-form" style={{ marginBottom: 16 }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AppType | "all")}>
          <option value="all">All types ({applications.length})</option>
          <option value="contractor">Contractors ({counts.contractor})</option>
          <option value="designer">Designers ({counts.designer})</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | "all")}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="action" onClick={downloadCsv}>
          Download CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No applications match these filters.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Applicant</th>
              <th>Details</th>
              <th>Documents</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Change status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={`${app.type}-${app.id}`}>
                <td>
                  <span className={`status-badge ${app.type === "contractor" ? "approved" : "pending"}`}>
                    {TYPE_LABEL[app.type]}
                  </span>
                </td>
                <td>
                  {app.applicantName ?? app.applicantEmail}
                  <div className="sub" style={{ marginBottom: 0 }}>
                    {app.applicantEmail}
                    {app.applicantPhone ? ` · ${app.applicantPhone}` : ""}
                  </div>
                  {app.type === "contractor" && (app.companyName || app.officeLocation) && (
                    <div className="sub" style={{ marginBottom: 0 }}>
                      {[app.companyName, app.officeLocation].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </td>
                <td style={{ maxWidth: 260 }}>
                  {app.type === "contractor"
                    ? app.categories.map((c) => (
                        <div key={c.label} style={{ marginBottom: 2 }}>
                          {c.label}
                          {c.types.length > 0 && (
                            <span className="sub" style={{ marginBottom: 0 }}>
                              {" "}
                              ({c.types.join(", ")})
                            </span>
                          )}
                        </div>
                      ))
                    : (
                        <>
                          {[app.location, app.country].filter(Boolean).join(", ") || "-"}
                          <div className="sub" style={{ marginBottom: 0 }}>{app.knowsRevit ? "Knows Revit" : "No Revit"}</div>
                        </>
                      )}
                </td>
                <td>
                  {app.type === "contractor" ? (
                    <a href={app.licenseFilePath} target="_blank" rel="noopener noreferrer">
                      View license
                    </a>
                  ) : (
                    <>
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
                    </>
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
                      onClick={() => handleUpdateStatus(app)}
                    >
                      {busy === app.id ? "Updating..." : "Update"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
