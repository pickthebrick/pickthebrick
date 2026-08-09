"use client";

import { useState } from "react";

const SQM_TO_SQFT = 10.7639;

// Best-effort parse of a previously-saved "2,500 sqft" / "500 sqm" string
// back into a number + unit, so re-opening the modal starts from where the
// client left off instead of a blank field. Falls back to sqft (the
// original placeholder's implicit default) if the unit can't be determined.
function parseOfficeSize(value: string): { size: string; unit: "sqft" | "sqm" } {
  const match = value.trim().match(/^([\d,]+(?:\.\d+)?)\s*(sqm|sqft)?/i);
  if (!match) return { size: "", unit: "sqft" };
  const unit = match[2]?.toLowerCase() === "sqm" ? "sqm" : "sqft";
  return { size: match[1].replace(/,/g, ""), unit };
}

export default function QuoteDetailsModal({
  initialLocation,
  initialOfficeSize,
  onSave,
  onClose,
  onSkip,
  dismissable,
}: {
  initialLocation: string;
  initialOfficeSize: string;
  onSave: (location: string, officeSize: string) => Promise<void>;
  onClose: () => void;
  // Only passed when this modal opened because "Review my quote" needed it
  // first (see BuildClient's pendingReview) - lets the client go straight to
  // review without filling this in now, rather than being stuck here.
  onSkip?: () => void;
  dismissable: boolean;
}) {
  const [location, setLocation] = useState(initialLocation);
  const parsedSize = parseOfficeSize(initialOfficeSize);
  const [sizeValue, setSizeValue] = useState(parsedSize.size);
  const [unit, setUnit] = useState<"sqft" | "sqm">(parsedSize.unit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleUnitChange(next: "sqft" | "sqm") {
    if (next === unit) return;
    const current = parseFloat(sizeValue);
    if (Number.isFinite(current) && current > 0) {
      const converted = next === "sqm" ? current / SQM_TO_SQFT : current * SQM_TO_SQFT;
      setSizeValue(String(Math.round(converted * 100) / 100));
    }
    setUnit(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const size = parseFloat(sizeValue);
    if (!location.trim() || !Number.isFinite(size) || size <= 0) {
      setError("Please fill in both fields.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(location.trim(), `${size.toLocaleString()} ${unit}`);
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
              <div className="qty-unit-input">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  required
                  min={1}
                  placeholder={unit === "sqft" ? "e.g. 2500" : "e.g. 230"}
                  value={sizeValue}
                  onChange={(e) => setSizeValue(e.target.value)}
                />
                <div className="qty-unit-toggle">
                  {(["sqft", "sqm"] as const).map((u) => (
                    <button key={u} type="button" className={unit === u ? "selected" : ""} onClick={() => handleUnitChange(u)}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            <button type="submit" className="modal-addbtn" style={{ marginTop: 6 }} disabled={saving}>
              {saving ? "Saving..." : "Continue"}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={saving}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 12.5,
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Skip for later
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
