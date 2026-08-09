"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { claimDesignRequest } from "@/app/actions/design";
import { contactLabel } from "@/lib/contactLabel";
import { PACKAGE_LABELS, groupSpaceEntries } from "@/lib/spaces";
import { MAX_REVISIONS, type PackageKey } from "@/lib/designPricing";
import SpaceRequirements from "./SpaceRequirements";
import DesignRequestModal from "./DesignRequestModal";
import StyleProfileSummary from "@/app/components/StyleProfileSummary";

export type DesignRequestFile = { id: string; label: string; filePath: string; createdAt: Date };
export type DesignRequestSpaceAnswer = { questionKey: string; value: string };
export type DesignRequestSpaceRow = { id: string; spaceKey: string; notes: string | null; answers: DesignRequestSpaceAnswer[] };
export type RevisionComment = { id: string; authorRole: string; body: string; channel: string; createdAt: Date };

export type DesignRequestRow = {
  id: string;
  packageKey: string;
  sqft: number;
  status: string;
  submittedAt: Date | null;
  claimDeadline: Date | null;
  siteVisitRequested: boolean;
  revisionsUsed: number;
  lastRevisionAt: Date | null;
  client: { fullName: string | null; email: string; company: string | null } | null;
  contactPhone: string | null;
  contactEmail: string | null;
  files: DesignRequestFile[];
  spaceEntries: DesignRequestSpaceRow[];
  revisionComments: RevisionComment[];
  styleFinderResult: {
    topStyle: string | null;
    stats: { styleKey: string; shown: number; liked: number }[];
  } | null;
};

const CLIENT_UPLOAD_PREFIX = "Client layout upload:";

function isOverdue(r: DesignRequestRow) {
  return r.status === "in_progress" && !!r.claimDeadline && new Date(r.claimDeadline).getTime() < Date.now();
}

function clientLayoutFiles(r: DesignRequestRow) {
  return r.files.filter((f) => f.label.startsWith(CLIENT_UPLOAD_PREFIX));
}

function submittalFiles(r: DesignRequestRow) {
  return r.files.filter((f) => !f.label.startsWith(CLIENT_UPLOAD_PREFIX));
}

function revisionsLabel(r: DesignRequestRow) {
  const max = MAX_REVISIONS[r.packageKey as PackageKey];
  return `Rev ${r.revisionsUsed}/${max ?? "∞"}`;
}

// Shown inline under any request row, in every section - the client's
// as-built drawings (if uploaded) plus their per-space sub-selections from
// the Features wizard, so a designer can see the existing layout and exactly
// what was asked for before claiming or delivering, without opening the
// file-management modal.
function DetailsPanel({ request }: { request: DesignRequestRow }) {
  const layoutFiles = clientLayoutFiles(request);
  return (
    <div style={{ padding: "10px 4px" }}>
      <div className="modal-section-label" style={{ marginTop: 0 }}>
        Client-uploaded layout
      </div>
      {layoutFiles.length > 0 ? (
        layoutFiles.map((f) => (
          <div key={f.id} style={{ fontSize: 12, padding: "4px 0" }}>
            <a href={f.filePath} target="_blank" rel="noopener noreferrer">
              {f.label.replace(`${CLIENT_UPLOAD_PREFIX} `, "")}
            </a>
          </div>
        ))
      ) : request.siteVisitRequested ? (
        <div style={{ fontSize: 12, padding: "4px 0" }}>No layout uploaded - the client requested a site visit instead.</div>
      ) : (
        <div style={{ fontSize: 12, padding: "4px 0" }}>No layout uploaded yet.</div>
      )}

      <div className="modal-section-label">Space requirements</div>
      <SpaceRequirements spaceEntries={request.spaceEntries} />

      <div className="modal-section-label">Style profile</div>
      {request.styleFinderResult ? (
        <StyleProfileSummary topStyle={request.styleFinderResult.topStyle} stats={request.styleFinderResult.stats} />
      ) : (
        <div style={{ fontSize: 12, padding: "4px 0" }}>Client hasn&apos;t taken the Style Finder yet.</div>
      )}
    </div>
  );
}

