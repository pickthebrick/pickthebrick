"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitDesignerApplication, deleteDesignerApplication } from "@/app/actions/designers";

type Status = "pending" | "approved" | "rejected" | "blocked";
type Application = {
  status: Status;
  reviewNote: string | null;
  submittedAt: Date;
  knowsRevit: boolean;
  location: string | null;
  country: string | null;
  whatsappNumber: string | null;
  portfolioUrl: string | null;
  cvFilePath: string | null;
} | null;

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Not approved",
  blocked: "Blocked",
};

type Defaults = { name: string; whatsappNumber: string };

function DeleteApplicationButton({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button className="action danger" onClick={() => setConfirming(true)}>
        Delete registration
      </button>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>Sure? This can&apos;t be undone.</span>
      <button className="action" disabled={busy} onClick={() => setConfirming(false)}>
        No
      </button>
      <button
        className="action danger"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onDeleted();
          setBusy(false);
        }}
      >
        {busy ? "..." : "Yes, delete"}
      </button>
    </span>
  );
}

export default function DesignerApplyClient({ application, defaults }: { application: Application; defaults: Defaults }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [name, setName] = useState(defaults.name);
  const [location, setLocation] = useState(application?.location ?? "");
  const [country, setCountry] = useState(application?.country ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(application?.whatsappNumber ?? defaults.whatsappNumber);
  const [portfolioUrl, setPortfolioUrl] = useState(application?.portfolioUrl ?? "");
  const [cvLink, setCvLink] = useState(application?.cvFilePath?.startsWith("http") ? application.cvFilePath : "");
  const [knowsRevit, setKnowsRevit] = useState(application?.knowsRevit ?? false);
  const [acknowledged, setAcknowledged] = useState(false);

  const canApply = !application || application.status === "rejected";

  async function handleDelete() {
    setError(null);
    try {
      await deleteDesignerApplication();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your application");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !country.trim() || !whatsappNumber.trim() || !portfolioUrl.trim()) {
      setError("Please fill in your name, location, country, WhatsApp number, and portfolio link");
      return;
    }
    if (!acknowledged) {
      setError("Please confirm you understand this is project-based work, not full-time employment");
      return;
    }
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await submitDesignerApplication(formData);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not submit your application");
      }
    });
  }

  if (!canApply && application) {
    return (
      <div className="application-status-card">
        <span className={`status-badge ${application.status}`}>{STATUS_LABEL[application.status]}</span>
        <p className="sub">Submitted {new Date(application.submittedAt).toLocaleDateString()}</p>
        {application.reviewNote && <p>Note from our team: {application.reviewNote}</p>}
        <div style={{ marginTop: 14 }}>
          {error && <p className="form-error">{error}</p>}
          <DeleteApplicationButton onDeleted={handleDelete} />
        </div>
      </div>
    );
  }

  return (
    <>
      {application?.status === "rejected" && (
        <div className="application-status-card" style={{ marginBottom: 20 }}>
          <span className="status-badge rejected">Not approved</span>
          {application.reviewNote && <p>Note from our team: {application.reviewNote}</p>}
          <p className="sub">You can update your application and resubmit below, or delete it and start fresh.</p>
          <DeleteApplicationButton onDeleted={handleDelete} />
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="apply-card">
          <div className="apply-card-title">📋 About you</div>
          <div className="edit-inline-form">
            <input type="text" name="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              type="text"
              name="location"
              placeholder="Location (e.g. Dubai)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <input type="text" name="country" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            <input
              type="text"
              name="whatsappNumber"
              placeholder="WhatsApp number"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </div>
          <label className="edit-checkbox-label" style={{ marginTop: 10 }}>
            <input type="checkbox" name="knowsRevit" checked={knowsRevit} onChange={(e) => setKnowsRevit(e.target.checked)} />
            I know how to use Revit
          </label>
        </div>

        <div className="apply-card">
          <div className="apply-card-title">🔗 Portfolio</div>
          <p className="apply-card-hint">A link to your portfolio - Behance, a website, a shared drive folder, anything that shows your work.</p>
          <input
            type="text"
            name="portfolioUrl"
            placeholder="https://..."
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
        </div>

        <div className="apply-card">
          <div className="apply-card-title">📄 CV</div>
          <p className="apply-card-hint">Upload a file, or paste a link instead (PDF, DOC, JPG, or PNG).</p>
          <label className="file-picker">
            {fileName ?? "Choose file (PDF, DOC, JPG, or PNG)"}
            <input type="file" name="cv" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
          </label>
          <input
            type="text"
            name="cvLink"
            placeholder="or paste a link to your CV"
            value={cvLink}
            onChange={(e) => setCvLink(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>

        <div className="apply-card">
          <label className="edit-checkbox-label">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            I understand this is project-based freelance work, not full-time employment, and that training is
            provided once my application is approved.
          </label>
        </div>

        <button type="submit" className="action" disabled={isPending || !acknowledged} style={{ marginTop: 4 }}>
          {isPending ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </>
  );
}
