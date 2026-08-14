"use client";

import { useState } from "react";
import type { Unit } from "@/app/generated/prisma/enums";
import type { CartLine } from "@/lib/quotes";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--bg)",
  color: "var(--fg)",
};

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "sqm", label: "sqm" },
  { value: "lm", label: "lm" },
  { value: "count", label: "Nos (count)" },
];

// Contractor-only: lets them type a line item of their own (not picked from
// the catalog) into a quote they're building for their client - see
// contractorUpsertManualItem in app/actions/quotes.ts. Deliberately asks for
// nothing image-related: these items never have a picture, unlike every
// catalog-linked line (see the item-thumb-blank fallback in BuildClient.tsx).
export default function ManualItemModal({
  categories,
  initial,
  onSave,
  onClose,
}: {
  categories: string[];
  // null when adding a new item; the existing line when editing one.
  initial: CartLine | null;
  onSave: (input: { itemId?: string; name: string; categoryLabel: string; rate: number; unit: Unit; qty: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryLabel, setCategoryLabel] = useState(initial?.categoryLabel ?? categories[0] ?? "");
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? "count");
  const [rate, setRate] = useState(initial ? String(initial.rate) : "");
  const [qty, setQty] = useState(initial ? String(initial.qty) : "1");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedRate = parseFloat(rate);
    const parsedQty = parseFloat(qty);
    if (!name.trim()) {
      setError("Please give this item a name.");
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        itemId: initial?.itemId,
        name: name.trim(),
        categoryLabel,
        rate: parsedRate,
        unit,
        qty: parsedQty,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title" style={{ marginBottom: 0 }}>
            {initial ? "Edit custom item" : "Add a custom item"}
          </div>
          <div className="modal-close" onClick={onClose}>
            &times;
          </div>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
            Not in the catalog? Add it yourself - it&apos;ll show in this quote with no picture, priced however you like.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div className="modal-section-label" style={{ margin: "0 0 6px" }}>
                Item name
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Custom joinery unit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <div className="modal-section-label" style={{ margin: "0 0 6px" }}>
                Category
              </div>
              <select value={categoryLabel} onChange={(e) => setCategoryLabel(e.target.value)} style={inputStyle}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="modal-section-label" style={{ margin: "0 0 6px" }}>
                  Unit
                </div>
                <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} style={inputStyle}>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="modal-section-label" style={{ margin: "0 0 6px" }}>
                  Quantity
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0.1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <div className="modal-section-label" style={{ margin: "0 0 6px" }}>
                Price per {UNIT_OPTIONS.find((u) => u.value === unit)?.label} (AED)
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                style={inputStyle}
              />
            </div>
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            <button type="submit" className="modal-addbtn" style={{ marginTop: 6 }} disabled={saving}>
              {saving ? "Saving..." : initial ? "Save changes" : "Add item"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