export default function DesignerClient({ requests }: { requests: DesignRequestRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [managing, setManaging] = useState<DesignRequestRow | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const newRequests = requests.filter((r) => r.status === "submitted");
  const inProgress = requests.filter((r) => r.status === "in_progress");
  const delivered = requests.filter((r) => r.status === "delivered");

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

  function toggleExpanded(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function DetailsToggle({ request }: { request: DesignRequestRow }) {
    const fileCount = clientLayoutFiles(request).length;
    return (
      <button className="signout" style={{ fontSize: 11, color: "var(--muted)" }} onClick={() => toggleExpanded(request.id)}>
        {expanded === request.id ? "Hide details" : `Details${fileCount > 0 ? ` (${fileCount} file${fileCount === 1 ? "" : "s"})` : ""}`}
      </button>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {newRequests.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>
                    {contactLabel(r)}
                    <div className="sub">{r.client?.company ?? r.client?.email ?? r.contactPhone ?? r.contactEmail ?? "No account"}</div>
                  </td>
                  <td>{PACKAGE_LABELS[r.packageKey] ?? r.packageKey}</td>
                  <td>{r.sqft.toLocaleString()} sqft</td>
                  <td style={{ maxWidth: 220 }}>{groupSpaceEntries(r.spaceEntries) || "-"}</td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <DetailsToggle request={r} />
                  </td>
                  <td>
                    <button className="action" disabled={busy === r.id} onClick={() => handleClaim(r.id)}>
                      {busy === r.id ? "Claiming..." : "Claim"}
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr>
                    <td colSpan={7} style={{ background: "var(--bg)" }}>
                      <DetailsPanel request={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
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
              <th>Deadline</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inProgress.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>
                    {contactLabel(r)}
                    <div className="sub">{r.client?.company ?? r.client?.email ?? r.contactPhone ?? r.contactEmail ?? "No account"}</div>
                  </td>
                  <td>
                    {PACKAGE_LABELS[r.packageKey] ?? r.packageKey}
                    <div className="sub">{revisionsLabel(r)}</div>
                  </td>
                  <td>{r.sqft.toLocaleString()} sqft</td>
                  <td style={{ maxWidth: 220 }}>{groupSpaceEntries(r.spaceEntries) || "-"}</td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}</td>
                  <td style={isOverdue(r) ? { color: "#b91c1c", fontWeight: 700 } : undefined}>
                    {r.claimDeadline ? new Date(r.claimDeadline).toLocaleString() : "-"}
                    {isOverdue(r) && " (overdue)"}
                  </td>
                  <td>
                    <DetailsToggle request={r} />
                  </td>
                  <td>
                    <button className="action" onClick={() => setManaging(r)}>
                      Manage ({submittalFiles(r).length} file{submittalFiles(r).length === 1 ? "" : "s"})
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr>
                    <td colSpan={8} style={{ background: "var(--bg)" }}>
                      <DetailsPanel request={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: 16, marginTop: 32, marginBottom: 8 }}>Delivered</h2>
      {delivered.length === 0 ? (
        <div className="empty">Nothing delivered yet.</div>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {delivered.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>
                    {contactLabel(r)}
                    <div className="sub">{r.client?.company ?? r.client?.email ?? r.contactPhone ?? r.contactEmail ?? "No account"}</div>
                  </td>
                  <td>
                    {PACKAGE_LABELS[r.packageKey] ?? r.packageKey}
                    <div className="sub">{revisionsLabel(r)}</div>
                  </td>
                  <td>{r.sqft.toLocaleString()} sqft</td>
                  <td style={{ maxWidth: 220 }}>{groupSpaceEntries(r.spaceEntries) || "-"}</td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <DetailsToggle request={r} />
                  </td>
                  <td>
                    <button className="action" onClick={() => setManaging(r)}>
                      View files ({submittalFiles(r).length})
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr>
                    <td colSpan={7} style={{ background: "var(--bg)" }}>
                      <DetailsPanel request={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      {managing && (
        <DesignRequestModal request={managing} onClose={() => setManaging(null)} readOnly={managing.status === "delivered"} />
      )}
    </>
  );
}
