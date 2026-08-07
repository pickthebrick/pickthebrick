"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitContractorApplication, deleteContractorApplication } from "@/app/actions/contractors";
import ContractorTermsSection from "./ContractorTermsSection";

type Category = { id: string; label: string };
type Type = { id: string; categoryId: string; label: string };
type Status = "pending" | "approved" | "rejected" | "blocked";
type Application = {
  status: Status;
  reviewNote: string | null;
  licenseFilePath: string;
  submittedAt: Date;
  companyName: string | null;
  contactPhone: string | null;
  officeLocation: string | null;
  categoryIds: string[];
  typeIds: string[];
} | null;

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Not approved",
  blocked: "Blocked",
};

type Defaults = { name: string; company: string; phone: string };

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

export default function ContractorApplyClient({
  categories,
  types,
  application,
  defaults,
}: {
  categories: Category[];
  types: Type[];
  application: Application;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(application?.categoryIds ?? []));
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(application?.typeIds ?? []));
  const [fileName, setFileName] = useState<string | null>(null);
  const [name, setName] = useState(defaults.name);
  const [company, setCompany] = useState(application?.companyName ?? defaults.company);
  const [phone, setPhone] = useState(application?.contactPhone ?? defaults.phone);
  const [officeLocation, setOfficeLocation] = useState(application?.officeLocation ?? "");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const canApply = !application || application.status === "rejected";

  async function handleDelete() {
    setError(null);
    try {
      await deleteContractorApplication();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your application");
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedTypes((prevTypes) => {
          const nextTypes = new Set(prevTypes);
          for (const t of types) if (t.categoryId === id) nextTypes.delete(t.id);
          return nextTypes;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleType(id: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !company.trim() || !phone.trim() || !officeLocation.trim()) {
      setError("Please fill in your name, company name, contact phone, and office location");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one category");
      return;
    }
    for (const categoryId of selected) {
      if (!types.some((t) => t.categoryId === categoryId && selectedTypes.has(t.id))) {
        const label = categories.find((c) => c.id === categoryId)?.label ?? "that category";
        setError(`Select at least one type for ${label}`);
        return;
      }
    }
    if (!agreedToTerms) {
      setError("Please agree to the Partner Terms & Conditions first");
      return;
    }
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await submitContractorApplication(Array.from(selected), Array.from(selectedTypes), formData);
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
          <div className="apply-card-title">📋 Business details</div>
          <div className="edit-inline-form">
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              name="company"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <input
              type="text"
              name="phone"
              placeholder="Contact phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              type="text"
              name="officeLocation"
              placeholder="Office location"
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="apply-card">
          <div className="apply-card-title">🧱 Categories you can work in</div>
          <p className="apply-card-hint">Check a category, then pick the specific types within it you&apos;re equipped for.</p>
          <div className="contractor-category-list">
            {categories.map((c) => {
              const typeOptions = types.filter((t) => t.categoryId === c.id);
              return (
                <div key={c.id} className="contractor-category-block">
                  <label className="edit-checkbox-label">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                    {c.label}
                  </label>
                  {selected.has(c.id) && typeOptions.length > 0 && (
                    <div className="contractor-type-grid">
                      {typeOptions.map((t) => (
                        <label key={t.id} className="edit-checkbox-label">
                          <input type="checkbox" checked={selectedTypes.has(t.id)} onChange={() => toggleType(t.id)} />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="apply-card">
          <div className="apply-card-title">📄 Trade license</div>
          <p className="apply-card-hint">A copy of your valid UAE trade license, as a PDF, JPG, or PNG.</p>
          <label className="file-picker">
            {fileName ?? "Choose file (PDF, JPG, or PNG)"}
            <input
              type="file"
              name="license"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
        </div>

        <div className="apply-card">
          <ContractorTermsSection agreed={agreedToTerms} onAgreedChange={setAgreedToTerms} />
        </div>

        <button
          type="submit"
          className="action"
          disabled={isPending || !agreedToTerms}
          title={!agreedToTerms ? "Please agree to the Partner Terms & Conditions first" : undefined}
          style={{ marginTop: 4 }}
        >
          {isPending ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </>
  );
}
