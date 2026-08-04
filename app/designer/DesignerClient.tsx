"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { claimDesignRequest } from "@/app/actions/design";
import { PACKAGE_LABELS, spaceKeysToLabels } from "@/lib/spaces";
import DesignRequestModal from "./DesignRequestModal";

export type DesignRequestFile = { id: string; label: string; filePath: string };

export type DesignRequestRow = {
  id: string;
  packageKey: string;
  sqft: number;
  spaces: string;
  status: string;
  submittedAt: Date | null;
  client: { fullName: string | null; email: string; company: string | null };
  files: DesignRequestFile[];
};

export default function DesignerClient({ requests }: { requests: DesignRequestRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [managing, setManaging] = useState<DesignRequestRow | null>(null);

  const newRequests = requests.filter((r) => r.status === "submitted");
  const inProgress = requests.filter((r) => r.status === "in_progress");

  async function handleClaim(id: string) {
    setBusy(id);
    setError(null);
    try {
      await claimDesignRequest(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not claim this request");
    } finally {
      setBusy(null);
    }
  }

  function renderRow(r: DesignRequestRow, action: ReactNode) {
    return (
      <tr key={r.id}>
        <td>
          {r.client.fullName ?? r.client.email}
          <div className="sub">{r.client.company ?? r.client.email}</div>
        </td>
        <td>{PACKAGE_LABELS[r.packageKey] ?? r.packageKey}</td>
        <td>{r.sqft.toLocaleString()} sqft</td>
        <td style={{ maxWidth: 240 }}>{spaceKeysToLabels(r.spaces).join(", ") || "-"}</td>
        <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}</td>
        <td>{action}</td>
      </tr>
    );
  }

  return (
    <>
      {error && <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>}

      <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 8 }}>New requests</h2>
      {newRequests.length === 0 ? (
        <div className="empty">Nothing new right now.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Package</th>
              <th>Size</th>
              <th>Spaces</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {newRequests.map((r) =>
              renderRow(
                r,
                <button className="action" disabled={busy === r.id} onClick={() => handleClaim(r.id)}>
                  {busy === r.id ? "Claiming..." : "Claim"}
                </button>,
              ),
            )}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: 16, marginTop: 32, marginBottom: 8 }}>In progress</h2>
      {inProgress.length === 0 ? (
        <div className="empty">Nothing in progress.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Package</th>
              <th>Size</th>
              <th>Spaces</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inProgress.map((r) =>
              renderRow(
                r,
                <button className="action" onClick={() => setManaging(r)}>
                  Manage ({r.files.length} file{r.files.length === 1 ? "" : "s"})
                </button>,
              ),
            )}
          </tbody>
        </table>
      )}

      {managing && <DesignRequestModal request={managing} onClose={() => setManaging(null)} />}
    </>
  );
}
