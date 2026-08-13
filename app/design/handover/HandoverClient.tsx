"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadDesignRequestLayout, requestSiteVisit } from "@/app/actions/design";
import "../../marketing.css";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type LayoutFile = { id: string; label: string; filePath: string };

export default function HandoverClient({
  designRequestId,
  layoutFiles,
  siteVisitRequested,
  siteVisitPreferredDate,
}: {
  designRequestId: string;
  layoutFiles: LayoutFile[];
  siteVisitRequested: boolean;
  siteVisitPreferredDate: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState(layoutFiles);

  const [visitBusy, setVisitBusy] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [visitRequested, setVisitRequested] = useState(siteVisitRequested);
  const [visitDate, setVisitDate] = useState(siteVisitPreferredDate ?? "");

  async function handleUpload() {
    setError(null);
    if (mode === "file") {
      if (!file) return;
      if (file.size > MAX_UPLOAD_BYTES) {
        setError("File is too large - please keep it under 10MB");
        return;
      }
    } else if (!link.trim()) {
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      if (mode === "file" && file) formData.append("file", file);
      if (mode === "link") formData.append("link", link.trim());
      await uploadDesignRequestLayout(designRequestId, formData);
      setFiles((prev) => [
        ...prev,
        mode === "file" && file
          ? { id: `${Date.now()}`, label: file.name, filePath: "" }
          : { id: `${Date.now()}`, label: link.trim(), filePath: link.trim() },
      ]);
      setFile(null);
      setLink("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload file");
    } finally {
      setBusy(false);
    }
  }

  async function handleSiteVisit() {
    setVisitBusy(true);
    setVisitError(null);
    try {
      await requestSiteVisit(designRequestId, visitDate || undefined);
      setVisitRequested(true);
    } catch (e) {
      setVisitError(e instanceof Error ? e.message : "Could not request a site visit");
    } finally {
      setVisitBusy(false);
    }
  }

  return (
    <div className="ptb-marketing">
      <header>
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
      </header>
      <main>
        <div className="hero">
          <span className="hero-eyebrow">Almost there</span>
          <h1>Share your office layout</h1>
          <p>
            Upload a floor plan (PDF, AutoCAD, or a sketch) so your designer has something to work from - or request
            a site visit if you don&apos;t have one. You can add more files or change your mind any time before you
            continue to payment.
          </p>
        </div>

        <div className="sqft-input-card" style={{ maxWidth: 480 }}>
          <h3 style={{ marginTop: 0 }}>Upload a layout</h3>

          {files.length > 0 && (
            <ul className="handover-file-list">
              {files.map((f) => (
                <li key={f.id}>
                  {f.filePath ? (
                    <a href={f.filePath} target="_blank" rel="noreferrer">
                      {f.label}
                    </a>
                  ) : (
                    f.label
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="handover-mode-toggle">
            <button type="button" className={mode === "file" ? "active" : ""} onClick={() => setMode("file")}>
              Upload a file
            </button>
            <button type="button" className={mode === "link" ? "active" : ""} onClick={() => setMode("link")}>
              Paste a link
            </button>
          </div>

          {mode === "file" ? (
            <div className="handover-upload-row">
              <input
                type="file"
                accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button className="design-start-btn" disabled={!file || busy} onClick={handleUpload}>
                {busy ? "Uploading…" : "Upload"}
              </button>
            </div>
          ) : (
            <div className="handover-upload-row">
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <button className="design-start-btn" disabled={!link.trim() || busy} onClick={handleUpload}>
                {busy ? "Saving…" : "Save link"}
              </button>
            </div>
          )}
          <p className="sqft-hint">Max file size 10MB.</p>
          {error && <p className="sqft-hint">{error}</p>}
        </div>

        <div className="handover-divider">or</div>

        <div className="sqft-input-card" style={{ maxWidth: 480 }}>
          <h3 style={{ marginTop: 0 }}>Request a site visit — AED 500</h3>
          {visitRequested ? (
            <p style={{ textAlign: "center" }}>
              Site visit requested{visitDate ? ` for ${visitDate}` : ""}. A Captain will arrange a time to visit and
              create the layout for you (AED 500 added to your total).
            </p>
          ) : (
            <>
              <label className="handover-date-label">
                Preferred date (optional)
                <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              </label>
              <button type="button" className="package-cta" disabled={visitBusy} onClick={handleSiteVisit}>
                {visitBusy ? "Requesting…" : "Request a site visit — AED 500"}
              </button>
              {visitError && <p className="sqft-hint">{visitError}</p>}
            </>
          )}
        </div>

        <div className="style-finder-banner" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
          <div>
            <p className="style-finder-banner-text">Not sure of your style yet?</p>
            <p className="style-finder-banner-sub">Swipe through real office looks — takes 2 minutes.</p>
          </div>
          <Link
            href={`/design/style-finder?return=${encodeURIComponent(`/design/handover?id=${designRequestId}`)}`}
            className="style-finder-banner-cta"
          >
            Find my style →
          </Link>
        </div>

        <div style={{ maxWidth: 480, margin: "24px auto 0" }}>
          <button
            className="design-start-btn"
            style={{ width: "100%" }}
            disabled={files.length === 0 && !visitRequested}
            onClick={() => router.push(`/design/checkout?id=${designRequestId}`)}
          >
            Continue to payment →
          </button>
        </div>
      </main>
    </div>
  );
}
