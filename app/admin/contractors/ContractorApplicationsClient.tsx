"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setContractorApplicationStatus } from "@/app/actions/contractors";

type Status = "pending" | "approved" | "rejected" | "blocked";

type Application = {
  id: string;
  licenseFilePath: string;
  status: Status;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  companyName: string | null;
  contactPhone: string | null;
  officeLocation: string | null;
  contractor: { fullName: string | null; email: string; phone: string | null };
  categories: { label: string; types: string[] }[];
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
};

const STATUS_OPTIONS: Status[] = ["pending", "approved", "rejected", "blocked"];

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export default function ContractorApplicationsClient({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingStatus, setPendingStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const app of applications) for (const c of app.categories) set.add(c.label);
    return Array.from(set).sort();
  }, [applications]);

  const filtered = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (categoryFilter !== "all" && !app.categories.some((c) => c.label === categoryFilter)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${app.contractor.fullName ?? ""} ${app.contractor.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  async function handleUpdateStatus(id: string) {
    const status = pendingStatus[id];
    if (!status) return;
    setBusy(id);
    setError(null);
    try {
      await setContractorApplicationStatus(id, status, notes[id]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(null);
    }
  }

  function downloadCsv() {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Office location",
      "Categories",
      "Status",
      "Submitted",
      "Approval date",
    ];
    const rows = filtered.map((app) => [
      app.contractor.fullName ?? "",
      app.contractor.email,
      app.contactPhone ?? app.contractor.phone ?? "",
      app.companyName ?? "",
      app.officeLocation ?? "",
      app.categories.map((c) => (c.types.length ? `${c.label} (${c.types.join(", ")})` : c.label)).join("; "),
      STATUS_LABEL[app.status],
      new Date(app.submittedAt).toLocaleDateString(),
      app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contractor-applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (applications.length === 0) {
    return <div className="empty">No contractor applications yet.</div>;
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <div className="edit-inline-form" style={{ marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | "all")}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
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
              <th>Applicant</th>
              <th>Categories</th>
              <th>License</th>
              <th>Submitted</th>
              <th>Approval date</th>
              <th>Status</th>
              <th>Change status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => (
              <tr key={app.id}>
                <td>
                  {app.contractor.fullName ?? app.contractor.email}
                  <div className="sub" style={{ marginBottom: 0 }}>
                    {app.contractor.email}
                    {(app.contactPhone ?? app.contractor.phone) ? ` · ${app.contactPhone ?? app.contractor.phone}` : ""}
                  </div>
                  {(app.companyName || app.officeLocation) && (
                    <div className="sub" style={{ marginBottom: 0 }}>
                      {[app.companyName, app.officeLocation].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </td>
                <td style={{ maxWidth: 260 }}>
                  {app.categories.map((c) => (
                    <div key={c.label} style={{ marginBottom: 2 }}>
                      {c.label}
                      {c.types.length > 0 && (
                        <span className="sub" style={{ marginBottom: 0 }}>
                          {" "}
                          ({c.types.join(", ")})
                        </span>
                      )}
                    </div>
                  ))}
                </td>
                <td>
                  <a href={app.licenseFilePath} target="_blank" rel="noopener noreferrer">
                    View license
                  </a>
                </td>
                <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                <td>{app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : "-"}</td>
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
      )}
    </>
  );
}
