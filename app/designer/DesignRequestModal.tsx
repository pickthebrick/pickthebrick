"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDesignRequestFile, deleteDesignRequestFile, deliverDesignRequest } from "@/app/actions/design";
import { PACKAGE_LABELS, spaceKeysToLabels } from "@/lib/spaces";
import type { DesignRequestRow } from "./DesignerClient";

export default function DesignRequestModal({ request, onClose }: { request: DesignRequestRow; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileFormRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
      () => addDesignRequestFile(request.id, label, formData),
      () => {
        fileFormRef.current?.reset();
        setFileName(null);
      },
    );
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

          <div className="sqft-input-card" style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 4 }}>
              {PACKAGE_LABELS[request.packageKey] ?? request.packageKey} package &middot;{" "}
              {request.sqft.toLocaleString()} sqft
            </p>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Spaces: {spaceKeysToLabels(request.spaces).join(", ") || "-"}
            </p>
          </div>

          <div className="modal-section-label">Submittal files</div>
          {request.files.length === 0 ? (
            <div className="empty">No files uploaded yet - the client won&apos;t see anything until you deliver.</div>
          ) : (
            <ul className="edit-list">
              {request.files.map((f) => (
                <li key={f.id}>
                  <a href={f.filePath} target="_blank" rel="noopener noreferrer">
                    {f.label}
                  </a>
                  <button
                    type="button"
                    className="danger"
                    disabled={isPending}
                    onClick={() => run(() => deleteDesignRequestFile(f.id))}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form ref={fileFormRef} onSubmit={handleUpload} className="edit-inline-form">
            <input type="text" name="label" placeholder="Label, e.g. Concept layout PDF" required />
            <label className="file-picker">
              {fileName ?? "Choose file"}
              <input type="file" name="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
            </label>
            <button type="submit" className="action" disabled={isPending}>
              Upload file
            </button>
          </form>

          <button
            type="button"
            className="modal-addbtn"
            disabled={isPending || request.files.length === 0}
            title={request.files.length === 0 ? "Upload at least one file first" : undefined}
            onClick={handleDeliver}
          >
            {isPending ? "Working..." : "Mark delivered"}
          </button>
        </div>
      </div>
    </div>
  );
}
