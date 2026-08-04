"use client";

import { useState } from "react";

export default function QuoteDetailsModal({
  initialLocation,
  initialOfficeSize,
  onSave,
  onClose,
  dismissable,
}: {
  initialLocation: string;
  initialOfficeSize: string;
  onSave: (location: string, officeSize: string) => Promise<void>;
  onClose: () => void;
  dismissable: boolean;
}) {
  const [location, setLocation] = useState(initialLocation);
  const [officeSize, setOfficeSize] = useState(initialOfficeSize);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim() || !officeSize.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(location.trim(), officeSize.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={dismissable ? onClose : undefined}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title" style={{ marginBottom: 0 }}>
            Tell us about your space
          </div>
          {dismissable && (
            <div className="modal-close" onClick={onClose}>
              &times;
            </div>
          )}
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
            This helps your Captain scope the fitout accurately - you can edit it any time.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div className="modal-section-label" style={{ margin: "0 0 6px" }}>
                Office location
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Business Bay, Dubai"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--fg)",
                }}
              />
            </div>
            <div>
              <div className="modal-section-label" style={{ margin: "0 0 6px" }}>
                Office size
              </div>
              <input
                type="text"
                required
                placeholder="e.g. 2,500 sqft"
                value={officeSize}
                onChange={(e) => setOfficeSize(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--fg)",
                }}
              />
            </div>
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            <button type="submit" className="modal-addbtn" style={{ marginTop: 6 }} disabled={saving}>
              {saving ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
