"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toggleJobApplicationArchived } from "@/app/actions/careers";

type Application = {
  id: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string | null;
  coverNote: string | null;
  cvPath: string;
  archived: boolean;
  createdAt: Date;
};

export default function ApplicantsClient({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [roleFilter, setRoleFilter] = useState("all");

  const allRoles = useMemo(() => {
    const set = new Set(applications.map((a) => a.jobTitle));
    return Array.from(set).sort();
  }, [applications]);

  const filtered = applications.filter((a) => {
    if (statusFilter === "active" && a.archived) return false;
    if (statusFilter === "archived" && !a.archived) return false;
    if (roleFilter !== "all" && a.jobTitle !== roleFilter) return false;
    return true;
  });

  async function handleToggleArchived(id: string) {
    setBusy(id);
    setError(null);
    try {
      await toggleJobApplicationArchived(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update application");
    } finally {
      setBusy(null);
    }
  }

  if (applications.length === 0) return <p className="sub">No applications yet.</p>;

  return (
    <>
      {error && <p className="sub" style={{ color: "#b23b3b" }}>{error}</p>}

      <div className="edit-inline-form" style={{ marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "active" | "archived" | "all")}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          {allRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="sub">No applications match these filters.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Role</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>CV</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <Fragment key={a.id}>
                <tr>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>{a.jobTitle}</td>
                  <td>{a.fullName}</td>
                  <td>{a.email}</td>
                  <td>{a.phone ?? "-"}</td>
                  <td>
                    <a href={a.cvPath} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  </td>
                  <td>
                    {a.coverNote && (
                      <button className="action" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                        {expanded === a.id ? "Hide note" : "Cover note"}
                      </button>
                    )}
                  </td>
                  <td>
                    <button className="action" disabled={busy === a.id} onClick={() => handleToggleArchived(a.id)}>
                      {busy === a.id ? "..." : a.archived ? "Unarchive" : "Archive"}
                    </button>
                  </td>
                </tr>
                {expanded === a.id && a.coverNote && (
                  <tr>
                    <td colSpan={8} style={{ whiteSpace: "pre-wrap" }}>
                      {a.coverNote}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
