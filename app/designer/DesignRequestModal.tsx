"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitDesignRevision, deleteDesignRequestFile, deliverDesignRequest, addDesignRequestRevisionComment } from "@/app/actions/design";
import { PACKAGE_LABELS } from "@/lib/spaces";
import { MAX_REVISIONS, type PackageKey } from "@/lib/designPricing";
import type { DesignRequestRow } from "./DesignerClient";

// Keep in sync with DESIGNER_FILE_DELETE_WINDOW_MS in app/actions/design.ts.
const DESIGNER_FILE_DELETE_WINDOW_MS = 10 * 60 * 1000;
// Client's own reference upload - shown separately on the dashboard's row
// "Details" toggle (see DesignerClient.tsx), not editable here.
const CLIENT_UPLOAD_PREFIX = "Client layout upload:";

export default function DesignRequestModal({
  request,
  onClose,
  readOnly = false,
}: {
  request: DesignRequestRow;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileFormRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentChannel, setCommentChannel] = useState<"text" | "call">("call");
  // Snapshot "now" once per mount rather than calling Date.now() during
  // render (impure) - good enough since router.refresh() remounts data
  // after every action anyway, so this never needs to tick live.
  const [now] = useState(() => Date.now());
  const submittalFiles = request.files.filter((f) => !f.label.startsWith(CLIENT_UPLOAD_PREFIX));

  const maxRevisions = MAX_REVISIONS[request.packageKey as PackageKey];
  const atRevisionCap = maxRevisions != null && request.revisionsUsed >= maxRevisions;
  const commentSinceLastRevision =
    request.revisionsUsed === 0 ||
    request.revisionComments.some(
      (c) => !request.lastRevisionAt || new Date(c.createdAt).getTime() > new Date(request.lastRevisionAt).getTime(),
    );
  const sortedComments = [...request.revisionComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  function run(fn: () => Promise<void>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        onDone?.();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!(formData.get("file") as File | null)?.size) {
      setError("Please choose a file first");
      return;
    }
    const label = String(formData.get("label") ?? "");
    run(
      () => submitDesignRevision(request.id, label, formData),
      () => {
        fileFormRef.current?.reset();
        setFileName(null);
      },
    );
  }

  function handleAddComment() {
    if (!commentBody.trim()) return;
    run(() => addDesignRequestRevisionComment(request.id, commentBody, commentChannel), () => setCommentBody(""));
  }

  function handleDeliver() {
    run(() => deliverDesignRequest(request.id), onClose);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title" style={{ marginBottom: 0 }}>
            {request.client.fullName ?? request.client.email}
          </div>
          <div className="modal-close" onClick={onClose}>
            &times;
          </div>
        </div>
        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}

          <div className="designer-package-summary">
            {PACKAGE_LABELS[request.packageKey] ?? request.packageKey} package &middot; {request.sqft.toLocaleString()} sqft
            &middot; Revisions {request.revisionsUsed}/{maxRevisions ?? "unlimited"}
          </div>

          <div className="modal-section-label" style={{ marginTop: 0 }}>
            Submittal files
          </div>
          {submittalFiles.length === 0 ? (
            <div className="empty">No files uploaded yet - the client won&apos;t see anything until you deliver.</div>
          ) : (
            <ul className="edit-list">
              {submittalFiles.map((f) => {
                const deletable = now - new Date(f.createdAt).getTime() <= DESIGNER_FILE_DELETE_WINDOW_MS;
                return (
                  <li key={f.id}>
                    <a href={f.filePath} target="_blank" rel="noopener noreferrer">
                      {f.label}
                    </a>
                    <span className="sub" style={{ marginBottom: 0, marginLeft: 8 }}>
                      {new Date(f.createdAt).toLocaleString()}
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        className="danger"
                        disabled={isPending || !deletable}
                        title={deletable ? undefined : "Files can only be self-deleted within 10 minutes of upload - ask an admin to remove it now"}
                        onClick={() => run(() => deleteDesignRequestFile(f.id))}
                      >
                        &times;
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!readOnly && (
            <>
              {atRevisionCap ? (
                <p className="sub">
                  This package&apos;s revision limit has been reached - the client needs to upgrade for more revisions.
                </p>
              ) : !commentSinceLastRevision ? (
                <p className="sub">Log the client&apos;s feedback on the last revision below before uploading the next one.</p>
              ) : (
                <form ref={fileFormRef} onSubmit={handleUpload} className="edit-inline-form">
                  <input type="text" name="label" placeholder="Label, e.g. Concept layout PDF" required />
                  <label className="file-picker">
                    {fileName ?? "Choose file"}
                    <input type="file" name="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
                  </label>
                  <button type="submit" className="action" disabled={isPending}>
                    Upload revision
                  </button>
                </form>
              )}

              <button
                type="button"
                className="modal-addbtn"
                disabled={isPending || submittalFiles.length === 0}
                title={submittalFiles.length === 0 ? "Upload at least one file first" : undefined}
                onClick={handleDeliver}
              >
                {isPending ? "Working..." : "Mark delivered"}
              </button>
            </>
          )}

          <div className="modal-section-label">Revision feedback log</div>
          {sortedComments.length === 0 ? (
            <div className="empty">No feedback logged yet.</div>
          ) : (
            <ul className="revision-comment-list">
              {sortedComments.map((c) => (
                <li key={c.id} className="revision-comment">
                  <span className={`status-badge ${c.authorRole}`}>{c.authorRole}</span>
                  {c.channel === "call" && <span className="sub" style={{ marginBottom: 0 }}>(call summary)</span>}
                  <span className="sub" style={{ marginBottom: 0, marginLeft: "auto" }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>{c.body}</p>
                </li>
              ))}
            </ul>
          )}
          {!readOnly && (
            <div className="edit-inline-form" style={{ flexWrap: "wrap" }}>
              <select value={commentChannel} onChange={(e) => setCommentChannel(e.target.value as "text" | "call")}>
                <option value="call">Summarize a call</option>
                <option value="text">Log a text note</option>
              </select>
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="What did the client ask to change?"
                rows={2}
                style={{ flex: "1 1 100%" }}
              />
              <button type="button" className="action" disabled={isPending || !commentBody.trim()} onClick={handleAddComment}>
                Log feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
